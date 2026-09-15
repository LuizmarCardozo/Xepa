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
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
const storage = getStorage(app);

window.Auth = { user: null };

window.Backend = {
  login: async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // CORREÇÃO: Força o nome a ser salvo antes de pular pra Home
      window.Auth.user = {
        uid: cred.user.uid,
        name: cred.user.displayName || email.split("@")[0],
        email: email,
      };

      return cred.user;
    } catch (error) {
      alert("Erro ao entrar. Verifique seu e-mail e senha.");
      throw error;
    }
  },

  register: async (name, email, password, type) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });

      // CORREÇÃO: Força o nome a ser salvo antes de pular pra Home
      window.Auth.user = {
        uid: cred.user.uid,
        name: name,
        email: email,
      };

      return cred.user;
    } catch (error) {
      alert("Erro ao criar conta: " + error.message);
      throw error;
    }
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
    window.Auth.user = {
      uid: user.uid,
      name: user.displayName || user.email.split("@")[0],
      email: user.email,
    };

    // Atualiza o DOM se a Home já estiver aberta
    const greeting = document.getElementById("user-greeting");
    if (greeting) {
      greeting.innerHTML = `Olá, ${window.Auth.user.name} 👋`;
    }
  } else {
    window.Auth.user = null;
  }
});
