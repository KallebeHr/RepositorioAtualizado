/**
 * router/index.js
 *
 * Automatic routes for `./src/pages/*.vue`
 */

import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'

import { auth, db } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

// ✅ importe o componente da Home
import Home from '@/pages/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) { return savedPosition || { top: 0, left: 0 } },
  routes: [
    // 🔹 mantém TODAS as rotas automáticas
    ...setupLayouts(routes),

    // ✅ aliases que levam para a Home
    {
      path: '/',
      component: Home,
      alias: [
        '/Dezembro1',
        '/Dezembro2',
        '/Dezembro3',
        '/Dezembro4',
        '/Dezembro5',
        '/Dezembro6',
        '/Dezembro7',
        '/Dezembro8',
        '/Dezembro9',
        '/Dezembro9',
      ],
    },
  ],
})

// Uma atualização de versão deve ser aplicada pelo botão do aplicativo.
// A falha de uma rota mantém o áudio atual e permite tentar a navegação novamente.
router.onError(err => { console.error('Não foi possível abrir a página. Atualize o aplicativo quando terminar de ouvir.', err) })

let authReady = null
function waitForAuth() {
  if (!authReady) {
    authReady = new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub()
        resolve()
      })
    })
  }
  return authReady
}

router.beforeEach(async (to, from, next) => {
  if (to.path.startsWith('/admin')) {
    if (!navigator.onLine) return next('/Offline')
    await waitForAuth()
    const user = auth.currentUser
    if (!user) return next('/')

    try { const snap = await getDoc(doc(db, 'users', user.uid)); if (!snap.exists() || snap.data().role !== 'admin' || snap.data().disabled) return next('/') } catch { return next('/') }
  }
  next()
})

export default router
