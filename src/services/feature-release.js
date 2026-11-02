import { ref } from 'vue'

// Mantenha a implementação de PWA/IndexedDB. Para liberar, configure a variável
// correspondente como "true" no build e publique uma nova versão.
export const releasedFeatures = Object.freeze({
  install: import.meta.env.VITE_INSTALL_RELEASED === 'true',
  offline: import.meta.env.VITE_OFFLINE_RELEASED === 'true',
})
export const featureNotice = ref('')
export function requestFeature(feature) {
  if (releasedFeatures[feature] === true) return true
  featureNotice.value = feature
  return false
}
export function assertFeature(feature) {
  if (!requestFeature(feature)) throw Object.assign(new Error('Este recurso será liberado em breve.'), { code: 'FEATURE_COMING_SOON' })
}
export const supportNumber = import.meta.env.VITE_SUPPORT_WHATSAPP || '5586995102595'
export function supportLink(message = 'Olá! Quero saber sobre os adicionais do Repertório Atualizado.') {
  return `https://wa.me/${supportNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}
