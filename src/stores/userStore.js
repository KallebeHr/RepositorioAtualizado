import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from '@/firebase'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { readLocalData, writeLocalData } from '@/services/offline'
import { subscriptionActive } from '@/utils/access-policy.mjs'
export const useUserStore = defineStore('user', () => {
 const user = ref(null), loadingUser = ref(true), clock = ref(Date.now())
 let unsubscribeProfile, generation = 0
 setInterval(() => { clock.value = Date.now() }, 30000)
 const hasActiveSubscription = computed(() => subscriptionActive(user.value, clock.value))
 function setUser(data) { user.value = data ? { ...data, uid: data.uid || auth.currentUser?.uid, favorites: data.favorites || [] } : null }
 function clearUser() { user.value = null }
 function profile(firebaseUser, data) {
  return { ...data, uid: firebaseUser.uid, email: firebaseUser.email, name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || firebaseUser.displayName || firebaseUser.email, favorites: data.favorites || [], role: data.role || 'user' }
 }
 async function cache(data) {
  // A senha é exclusiva do Firebase Auth, nunca do perfil ou cache.
  const { password, ...safe } = data
  await writeLocalData('profile:' + data.uid, safe).catch(() => {})
 }
 async function refresh() {
  const current = auth.currentUser
  if (!current) return clearUser()
  const snap = await getDoc(doc(db, 'users', current.uid))
  if (auth.currentUser?.uid !== current.uid) return
  setUser(profile(current, snap.exists() ? snap.data() : {})); await cache(user.value)
 }
 onAuthStateChanged(auth, async current => {
  const run = ++generation; unsubscribeProfile?.(); loadingUser.value = true; clearUser()
  if (!current) { loadingUser.value = false; return }
  const saved = await readLocalData('profile:' + current.uid).catch(() => null)
  if (run !== generation) return
  if (saved) setUser(profile(current, { ...saved, role: 'user' }))
  unsubscribeProfile = onSnapshot(doc(db, 'users', current.uid), snap => {
   if (run !== generation) return
   if (snap.metadata.fromCache && !snap.exists() && saved) { loadingUser.value = false; return }
   const data = snap.exists() ? snap.data() : {}
   setUser(profile(current, navigator.onLine ? data : { ...data, role: 'user' })); cache(user.value); loadingUser.value = false
  }, () => { loadingUser.value = false })
  // O perfil salvo permite abrir a biblioteca mesmo sem internet.
  if (saved && !navigator.onLine) loadingUser.value = false
 })
 async function logout() { await signOut(auth); clearUser() }
 async function ativarAssinatura() { throw new Error('Use uma chave de acesso para ativar sua assinatura.') }
 return { user, loadingUser, hasActiveSubscription, setUser, clearUser, refresh, logout, ativarAssinatura }
})
