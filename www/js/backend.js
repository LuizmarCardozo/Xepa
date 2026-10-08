import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { createSupabaseStorage } from "./supabase.js";

const firebaseConfig = {
  apiKey: "AIzaSyBUOyibPzAG8nLNu_unoJJ2PsnmpZxiV4Q",
  authDomain: "xepa-50d4b.firebaseapp.com",
  projectId: "xepa-50d4b",
  messagingSenderId: "432696375024",
  appId: "1:432696375024:web:a5c3fb9b855ad2b3ff3435",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});
const db = getFirestore(app);
const supabaseStorage = createSupabaseStorage(auth);
let resolveAuthReady;
const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve;
});
let authStateVersion = 0;

window.Auth = window.Auth || { user: null };
window.Backend = {};

async function readProfile(user) {
  const localProfile =
    JSON.parse(localStorage.getItem(`xepa-profile-${user.uid}`) || "null") ||
    {};
  try {
    const snapshot = await getDoc(doc(db, "users", user.uid));
    return snapshot.exists()
      ? { ...localProfile, ...snapshot.data() }
      : localProfile;
  } catch (error) {
    console.warn("Perfil carregado do armazenamento local:", error);
    return localProfile;
  }
}

async function syncUser(user, expectedVersion) {
  if (!user) {
    if (expectedVersion !== undefined && expectedVersion !== authStateVersion) {
      return window.Auth.user;
    }
    window.Auth.user = null;
    return null;
  }
  const profile = await readProfile(user);
  if (
    auth.currentUser?.uid !== user.uid ||
    (expectedVersion !== undefined && expectedVersion !== authStateVersion)
  ) {
    return window.Auth.user;
  }
  const appUser = {
    uid: user.uid,
    name:
      profile.name ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "Usuário",
    email: user.email || profile.email || "",
    type: profile.type || "cliente",
    document: profile.document || "",
  };
  window.Auth.user = appUser;
  return appUser;
}

function currentUser() {
  if (!auth.currentUser) throw new Error("Faça login para continuar.");
  return auth.currentUser;
}

function normalizeImageData(image) {
  if (!image) return null;
  if (typeof image !== "string") return null;
  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return null;
}

function cacheImageLocally(key, image) {
  if (!key || !image || !image.startsWith("data:image/")) return;
  try {
    localStorage.setItem(`xepa-image-cache-${key}`, image);
  } catch (error) {
    console.warn("Não foi possível guardar a imagem no cache local:", error);
  }
}

async function prepareOfferImage(image, userId, offerId, existingOffer) {
  const normalizedImage = normalizeImageData(image);
  if (normalizedImage?.startsWith("data:image/")) {
    if (supabaseStorage) {
      return supabaseStorage.uploadOfferImage(normalizedImage, userId, offerId);
    }
    return { image: normalizedImage, imagePath: null };
  }

  return {
    image: normalizedImage,
    imagePath:
      normalizedImage && normalizedImage === existingOffer?.image
        ? existingOffer.imagePath || null
        : null,
  };
}

async function removeOfferImage(path) {
  if (!path || !supabaseStorage) return;
  try {
    await supabaseStorage.deleteOfferImage(path);
  } catch (error) {
    console.warn(
      "Não foi possível remover a imagem do Supabase Storage:",
      error,
    );
  }
}

function normalizeOfferLocation(location) {
  if (!location) return null;
  const { latitude, longitude } = location;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  return { latitude, longitude };
}

window.Backend = {
  ready: () => authReady,

  login: async (email, password) => {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    await syncUser(credential.user);
    return credential.user;
  },

  loginWithGoogle: async () => {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    const existingProfile = await readProfile(credential.user);
    if (!existingProfile.type) {
      const profile = {
        name: credential.user.displayName || "Usuário",
        email: credential.user.email || "",
        type: "cliente",
      };
      try {
        await setDoc(doc(db, "users", credential.user.uid), profile, {
          merge: true,
        });
      } catch (error) {
        console.warn("Perfil do Google mantido no armazenamento local:", error);
        localStorage.setItem(
          `xepa-profile-${credential.user.uid}`,
          JSON.stringify(profile),
        );
      }
    }
    await syncUser(credential.user);
    return credential.user;
  },

  resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),

  register: async (name, email, password, type, documentNumber) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    await updateProfile(credential.user, { displayName: name.trim() });
    const profile = {
      name: name.trim(),
      email: email.trim(),
      type,
      document: documentNumber,
    };
    try {
      await setDoc(doc(db, "users", credential.user.uid), profile, {
        merge: true,
      });
    } catch (error) {
      console.warn("Perfil mantido no armazenamento local:", error);
    }
    localStorage.setItem(
      `xepa-profile-${credential.user.uid}`,
      JSON.stringify(profile),
    );
    await syncUser(credential.user);
    return credential.user;
  },

  updateProfile: async (profile) => {
    const user = currentUser();
    const name = String(profile.name || "").trim();
    if (!name) throw new Error("Informe seu nome.");
    const updated = {
      ...(window.Auth.user || {}),
      ...profile,
      name,
      uid: user.uid,
      email: user.email || profile.email || "",
    };
    await setDoc(
      doc(db, "users", user.uid),
      {
        name: updated.name,
        email: updated.email,
        document: updated.document || "",
        type: updated.type || "cliente",
      },
      { merge: true },
    );
    try {
      await updateProfile(user, { displayName: name });
    } catch (error) {
      // O perfil do Firestore é a fonte usada pelo app; Auth é só uma cópia auxiliar.
      console.warn(
        "Perfil salvo, mas o nome do Firebase Auth não foi sincronizado:",
        error,
      );
    }
    localStorage.setItem(`xepa-profile-${user.uid}`, JSON.stringify(updated));
    window.Auth.user = updated;
    return updated;
  },

  createOffer: async (offer) => {
    const user = currentUser();
    const offerRef = doc(collection(db, "offers"));
    const storedImage = await prepareOfferImage(
      offer.image,
      user.uid,
      offerRef.id,
    );
    cacheImageLocally(`offer-${offerRef.id}`, storedImage.image);
    const offerData = {
      ownerUid: user.uid,
      ownerName: window.Auth.user?.name || user.displayName || "Comerciante",
      name: offer.name.trim(),
      category: offer.category,
      unit: offer.unit || "unidade",
      price: Number(offer.price),
      oldPrice: offer.oldPrice == null ? null : Number(offer.oldPrice),
      desc: (offer.desc || "").trim(),
      image: storedImage.image,
      imagePath: storedImage.imagePath,
      location: normalizeOfferLocation(offer.location),
      active: true,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(offerRef, offerData);
    } catch (error) {
      await removeOfferImage(storedImage.imagePath);
      throw error;
    }
    return { id: offerRef.id, ...offerData };
  },

  updateOffer: async (offerId, offer) => {
    const user = currentUser();
    const offerRef = doc(db, "offers", offerId);
    const snapshot = await getDoc(offerRef);
    if (!snapshot.exists()) throw new Error("Esta oferta não existe mais.");
    const existing = snapshot.data();
    if (existing.ownerUid !== user.uid) {
      throw new Error("Você não pode editar esta oferta.");
    }

    const storedImage = await prepareOfferImage(
      offer.image,
      user.uid,
      offerId,
      existing,
    );
    cacheImageLocally(`offer-${offerId}`, storedImage.image);
    const updatedOffer = {
      ownerName: window.Auth.user?.name || user.displayName || "Comerciante",
      name: offer.name.trim(),
      category: offer.category,
      unit: offer.unit || "unidade",
      price: Number(offer.price),
      oldPrice: offer.oldPrice == null ? null : Number(offer.oldPrice),
      desc: (offer.desc || "").trim(),
      image: storedImage.image,
      imagePath: storedImage.imagePath,
      location: normalizeOfferLocation(offer.location),
      updatedAt: new Date().toISOString(),
    };
    try {
      await updateDoc(offerRef, updatedOffer);
    } catch (error) {
      if (storedImage.imagePath !== existing.imagePath) {
        await removeOfferImage(storedImage.imagePath);
      }
      throw error;
    }
    if (storedImage.imagePath !== existing.imagePath) {
      await removeOfferImage(existing.imagePath);
    }
    return { id: offerId, ...existing, ...updatedOffer };
  },

  getOffers: async () => {
    const snapshot = await getDocs(
      query(collection(db, "offers"), where("active", "==", true)),
    );
    return snapshot.docs.map((offerDoc) => ({
      id: offerDoc.id,
      ...offerDoc.data(),
    }));
  },

  getOffer: async (offerId) => {
    const snapshot = await getDoc(doc(db, "offers", offerId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  },

  getMyOffers: async () => {
    const user = currentUser();
    const snapshot = await getDocs(
      query(collection(db, "offers"), where("ownerUid", "==", user.uid)),
    );
    return snapshot.docs.map((offerDoc) => ({
      id: offerDoc.id,
      ...offerDoc.data(),
    }));
  },

  deleteOffer: async (offerId) => {
    const user = currentUser();
    const offerRef = doc(db, "offers", offerId);
    const snapshot = await getDoc(offerRef);
    if (!snapshot.exists()) throw new Error("Esta oferta não existe mais.");
    const existing = snapshot.data();
    if (existing.ownerUid !== user.uid) {
      throw new Error("Você não pode excluir esta oferta.");
    }
    await deleteDoc(offerRef);
    await removeOfferImage(existing.imagePath);
  },

  createStory: async ({ text, image }) => {
    const user = currentUser();
    const storyRef = doc(collection(db, "stories"));
    const imageUrl = normalizeImageData(image);
    cacheImageLocally(`story-${storyRef.id}`, imageUrl);
    const story = {
      ownerUid: user.uid,
      ownerName: window.Auth.user?.name || user.displayName || "Comerciante",
      text: (text || "").trim(),
      image: imageUrl,
      createdAt: new Date().toISOString(),
    };
    await setDoc(storyRef, story);
    return { id: storyRef.id, ...story };
  },

  getStories: async () => {
    const snapshot = await getDocs(
      query(collection(db, "stories"), orderBy("createdAt", "desc"), limit(30)),
    );
    return snapshot.docs
      .map((storyDoc) => ({ id: storyDoc.id, ...storyDoc.data() }))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  },

  createOrders: async (items, fulfillment, address, note) => {
    const user = currentUser();
    const groups = new Map();
    for (const item of items) {
      if (!item.ownerUid || item.ownerUid === user.uid) {
        throw new Error("Remova da cesta os produtos da sua própria conta.");
      }
      const group = groups.get(item.ownerUid) || [];
      group.push({
        offerId: item.offerId,
        name: item.name,
        unit: item.unit,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image || null,
        location: item.location || null,
      });
      groups.set(item.ownerUid, group);
    }

    const createdOrders = [];
    const batch = writeBatch(db);
    for (const [merchantUid, orderItems] of groups) {
      const total = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const order = {
        buyerUid: user.uid,
        buyerName: window.Auth.user?.name || user.displayName || "Cliente",
        merchantUid,
        merchantName:
          items.find((item) => item.ownerUid === merchantUid)?.ownerName ||
          "Comerciante",
        marketLocation:
          orderItems.find((item) => item.location)?.location || null,
        items: orderItems,
        total,
        fulfillment,
        address: fulfillment === "delivery" ? (address || "").trim() : "",
        note: (note || "").trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const orderRef = doc(collection(db, "orders"));
      batch.set(orderRef, order);
      createdOrders.push({ id: orderRef.id, ...order });
    }
    await batch.commit();
    return createdOrders;
  },

  getOrders: async () => {
    const user = currentUser();
    const [buyerSnapshot, merchantSnapshot] = await Promise.all([
      getDocs(
        query(collection(db, "orders"), where("buyerUid", "==", user.uid)),
      ),
      getDocs(
        query(collection(db, "orders"), where("merchantUid", "==", user.uid)),
      ),
    ]);
    const byId = new Map();
    for (const orderDoc of [...buyerSnapshot.docs, ...merchantSnapshot.docs]) {
      byId.set(orderDoc.id, { id: orderDoc.id, ...orderDoc.data() });
    }
    return [...byId.values()].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
  },

  watchOrders: (onChange, onError = (error) => console.error(error)) => {
    const user = currentUser();
    let buyerOrders = null;
    let merchantOrders = null;
    let active = true;
    let unsubscribeBuyer = () => {};
    let unsubscribeMerchant = () => {};

    const publish = () => {
      if (!active || !buyerOrders || !merchantOrders) return;
      const byId = new Map();
      for (const order of [...buyerOrders, ...merchantOrders]) {
        byId.set(order.id, order);
      }
      onChange(
        [...byId.values()].sort((a, b) =>
          String(b.createdAt).localeCompare(String(a.createdAt)),
        ),
      );
    };

    const fail = (error) => {
      if (!active) return;
      active = false;
      unsubscribeBuyer();
      unsubscribeMerchant();
      onError(error);
    };

    try {
      unsubscribeBuyer = onSnapshot(
        query(collection(db, "orders"), where("buyerUid", "==", user.uid)),
        (snapshot) => {
          buyerOrders = snapshot.docs.map((orderDoc) => ({
            id: orderDoc.id,
            ...orderDoc.data(),
          }));
          publish();
        },
        fail,
      );
      unsubscribeMerchant = onSnapshot(
        query(collection(db, "orders"), where("merchantUid", "==", user.uid)),
        (snapshot) => {
          merchantOrders = snapshot.docs.map((orderDoc) => ({
            id: orderDoc.id,
            ...orderDoc.data(),
          }));
          publish();
        },
        fail,
      );
    } catch (error) {
      active = false;
      unsubscribeBuyer();
      unsubscribeMerchant();
      throw error;
    }

    return () => {
      active = false;
      unsubscribeBuyer();
      unsubscribeMerchant();
    };
  },

  updateOrderStatus: async (orderId, status) => {
    currentUser();
    await updateDoc(doc(db, "orders", orderId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  logout: async () => {
    authStateVersion += 1;
    window.Auth.user = null;
    await signOut(auth);
  },
};

onAuthStateChanged(
  auth,
  async (user) => {
    const stateVersion = ++authStateVersion;
    if (window.Auth.user?.uid !== user?.uid) window.Auth.user = null;
    try {
      await syncUser(user, stateVersion);
    } catch (error) {
      console.error("Não foi possível carregar a sessão:", error);
      if (
        stateVersion === authStateVersion &&
        (!user || auth.currentUser?.uid === user.uid)
      ) {
        window.Auth.user = user
          ? {
              uid: user.uid,
              name: user.displayName || user.email?.split("@")[0] || "Usuário",
              email: user.email || "",
              type: "cliente",
            }
          : null;
      }
    } finally {
      if (stateVersion === authStateVersion) resolveAuthReady(window.Auth.user);
    }
  },
  (error) => {
    console.error("Falha ao iniciar o Firebase Auth:", error);
    resolveAuthReady(null);
  },
);
