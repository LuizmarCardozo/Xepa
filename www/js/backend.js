// Concentra a autenticação e as operações de dados usadas pela interface.
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
  signInWithRedirect,
  getRedirectResult,
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
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { createSupabaseStorage } from "./supabase.js?v=2";

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
const googleSignupSessionKey = "xepa-google-signup";
let resolveAuthReady;
const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve;
});
let authStateVersion = 0;

window.Auth = window.Auth || { user: null };
window.Backend = {};

async function ensureGoogleProfile(user) {
  const existingProfile = await readProfile(user);
  if (existingProfile.type) return;

  const profile = {
    ...existingProfile,
    name: existingProfile.name || user.displayName || "Usuário",
    email: user.email || "",
    type: "cliente",
  };
  try {
    await setDoc(doc(db, "users", user.uid), profile, { merge: true });
  } catch (error) {
    console.warn("Perfil do Google mantido no armazenamento local:", error);
    localStorage.setItem(`xepa-profile-${user.uid}`, JSON.stringify(profile));
  }
}

const googleRedirectResult = getRedirectResult(auth)
  .then(async (result) => {
    if (!result?.user) {
      sessionStorage.removeItem(googleSignupSessionKey);
      return;
    }

    const pendingSignup = sessionStorage.getItem(googleSignupSessionKey);
    if (!pendingSignup) {
      await ensureGoogleProfile(result.user);
      return;
    }

    try {
      await completeGoogleRegistration(result.user, JSON.parse(pendingSignup));
    } catch (error) {
      if (auth.currentUser?.uid === result.user.uid) {
        await signOut(auth);
      }
      throw error;
    } finally {
      sessionStorage.removeItem(googleSignupSessionKey);
    }
  })
  .catch((error) => {
    sessionStorage.removeItem(googleSignupSessionKey);
    console.error("Não foi possível concluir o login com Google:", error);
  });

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

async function completeGoogleRegistration(user, signup) {
  const {
    type,
    document: documentNumber = "",
    stallName = "",
    stallLocation = null,
  } = signup || {};
  if (type !== "cliente" && type !== "comerciante") {
    throw new Error("Selecione um perfil válido para criar sua conta.");
  }
  if (!user.email) {
    throw new Error("Não foi possível obter o e-mail da conta Google.");
  }

  const existingProfile = await readProfile(user);
  if (existingProfile.type && existingProfile.type !== type) {
    const error = new Error(
      "Esta conta Google já está cadastrada com outro perfil.",
    );
    error.code = "auth/account-type-mismatch";
    throw error;
  }

  // Só grava o que veio preenchido: no cadastro rápido com Google (passo 1)
  // CPF, banca e localização ainda não existem e serão pedidos depois.
  // Assim, uma conta já completa nunca é sobrescrita com valores vazios.
  const trimmedStallName = String(stallName).trim();
  const normalizedLocation = normalizeStallLocation(stallLocation);
  const profile = {
    name: existingProfile.name || user.displayName || user.email.split("@")[0],
    email: user.email,
    type,
    ...(documentNumber ? { document: documentNumber } : {}),
    ...(type === "comerciante"
      ? {
          ...(trimmedStallName ? { stallName: trimmedStallName } : {}),
          ...(normalizedLocation ? { stallLocation: normalizedLocation } : {}),
        }
      : {}),
  };

  try {
    await setDoc(doc(db, "users", user.uid), profile, { merge: true });
  } catch (error) {
    console.warn("Perfil mantido no armazenamento local:", error);
  }
  localStorage.setItem(
    `xepa-profile-${user.uid}`,
    JSON.stringify({ ...existingProfile, ...profile }),
  );
}

async function syncPublicMarketEntry(userId, profile) {
  const stallLocation = normalizeStallLocation(profile.stallLocation) || {};
  const normalizedImage = normalizeImageData(profile.stallImage);
  const normalizedBanner = normalizeImageData(profile.stallBanner);
  const market = {
    stallName: String(profile.stallName || "").trim() || "Banca cadastrada",
    marketName: stallLocation.marketName || "",
    city: String(stallLocation.city || "").trim(),
    state: String(stallLocation.state || "").trim(),
    reference: stallLocation.reference || "",
    image: normalizedImage?.startsWith("https://") ? normalizedImage : "",
    banner: normalizedBanner?.startsWith("https://") ? normalizedBanner : "",
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "markets", userId), market, { merge: true });
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
    stallName: profile.stallName || "",
    stallLocation: profile.stallLocation || null,
    stallImage: profile.stallImage || "",
    stallImagePath: profile.stallImagePath || "",
    stallBanner: profile.stallBanner || "",
    stallBannerPath: profile.stallBannerPath || "",
  };
  // Vendedor que entrou com Google no passo 1 ainda precisa informar
  // CPF, nome da banca e localização.
  appUser.needsCompletion =
    appUser.type === "comerciante" &&
    !(
      appUser.document &&
      appUser.stallName &&
      appUser.stallLocation?.city &&
      appUser.stallLocation?.state
    );
  window.Auth.user = appUser;
  if (appUser.type === "comerciante" && !appUser.needsCompletion) {
    try {
      await syncPublicMarketEntry(user.uid, appUser);
    } catch (error) {
      console.error(
        "Não foi possível atualizar a banca no diretório público:",
        error,
      );
    }
  }
  return appUser;
}

function currentUser() {
  if (!auth.currentUser) throw new Error("Faça login para continuar.");
  return auth.currentUser;
}

function generateOrderCode() {
  if (!window.crypto?.getRandomValues) {
    throw new Error("Não foi possível gerar o código do pedido com segurança.");
  }

  const randomValue = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / 1_000_000) * 1_000_000;
  do {
    window.crypto.getRandomValues(randomValue);
  } while (randomValue[0] >= limit);

  return String(randomValue[0] % 1_000_000).padStart(6, "0");
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

function normalizeStallLocation(location) {
  if (!location || typeof location !== "object") return null;
  const normalized = {
    marketName: String(location.marketName || "").trim(),
    city: String(location.city || "").trim(),
    state: String(location.state || "").trim(),
    reference: String(location.reference || "").trim(),
  };
  return Object.values(normalized).some(Boolean) ? normalized : null;
}

function offerStallLocation(market, savedLocation) {
  const marketHasLocationFields =
    market &&
    (Object.prototype.hasOwnProperty.call(market, "marketName") ||
      Object.prototype.hasOwnProperty.call(market, "reference"));
  if (marketHasLocationFields) {
    return normalizeStallLocation(market);
  }
  return (
    normalizeStallLocation(savedLocation) || normalizeStallLocation(market)
  );
}

window.Backend = {
  ready: () => authReady,

  // Relê o perfil do usuário no servidor (nome da banca, tipo de conta etc.).
  refreshUser: async () => {
    if (!auth.currentUser) return window.Auth.user;
    await syncUser(auth.currentUser);
    return window.Auth.user;
  },

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
    await signInWithRedirect(auth, new GoogleAuthProvider());
  },

  registerWithGoogle: async ({
    type,
    document: documentNumber = "",
    stallName = "",
    stallLocation = null,
  }) => {
    if (type !== "cliente" && type !== "comerciante") {
      throw new Error("Selecione um perfil válido para criar sua conta.");
    }

    const signup = {
      type,
      document: documentNumber,
      ...(type === "comerciante"
        ? {
            stallName: String(stallName).trim(),
            stallLocation,
          }
        : {}),
    };

    sessionStorage.setItem(googleSignupSessionKey, JSON.stringify(signup));
    try {
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (error) {
      sessionStorage.removeItem(googleSignupSessionKey);
      throw error;
    }
  },

  // Conclui o cadastro de quem entrou com Google no passo 1: nome e e-mail
  // já vieram da conta Google, aqui entram CPF, banca e localização.
  completeSellerProfile: async ({
    name = "",
    document: documentNumber = "",
    stallName = "",
    stallLocation = null,
  }) => {
    const user = currentUser();
    const existingProfile = await readProfile(user);
    if (existingProfile.type !== "comerciante") {
      throw new Error("Esta conta não é de vendedor.");
    }

    const normalizedLocation = normalizeStallLocation(stallLocation);
    const cpf = String(documentNumber).replace(/\D/g, "");
    const trimmedStallName = String(stallName).trim();
    if (cpf.length !== 11 || !trimmedStallName || !normalizedLocation?.city) {
      throw new Error("Preencha CPF, nome da banca e localização.");
    }

    const profile = {
      name:
        String(name).trim() ||
        existingProfile.name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Usuário",
      email: user.email || existingProfile.email || "",
      type: "comerciante",
      document: cpf,
      stallName: trimmedStallName,
      stallLocation: normalizedLocation,
    };

    try {
      await setDoc(doc(db, "users", user.uid), profile, { merge: true });
    } catch (error) {
      console.warn("Perfil mantido no armazenamento local:", error);
    }
    localStorage.setItem(
      `xepa-profile-${user.uid}`,
      JSON.stringify({ ...existingProfile, ...profile }),
    );
    await syncUser(user);
    return window.Auth.user;
  },

  resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),

  register: async (
    name,
    email,
    password,
    type,
    documentNumber,
    stallName = "",
    stallLocation = null,
  ) => {
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
      ...(type === "comerciante"
        ? {
            stallName: stallName.trim(),
            ...(stallLocation
              ? {
                  stallLocation: normalizeStallLocation(stallLocation),
                }
              : {}),
          }
        : {}),
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
        stallName: updated.stallName || "",
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

  updateSellerProfile: async ({
    stallName,
    stallLocation,
    profileImage,
    bannerImage,
  }) => {
    const user = currentUser();
    const normalizedStallName = String(stallName || "").trim();
    const previousProfile = window.Auth.user || {};
    const normalizedStallLocation =
      normalizeStallLocation(stallLocation) ||
      normalizeStallLocation(previousProfile.stallLocation);
    if (
      !normalizedStallName &&
      !profileImage &&
      !bannerImage &&
      !previousProfile.stallName
    ) {
      throw new Error("Informe o nome da banca ou escolha uma foto.");
    }
    if (!normalizedStallLocation) {
      throw new Error("Informe a localização da feira.");
    }
    let uploadedImage = null;
    let uploadedBanner = null;
    const cleanupUploads = async () => {
      for (const upload of [uploadedImage, uploadedBanner]) {
        if (!upload?.imagePath) continue;
        try {
          await supabaseStorage.deleteProfileImage(upload.imagePath);
        } catch (error) {
          console.warn("Não foi possível remover uma imagem não salva:", error);
        }
      }
    };
    try {
      if (profileImage || bannerImage) {
        if (!supabaseStorage) {
          throw new Error(
            "O armazenamento de imagens não está configurado. Não foi possível atualizar as imagens.",
          );
        }
        if (profileImage) {
          uploadedImage = await supabaseStorage.uploadProfileImage(
            profileImage,
            user.uid,
          );
        }
        if (bannerImage) {
          uploadedBanner = await supabaseStorage.uploadProfileImage(
            bannerImage,
            user.uid,
          );
        }
      }
    } catch (error) {
      await cleanupUploads();
      throw error;
    }

    const updated = {
      ...previousProfile,
      stallName: normalizedStallName || previousProfile.stallName || "",
      stallLocation: normalizedStallLocation,
      ...(uploadedImage
        ? {
            stallImage: uploadedImage.image,
            stallImagePath: uploadedImage.imagePath,
          }
        : {}),
      ...(uploadedBanner
        ? {
            stallBanner: uploadedBanner.image,
            stallBannerPath: uploadedBanner.imagePath,
          }
        : {}),
    };

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          stallName: updated.stallName,
          stallLocation: updated.stallLocation,
          stallImage: updated.stallImage || "",
          stallImagePath: updated.stallImagePath || "",
          stallBanner: updated.stallBanner || "",
          stallBannerPath: updated.stallBannerPath || "",
        },
        { merge: true },
      );
    } catch (error) {
      await cleanupUploads();
      throw error;
    }

    localStorage.setItem(`xepa-profile-${user.uid}`, JSON.stringify(updated));
    window.Auth.user = updated;

    try {
      await syncPublicMarketEntry(user.uid, updated);
    } catch (error) {
      console.error(
        "Perfil salvo, mas não foi possível atualizar a banca no diretório público:",
        error,
      );
    }

    const replacedImagePaths = [
      uploadedImage &&
      previousProfile.stallImagePath !== uploadedImage.imagePath
        ? previousProfile.stallImagePath
        : null,
      uploadedBanner &&
      previousProfile.stallBannerPath !== uploadedBanner.imagePath
        ? previousProfile.stallBannerPath
        : null,
    ].filter(Boolean);
    for (const imagePath of replacedImagePaths) {
      try {
        await supabaseStorage.deleteProfileImage(imagePath);
      } catch (error) {
        console.warn(
          "Não foi possível remover uma imagem anterior da banca:",
          error,
        );
      }
    }

    return updated;
  },

  // Cria o documento da oferta e associa o vendedor conectado como proprietário.
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
      stallName: window.Auth.user?.stallName || "Banca com nome não cadastrado",
      name: offer.name.trim(),
      category: offer.category,
      unit: offer.unit || "unidade",
      price: Number(offer.price),
      oldPrice: offer.oldPrice == null ? null : Number(offer.oldPrice),
      desc: (offer.desc || "").trim(),
      image: storedImage.image,
      imagePath: storedImage.imagePath,
      location: normalizeOfferLocation(offer.location),
      stallLocation: normalizeStallLocation(window.Auth.user?.stallLocation),
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

  // Antes de editar, confere se a oferta existe e pertence ao usuário.
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
      stallName: window.Auth.user?.stallName || "Banca com nome não cadastrado",
      name: offer.name.trim(),
      category: offer.category,
      unit: offer.unit || "unidade",
      price: Number(offer.price),
      oldPrice: offer.oldPrice == null ? null : Number(offer.oldPrice),
      desc: (offer.desc || "").trim(),
      image: storedImage.image,
      imagePath: storedImage.imagePath,
      location: normalizeOfferLocation(offer.location),
      stallLocation: normalizeStallLocation(window.Auth.user?.stallLocation),
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
    const offers = snapshot.docs.map((offerDoc) => ({
      id: offerDoc.id,
      ...offerDoc.data(),
    }));
    if (!offers.length) return offers;

    try {
      const marketSnapshot = await getDocs(collection(db, "markets"));
      const marketsByOwner = new Map(
        marketSnapshot.docs.map((marketDoc) => [
          marketDoc.id,
          marketDoc.data(),
        ]),
      );
      return offers.map((offer) => ({
        ...offer,
        stallLocation: offerStallLocation(
          marketsByOwner.get(offer.ownerUid),
          offer.stallLocation,
        ),
      }));
    } catch (error) {
      console.warn(
        "Não foi possível carregar a localização de algumas feiras:",
        error,
      );
      return offers.map((offer) => ({
        ...offer,
        stallLocation: normalizeStallLocation(offer.stallLocation),
      }));
    }
  },

  getOffer: async (offerId) => {
    const snapshot = await getDoc(doc(db, "offers", offerId));
    if (!snapshot.exists()) return null;
    const offer = { id: snapshot.id, ...snapshot.data() };
    try {
      const marketSnapshot = offer.ownerUid
        ? await getDoc(doc(db, "markets", offer.ownerUid))
        : null;
      return {
        ...offer,
        stallLocation: offerStallLocation(
          marketSnapshot?.exists() ? marketSnapshot.data() : null,
          offer.stallLocation,
        ),
      };
    } catch (error) {
      console.warn(
        "Não foi possível carregar a localização da feira desta oferta:",
        error,
      );
      return {
        ...offer,
        stallLocation: normalizeStallLocation(offer.stallLocation),
      };
    }
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

  // Apenas o proprietário pode excluir a oferta pelo fluxo do app.
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

  getMarkets: async () => {
    const snapshot = await getDocs(collection(db, "markets"));
    return snapshot.docs
      .map((marketDoc) => ({ id: marketDoc.id, ...marketDoc.data() }))
      .sort((a, b) =>
        String(a.stallName || "").localeCompare(
          String(b.stallName || ""),
          "pt-BR",
        ),
      );
  },

  // Dados públicos de uma banca (foto de perfil, banner, localização).
  // O id do documento em "markets" é o uid do comerciante.
  getMarket: async (marketId) => {
    if (!marketId) return null;
    const snapshot = await getDoc(doc(db, "markets", String(marketId)));
    const market = snapshot.exists()
      ? { id: snapshot.id, ...snapshot.data() }
      : null;

    // Banca vista pelo próprio dono: usa o banner do perfil já carregado.
    const own = window.Auth?.user;
    if (market && !market.banner && own?.uid === String(marketId)) {
      market.banner = normalizeImageData(own.stallBanner) || "";
    }
    // Banner ainda não copiado para o diretório público: tenta ler do
    // perfil do vendedor (se as regras permitirem; senão, segue sem banner).
    if (market && !market.banner) {
      try {
        const userSnapshot = await getDoc(doc(db, "users", String(marketId)));
        const banner = normalizeImageData(userSnapshot.data()?.stallBanner);
        if (banner) market.banner = banner;
      } catch (error) {
        console.warn("Banner do vendedor indisponível:", error);
      }
    }
    return market;
  },

  // Produtos ativos de uma banca, mais recentes primeiro.
  getStallOffers: async (ownerUid) => {
    if (!ownerUid) return [];
    const sortRecent = (list) =>
      list.sort((a, b) =>
        String(b.createdAt).localeCompare(String(a.createdAt)),
      );
    try {
      // Filtra por active == true na própria consulta (igual ao getOffers),
      // pois as regras do Firestore só liberam a leitura de ofertas ativas.
      const snapshot = await getDocs(
        query(
          collection(db, "offers"),
          where("ownerUid", "==", ownerUid),
          where("active", "==", true),
        ),
      );
      return sortRecent(
        snapshot.docs.map((offerDoc) => ({
          id: offerDoc.id,
          ...offerDoc.data(),
        })),
      );
    } catch (error) {
      console.warn("Consulta da banca falhou, usando lista geral:", error);
      const all = await window.Backend.getOffers();
      return sortRecent(all.filter((offer) => offer.ownerUid === ownerUid));
    }
  },

  // Agrupa os itens por vendedor e grava um pedido para cada grupo.
  createOrders: async (items, fulfillment, address, note, paymentMethod) => {
    const user = currentUser();
    const groups = new Map();
    for (const item of items) {
      if (!item.ownerUid || item.ownerUid === user.uid) {
        throw new Error("Remova do carrinho os produtos da sua própria conta.");
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
        stallName: item.stallName || "Banca com nome não cadastrado",
        stallLocation: normalizeStallLocation(item.stallLocation),
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
        stallName:
          items.find((item) => item.ownerUid === merchantUid)?.stallName ||
          "Banca com nome não cadastrado",
        marketLocation:
          orderItems.find((item) => item.location)?.location || null,
        stallLocation:
          orderItems.find((item) => item.stallLocation)?.stallLocation || null,
        items: orderItems,
        total,
        fulfillment,
        address: fulfillment === "delivery" ? (address || "").trim() : "",
        note: (note || "").trim(),
        paymentMethod: paymentMethod || "combinar-com-vendedor",
        orderCode: generateOrderCode(),
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
    const user = currentUser();
    const normalizedStatus = String(status || "")
      .trim()
      .toLowerCase();
    if (normalizedStatus === "delivered") {
      throw new Error("Informe o código do cliente para entregar o pedido.");
    }

    const normalizedOrderId = String(orderId || "").trim();
    if (!normalizedOrderId) throw new Error("Pedido inválido.");

    const orderRef = doc(db, "orders", normalizedOrderId);
    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists()) throw new Error("Este pedido não existe mais.");

      const order = snapshot.data();
      if (order.merchantUid !== user.uid) {
        throw new Error("Você não pode alterar este pedido.");
      }
      const currentStatus = String(order.status || "pending")
        .trim()
        .toLowerCase();
      if (currentStatus === normalizedStatus) return false;

      const update = {
        status: normalizedStatus,
        updatedAt: new Date().toISOString(),
      };
      if (normalizedStatus === "ready") update.separated = true;
      if (normalizedStatus === "accepted") update.separated = false;
      transaction.update(orderRef, update);
      return true;
    });
  },

  // Confere o código e o estado do pedido antes de marcá-lo como entregue.
  deliverOrder: async (orderId, confirmationCode) => {
    const user = currentUser();
    const normalizedOrderId = String(orderId || "").trim();
    const code = String(confirmationCode ?? "");
    if (!normalizedOrderId) throw new Error("Pedido inválido.");
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Digite o código de 6 dígitos.");
    }

    const orderRef = doc(db, "orders", normalizedOrderId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists()) throw new Error("Este pedido não existe mais.");

      const order = snapshot.data();
      if (order.merchantUid !== user.uid) {
        throw new Error("Você não pode entregar este pedido.");
      }
      if (!["pending", "accepted", "ready"].includes(order.status)) {
        throw new Error("Este pedido não pode ser entregue neste status.");
      }
      if (
        !/^\d{6}$/.test(String(order.orderCode ?? "")) ||
        code !== String(order.orderCode)
      ) {
        throw new Error("Código incorreto. Confira com o cliente.");
      }

      transaction.update(orderRef, {
        status: "delivered",
        updatedAt: new Date().toISOString(),
      });
    });
  },

  updateOrderPreparation: async (orderId, separated) => {
    const user = currentUser();
    const normalizedOrderId = String(orderId || "").trim();
    if (!normalizedOrderId) throw new Error("Pedido inválido.");
    if (typeof separated !== "boolean") {
      throw new Error("Informe se o pedido foi separado.");
    }
    const orderRef = doc(db, "orders", normalizedOrderId);
    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists()) throw new Error("Este pedido não existe mais.");

      const order = snapshot.data();
      if (order.merchantUid !== user.uid) {
        throw new Error("Você não pode alterar este pedido.");
      }
      const currentStatus = String(order.status || "pending")
        .trim()
        .toLowerCase();
      if (!["pending", "accepted", "ready"].includes(currentStatus)) {
        throw new Error("Este pedido não pode mais ser alterado.");
      }

      // Separado => o status do pedido passa a "ready" (o cliente vê na hora).
      // Desmarcou => volta para "accepted" (em preparação).
      const nextStatus = separated
        ? "ready"
        : currentStatus === "ready"
          ? "accepted"
          : currentStatus;
      transaction.update(orderRef, {
        separated,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      return nextStatus;
    });
  },

  submitOrderReview: async (orderId, rating, comment) => {
    currentUser();
    const normalizedOrderId = String(orderId || "").trim();
    const normalizedRating = Number(rating);
    const normalizedComment = String(comment ?? "").trim();
    if (!normalizedOrderId) throw new Error("Pedido inválido para avaliação.");
    if (
      !Number.isInteger(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5
    ) {
      throw new Error("Selecione uma avaliação entre 1 e 5 estrelas.");
    }
    if (normalizedComment.length > 500) {
      throw new Error("O comentário deve ter no máximo 500 caracteres.");
    }

    await updateDoc(doc(db, "orders", normalizedOrderId), {
      review: {
        rating: normalizedRating,
        comment: normalizedComment,
        createdAt: new Date().toISOString(),
      },
    });
  },

  submitReviewResponse: async (orderId, comment) => {
    const user = currentUser();
    const normalizedOrderId = String(orderId || "").trim();
    const normalizedComment = String(comment ?? "").trim();
    if (!normalizedOrderId) throw new Error("Pedido inválido para resposta.");
    if (!normalizedComment) throw new Error("Digite uma resposta.");
    if (normalizedComment.length > 500) {
      throw new Error("A resposta deve ter no máximo 500 caracteres.");
    }

    const orderRef = doc(db, "orders", normalizedOrderId);
    const orderSnapshot = await getDoc(orderRef);
    if (!orderSnapshot.exists())
      throw new Error("Este pedido não existe mais.");
    const order = orderSnapshot.data();
    if (order.merchantUid !== user.uid) {
      throw new Error("Você não pode responder a esta avaliação.");
    }
    if (
      !Number.isInteger(Number(order.review?.rating)) ||
      Number(order.review.rating) < 1 ||
      Number(order.review.rating) > 5
    ) {
      throw new Error("Este pedido ainda não possui uma avaliação válida.");
    }

    await updateDoc(orderRef, {
      "review.sellerResponse": {
        comment: normalizedComment,
        createdAt: new Date().toISOString(),
      },
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
      await googleRedirectResult;
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
