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
      ],
    },
  ],
})

/* ----------------------------------
   Workaround dynamic import (Vite)
----------------------------------- */
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page não resolveu', err)
    } else {
      console.log('Reloading page para corrigir dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})
  
async function waitForAuth() {
 await auth.authStateReady()
 return auth.currentUser
}
router.beforeEach(async to => {
 if (to.path.toLowerCase().startsWith('/admin')) {
  const user = await waitForAuth()
  if (!user) return '/RegisterAndLogin?mode=login'
  try {
   const snap=await getDoc(doc(db,'users',user.uid))
   if (!snap.exists() || snap.data().role !== 'admin' || snap.data().disabled) return '/'
  } catch { return '/' }
 }
})
export default router
