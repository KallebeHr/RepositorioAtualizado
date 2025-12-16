// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app); // <- precisa exportar db
