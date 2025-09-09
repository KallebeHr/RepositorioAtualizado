// src/stores/userStore.js
import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, db } from "@/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

export const useUserStore = defineStore("user", () => {
  const user = ref(null)
  const loadingUser = ref(true)

  function setUser(data) {
    user.value = data
  }

  function clearUser() {
    user.value = null
  }

  // 🔑 Computed para saber se o user já tem assinatura ativa
  const hasActiveSubscription = computed(() => {
    return !!(
      user.value &&
      (user.value.hasSubscription === true || user.value.subscription)
    )
  })

  // 🔑 Função para ativar assinatura
  async function ativarAssinatura(router) {
    if (!user.value) {
      throw new Error("Usuário não autenticado")
    }

    if (hasActiveSubscription.value) {
      throw new Error("Sua conta já está ativa, aproveite os benefícios 🎉")
    }

    try {
      const userRef = doc(db, "users", user.value.uid)
      await updateDoc(userRef, {
        hasSubscription: true,
        subscription: "ouro",
      })

      // Atualiza localmente
      user.value.hasSubscription = true
      user.value.subscription = "ouro"

      // 🔑 Força reatividade
      user.value = { ...user.value }

      // Redireciona apenas se não estiver em /AllMusic
      if (router && router.currentRoute.value.path !== "/AllMusic") {
        router.push("/AllMusic")
      }

      return "Assinatura ativada com sucesso! 🎉"
    } catch (err) {
      console.error("Erro ao ativar assinatura:", err)
      throw new Error("Erro ao ativar assinatura")
    }
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

  return { 
    user, 
    loadingUser, 
    setUser, 
    logout, 
    clearUser,
    hasActiveSubscription, // 🔑 já pode usar em qualquer componente
    ativarAssinatura // 🔑 chama direto no botão de ativar, receber router como argumento
  }
})
