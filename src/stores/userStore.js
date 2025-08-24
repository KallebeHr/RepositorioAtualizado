// src/stores/userStore.js
import { defineStore } from "pinia"
import { ref } from "vue"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, db } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"

export const useUserStore = defineStore("user", () => {
  const user = ref(null)
  const loadingUser = ref(true) // 👈 estado de carregamento

  function setUser(data) {
    user.value = data
  }

  function clearUser() {
    user.value = null
  }

  // Escuta login/logout
  onAuthStateChanged(auth, async (firebaseUser) => {
    loadingUser.value = true
    if (firebaseUser) {
      try {
        // Pega Firestore primeiro
        const snap = await getDoc(doc(db, "users", firebaseUser.uid))

        let data = {
          uid: firebaseUser.uid,
          name: null, // 👈 evita cair no email de cara
          email: firebaseUser.email,
          role: "user",
        }

        if (snap.exists()) {
          const docData = snap.data()
          data = {
            ...data,
            ...docData, // inclui firstName, lastName, role, etc
          }

          // Se tiver nome salvo, monta ele
          if (docData.firstName || docData.lastName) {
            data.name = `${docData.firstName || ""} ${docData.lastName || ""}`.trim()
          }
        }

        // fallback: se ainda não tiver nome no Firestore, tenta displayName
        if (!data.name) {
          data.name = firebaseUser.displayName || firebaseUser.email
        }

        user.value = data
      } catch (err) {
        console.error("Erro ao buscar dados do Firestore:", err)
        // fallback mínimo
        user.value = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email,
          email: firebaseUser.email,
          role: "user",
        }
      }
    } else {
      clearUser()
    }
    loadingUser.value = false
  })

  async function logout() {
    await signOut(auth)
    clearUser()
  }

  return { user, loadingUser, setUser, logout, clearUser }
})
