<template>
  <div class="container">
    <div class="overlay"></div>

    <transition name="fade-slide" mode="out-in">
      <form v-if="!isLogin" key="register" class="form" @submit.prevent="register">
        <p class="title">Registrar</p>
        <p class="message">Registre-se agora e tenha acesso ao site todo.</p>

        <div class="flex">
          <label>
            <input v-model="firstName" class="input" type="text" required />
            <span>Primeiro Nome</span>
          </label>
          <label>
            <input v-model="lastName" class="input" type="text" required />
            <span>Sobrenome</span>
          </label>
        </div>

        <label>
          <input v-model="numero" class="input" type="numero" required />
          <span>Numero</span>
        </label>
        <label>
          <input v-model="email" class="input" type="email" required />
          <span>Email</span>
        </label>

        <label>
          <input v-model="password" class="input" type="password" required />
          <span>Senha</span>
        </label>

        <label>
          <input v-model="confirmPassword" class="input" type="password" required />
          <span>Confirme Senha</span>
        </label>

        <button class="submit" type="submit" :disabled="loading">
          <span v-if="!loading">Registrar</span>
          <span v-else>Carregando...</span>
        </button>

        <p class="signin">
          Já tem uma conta ?
          <a href="#" @click.prevent="switchMode(true)">Entrar</a>
        </p>

        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <form v-else key="login" class="form" @submit.prevent="login">
        <p class="title">Entrar</p>
        <p class="message">Entre agora e tenha acesso ao site todo.</p>

        <label>
          <input v-model="email" class="input" type="email" required />
          <span>Email</span>
        </label>

        <label>
          <input v-model="password" class="input" type="password" required />
          <span>Senha</span>
        </label>

        <button class="submit" type="submit" :disabled="loading">
          <span v-if="!loading">Entrar</span>
          <span v-else>Carregando...</span>
        </button>

        <p class="signin">
          Ainda não tem uma conta ?
          <a href="#" @click.prevent="switchMode(false)">Registrar</a>
        </p>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { auth, db } from "@/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { useUserStore } from "@/stores/userStore"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isLogin = ref(route.query.mode === "login")

// Estados
const firstName = ref("")
const lastName = ref("")
const email = ref("")
const numero = ref("")
const password = ref("")
const confirmPassword = ref("")
const error = ref("")
const loading = ref(false)

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userSnap = await getDoc(doc(db, "users", user.uid))
      if (userSnap.exists()) userStore.setUser(userSnap.data())
      router.replace("/") // já logado, não deixa acessar register/login
    }
  })
})

function generateRandomID() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  return (
    Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join("") +
    Array.from({ length: 3 }, () => numbers[Math.floor(Math.random() * numbers.length)]).join("")
  )
}

async function register() {
  loading.value = true
  error.value = ""

  if (password.value !== confirmPassword.value) {
    error.value = "As senhas não coincidem"
    loading.value = false
    return
  }

  try {
    const res = await createUserWithEmailAndPassword(auth, email.value, password.value)
    await updateProfile(res.user, { displayName: firstName.value })
    const customID = generateRandomID()
    // Define data atual e data de término (30 dias depois)
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 30);

await setDoc(doc(db, "users", res.user.uid), {
  firstName: firstName.value,
  lastName: lastName.value,      
  email: email.value,
  numero: numero.value,
  createdAt: new Date(),
  customID,
  subscription: "ativa",
  password: password.value,
  subscriptionStart: start.toISOString(),
  subscriptionEnd: end.toISOString(),         
})

    window.location.href = "/"
  } catch (err) {
    error.value = err.message
    loading.value = false
  }
}

async function login() {
  loading.value = true
  error.value = ""
  try {
    const res = await signInWithEmailAndPassword(auth, email.value, password.value)
    const snap = await getDoc(doc(db, "users", res.user.uid))
    if (snap.exists() && snap.data().disabled) {
      await signOut(auth)
      error.value = "Conta desativada. Entre em contato com o administrador."
      loading.value = false
      return
    }
    window.location.href = "/"
  } catch (err) {
    error.value = 'Senha ou Email incorretos!'
    loading.value = false
  }
}
function switchMode(loginMode) {
  isLogin.value = loginMode
}

watch(() => route.query.mode, (newMode) => {
  isLogin.value = newMode === "login"
})
</script>

<style scoped>
.container{
  display:flex;
  align-items: center;
  justify-content: center;
  height: 98vh;
  position: relative;
  width: 100%;
    background-color: #121212;

  background: url('/BG/BG-home.jpg') no-repeat center center/cover;
  text-align: center;
  overflow: hidden;
  padding: 20px;
}
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.8);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 350px;
  padding: 20px;
  border-radius: 20px;
  position: relative;
  background-color: #1a1a1a;
  color: #fff;
  border: 1px solid #333;
  transition: all 0.3s ease;
}

.title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -1px;
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 30px;
  color: #00d1b2;
}

.message, 
.signin {
  font-size: 14.5px;
  color: rgba(255, 255, 255, 0.7);
}

.signin {
  text-align: center;
}

.signin a:hover {
  text-decoration: underline #00d1b2;
}

.signin a {
  color: #00d1b2;
}

.flex {
  display: flex;
  width: 100%;
  gap: 6px;
}

.form label {
  position: relative;
}
.error {
  color: red;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}
.form label .input {
  background-color: #333;
  color: #fff;
  width: 100%;
  padding: 20px 05px 05px 10px;
  outline: 0;
  border: 1px solid rgba(105, 105, 105, 0.397);
  border-radius: 10px;
}

.form label .input + span {
  color: rgba(255, 255, 255, 0.5);
  position: absolute;
  left: 10px;
  top: 0px;
  font-size: 0.9em;
  cursor: text;
  transition: 0.3s ease;
}

.form label .input:placeholder-shown + span {
  top: 12.5px;
  font-size: 0.9em;
}

.form label .input:focus + span,
.form label .input:valid + span {
  color: #00d1b2;
  top: 0px;
  font-size: 0.7em;
  font-weight: 600;
}

.input {
  font-size: medium;
}

.submit {
  border: none;
  outline: none;
  padding: 10px;
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  transform: .3s ease;
  background-color: #00d1b2;
}

.submit:hover {
  background-color: #00d1b2;
}

@keyframes pulse {
  from { transform: scale(0.9); opacity: 1; }
  to { transform: scale(1.8); opacity: 0; }
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
