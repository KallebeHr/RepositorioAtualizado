import { ref } from 'vue'

export const installPrompt = ref(null)
export const appInstalled = ref(false)
export const updateAvailable = ref(false)
export const installDialogOpen = ref(false)
export const installBusy = ref(false)
export const installMessage = ref('')
export const pwaReady = ref(false)
export const pwaError = ref('')
let registration

export function setupPwa() {
  appInstalled.value = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    installPrompt.value = event
  })
  window.addEventListener('appinstalled', () => { appInstalled.value = true; installPrompt.value = null })
  if (!import.meta.env.PROD) return
  if (!window.isSecureContext) { pwaError.value = 'Abra o site em HTTPS para preparar a instalação e a abertura offline.'; return }
  if (!('serviceWorker' in navigator)) { pwaError.value = 'Este navegador não permite preparar a abertura offline. Abra o site em um navegador compatível.'; return }
  const register = async () => {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      navigator.serviceWorker.ready.then(() => { pwaReady.value = true })
      if (registration.waiting) updateAvailable.value = true
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) updateAvailable.value = true
        })
      })
    } catch (error) { pwaError.value = 'Não foi possível preparar a abertura offline. Conecte-se e tente abrir o aplicativo novamente.'; console.warn(pwaError.value, error) }
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}

export async function installApp() {
  const prompt = installPrompt.value
  if (!prompt || installBusy.value) { installDialogOpen.value = true; return }
  installBusy.value = true; installMessage.value = ''
  try {
    await prompt.prompt()
    const choice = await prompt.userChoice
    installMessage.value = choice.outcome === 'accepted' ? 'Instalação solicitada. O navegador concluirá a instalação.' : 'Você pode instalar depois pelo menu do navegador.'
    if (installPrompt.value === prompt) installPrompt.value = null
  } catch { installMessage.value = 'Use o menu do navegador para instalar ou adicionar à tela inicial.' }
  finally { installBusy.value = false }
}

export function applyUpdate() {
  if (!registration?.waiting) return
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
  registration.waiting.postMessage({ type: 'SKIP_WAITING' })
}
