// js/backend.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBUOyibPzAG8nLNu_unoJJ2PsnmpZxiV4Q",
  authDomain: "xepa-50d4b.firebaseapp.com",
  projectId: "xepa-50d4b",
  storageBucket: "xepa-50d4b.firebasestorage.app",
  messagingSenderId: "432696375024",
  appId: "1:432696375024:web:a5c3fb9b855ad2b3ff3435",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.Auth = { user: null };

window.Backend = {
  login: async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      let profile = {};
      try {
        const profileSnapshot = await getDoc(doc(db, "users", cred.user.uid));
        if (profileSnapshot.exists()) profile = profileSnapshot.data();
      } catch (profileError) {
        console.warn("Perfil não carregado do Firestore:", profileError);
      }
      const localProfile =
        JSON.parse(
          localStorage.getItem(`xepa-profile-${cred.user.uid}`) || "null",
        ) || {};

      // CORREÇÃO: Força o nome a ser salvo antes de pular pra Home
      window.Auth.user = {
        uid: cred.user.uid,
        name:
          profile.name ||
          localProfile.name ||
          cred.user.displayName ||
          email.split("@")[0],
        email: email,
        type: profile.type || localProfile.type || "cliente",
        document: profile.document || localProfile.document,
      };

      return cred.user;
    } catch (error) {
      alert("Erro ao entrar. Verifique seu e-mail e senha.");
      throw error;
    }
  },

  register: async (name, email, password, type, documentNumber) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const profile = { name, email, type, document: documentNumber };

      try {
        await setDoc(doc(db, "users", cred.user.uid), profile, {
          merge: true,
        });
      } catch (profileError) {
        // O login continua funcionando enquanto as regras do Firestore não forem publicadas.
        console.warn("Perfil não salvo no Firestore:", profileError);
        localStorage.setItem(
          `xepa-profile-${cred.user.uid}`,
          JSON.stringify(profile),
        );
      }

      // CORREÇÃO: Força o nome a ser salvo antes de pular pra Home
      window.Auth.user = {
        uid: cred.user.uid,
        name: name,
        email: email,
        type,
        document: documentNumber,
      };

      return cred.user;
    } catch (error) {
      alert("Erro ao criar conta: " + error.message);
      throw error;
    }
  },

  createOffer: async (offer) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const offerData = {
      ownerUid: user.uid,
      ownerName: user.displayName || "Comerciante",
      name: offer.name,
      category: offer.category,
      unit: offer.unit,
      price: offer.price,
      oldPrice: offer.oldPrice,
      desc: offer.desc,
      image: offer.image || null,
      active: true,
      createdAt: new Date().toISOString(),
    };

    const offerRef = await addDoc(collection(db, "offers"), offerData);
    return { id: offerRef.id, ...offerData };
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

  getMyOffers: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const snapshot = await getDocs(
      query(collection(db, "offers"), where("ownerUid", "==", user.uid)),
    );
    return snapshot.docs.map((offerDoc) => ({
      id: offerDoc.id,
      ...offerDoc.data(),
    }));
  },

  deleteOffer: async (offerId) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    await deleteDoc(doc(db, "offers", offerId));
  },

  logout: async () => {
    await signOut(auth);
    window.Auth.user = null;
    if (typeof Router !== "undefined") Router.go("login");
  },
};

// Mantém o estado sincronizado caso o usuário feche e abra o app de novo
onAuthStateChanged(auth, (user) => {
  if (user) {
    getDoc(doc(db, "users", user.uid))
      .then((profileSnapshot) => {
        const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
        const localProfile =
          JSON.parse(
            localStorage.getItem(`xepa-profile-${user.uid}`) || "null",
          ) || {};
        window.Auth.user = {
          uid: user.uid,
          name:
            profile.name ||
            localProfile.name ||
            user.displayName ||
            user.email.split("@")[0],
          email: user.email,
          type: profile.type || localProfile.type || "cliente",
          document: profile.document || localProfile.document,
        };

        const greeting = document.getElementById("user-greeting");
        if (greeting) {
          greeting.innerHTML = `Olá, ${window.Auth.user.name} 👋`;
        }
      })
      .catch((error) => {
        console.warn("Perfil não carregado no início da sessão:", error);
      });
  } else {
    window.Auth.user = null;
  }
});
