// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBu2YCg2ieaTek9aKcMgxqHBPB6L4yMEYU",
  authDomain: "repertorio-atualizado-2f151.firebaseapp.com",
  projectId: "repertorio-atualizado-2f151",
  storageBucket: "repertorio-atualizado-2f151.firebasestorage.app",
  messagingSenderId: "1063978224223",
  appId: "1:1063978224223:web:efa3c7232f47067e7c29ea",
  measurementId: "G-1N2TSLKDRF"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app); // <- precisa exportar db
