import { auth } from '@/firebase'
export async function api(action, body = {}) {
 const user = auth.currentUser
 if (!user) throw new Error('Entre na sua conta para continuar.')
 const token = await user.getIdToken()
 const response = await fetch('/api/service', {method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action,...body})})
 const data = await response.json().catch(() => ({}))
 if (!response.ok) throw new Error(data.error || 'Serviço indisponível. Tente novamente.')
 return data
}
export async function downloadTrack(track) {
 const {url} = await api('media', {id:track.id, purpose:'download'})
 const a = document.createElement('a'); a.href = url; a.rel = 'noopener'; a.download = track.fileName || `${track.title}.mp3`; a.click()
}
export async function downloadPackage(ids) {
 const result = await api('package-request', {ids})
 if (result.url) { const a = document.createElement('a'); a.href = result.url; a.click() }
 return result
}
