// src/stores/userStore.js
import { defineStore } from "pinia"
import { ref } from "vue"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, db } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"

export const useUserStore = defineStore("user", () => {
  const user = ref(null)
  const loadingUser = ref(true) 

  function setUser(data) {
    user.value = data
  }

  function clearUser() {
    user.value = null
  }

  onAuthStateChanged(auth, async (firebaseUser) => {
    loadingUser.value = true
    if (firebaseUser) {
      try {
       
        const snap = await getDoc(doc(db, "users", firebaseUser.uid))

        let data = {
          uid: firebaseUser.uid,
          name: null, 
          email: firebaseUser.email,
          role: "user",
        }

        if (snap.exists()) {
          const docData = snap.data()
          data = {
            ...data,
            ...docData, 
          }

          if (docData.firstName || docData.lastName) {
            data.name = `${docData.firstName || ""} ${docData.lastName || ""}`.trim()
          }
        }

        if (!data.name) {
          data.name = firebaseUser.displayName || firebaseUser.email
        }

        user.value = data
      } catch (err) {
        console.error("Erro ao buscar dados do Firestore:", err)
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
