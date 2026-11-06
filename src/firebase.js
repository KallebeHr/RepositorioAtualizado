// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, onAuthStateChanged } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, disableNetwork, enableNetwork, enableIndexedDbPersistence } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBuL7SgBY9qn3TiHJPqIPGRK61IUlKrIFE",
  authDomain: "repertorio-cd75a.firebaseapp.com",
  projectId: "repertorio-cd75a",
  storageBucket: "repertorio-cd75a.firebasestorage.app",
  messagingSenderId: "221534742186",
  appId: "1:221534742186:web:ccb5250c140fed50b192d3",
  measurementId: "G-Q60PBJWYH1"
};

// Inicializa Firebase
const app = initializeApp(import.meta.env.VITE_USE_EMULATORS === "true" ? { ...firebaseConfig, projectId: "demo-repertorio", apiKey: "demo-api-key", authDomain: "localhost" } : firebaseConfig);

// Auth
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app); // <- precisa exportar db

export const persistenceReady = ref(false);

// Somente testes locais usam o projeto fictício; produção mantém a configuração original.
if (import.meta.env.VITE_USE_EMULATORS === "true") {
 connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true})
 connectFirestoreEmulator(db,"127.0.0.1",8088)
}

// Os dados ficam guardados no aparelho: a segunda visita usa o cache local em vez de
// pedir tudo ao servidor de novo. Só é ativada depois de saber quem está logado, porque
// o Firestore não permite ligar a persistência com uma conta já em uso.
if (typeof window !== 'undefined' && import.meta.env.VITE_USE_EMULATORS !== 'true') {
  onAuthStateChanged(auth, (user) => {
    if (persistenceReady.value || !user) return
    enableIndexedDbPersistence(db)
      .then(() => { persistenceReady.value = true; window.dispatchEvent(new Event('repertorio:persistence-ready')) })
      .catch((erro) => {
        // 'failed-precondition': outra aba já está com a persistência.
        // 'unimplemented': o navegador não oferece IndexedDB.
        if (erro?.code === 'failed-precondition') {
          window.dispatchEvent(new Event('repertorio:persistence-ready'))
        } else {
          console.info('[firebase] cache local indisponível; seguindo sem ele.', erro?.code || erro?.message)
        }
      })
  }, () => {}, () => {})
}

// Modo avião não deve provocar tentativas contínuas de conexão.
if (typeof window !== 'undefined') {
 if (!navigator.onLine) disableNetwork(db).catch(() => {})
 window.addEventListener('offline', () => disableNetwork(db).catch(() => {}))
 window.addEventListener('online', () => enableNetwork(db).catch(() => {}))
}
