// Guarda a oferta de instalação mesmo se ela chegar antes do carregamento do Vue.
(() => {
  const capture = { prompt: null, installed: false }
  window.repertorioInstallCapture = capture
  const beforeInstall = event => { event.preventDefault(); capture.prompt = event }
  const installed = () => { capture.installed = true; capture.prompt = null }
  window.addEventListener('beforeinstallprompt', beforeInstall)
  window.addEventListener('appinstalled', installed)
  capture.detach = () => {
    window.removeEventListener('beforeinstallprompt', beforeInstall)
    window.removeEventListener('appinstalled', installed)
  }
})()
