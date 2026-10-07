// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, disableNetwork, enableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyALP3q8oYZkAsCwVRXmsaa7VQjcxiUCQIg",
  authDomain: "repertorio-atualizado-2f151.firebaseapp.com",
  projectId: "repertorio-d3552",
  storageBucket: "repertorio-d3552.firebasestorage.app",
  messagingSenderId: "129323465959",
  appId: "1:129323465959:web:c47094b11b143bd8ac3642",
  measurementId: "G-V650X867G5"
};

// Inicializa Firebase
const app = initializeApp(import.meta.env.VITE_USE_EMULATORS === "true" ? { ...firebaseConfig, projectId: "demo-repertorio", apiKey: "demo-api-key", authDomain: "localhost" } : firebaseConfig);

// Auth
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app); // <- precisa exportar db

// Somente testes locais usam o projeto fictício; produção mantém a configuração original.
if (import.meta.env.VITE_USE_EMULATORS === "true") {
 connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true})
 connectFirestoreEmulator(db,"127.0.0.1",8088)
}

// Modo avião não deve provocar tentativas contínuas de conexão.
if (typeof window !== 'undefined') {
 if (!navigator.onLine) disableNetwork(db).catch(() => {})
 window.addEventListener('offline', () => disableNetwork(db).catch(() => {}))
 window.addEventListener('online', () => enableNetwork(db).catch(() => {}))
}
