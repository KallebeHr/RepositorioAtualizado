// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyALP3q8oYZkAsCwVRXmsaa7VQjcxiUCQIg",
  authDomain: "repertorio-atualizado-2f151.firebaseapp.com",
  projectId: import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === "true" ? "demo-repertorio" : "repertorio-d3552",
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

if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === "true" && ["localhost","127.0.0.1"].includes(location.hostname)) {
 connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true})
 connectFirestoreEmulator(db,"127.0.0.1",8080)
}
