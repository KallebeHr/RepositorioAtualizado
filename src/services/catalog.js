import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { normalizeTrack } from '@/utils/media'
import { matchesFolder } from '@/utils/folders.mjs'
import { readLocalData, writeLocalData, listOffline } from './offline.js'

// O catálogo muda poucas vezes por mês. Guardar por muito mais tempo evita
// reler milhares de músicas a cada troca de tela. O painel avisa quando algo muda.
export const CATALOG_TTL_MS = 6 * 60 * 60 * 1000

let cached = null, pending = null, revision = 0
export function invalidateCatalog() { revision++; cached = null; pending = null }
if (typeof window !== 'undefined') {
  window.addEventListener('repertorio:catalog-change', invalidateCatalog)
  // Sair da conta troca o que pode ser visto: a próxima leitura vem do servidor.
  window.addEventListener('repertorio:catalog-reset', invalidateCatalog)
}
export async function getCatalog({ refresh = false } = {}) {
  if (refresh) invalidateCatalog()
  if (!navigator.onLine) return (await readLocalData('catalog:repertorio-cd75a').catch(()=>[])) || []
  if (cached && Date.now() - cached.at < CATALOG_TTL_MS) return cached.tracks
  if (pending) return pending
  const run = revision
  const task = getDocs(collection(db, 'musicasV2')).then(snapshot => {
    const tracks = snapshot.docs.map(item => normalizeTrack({ ...item.data(), id: item.id, collectionName: 'musicasV2' }))
    writeLocalData('catalog:repertorio-cd75a',tracks).catch(()=>{})
    if (run === revision) cached = { tracks, at: Date.now() }
    return tracks
  }).finally(() => { if (pending === task) pending = null })
  pending = task
  return task
}
export async function getFolderTracks(folder, owner) {
  const tracks = navigator.onLine ? await getCatalog() : (await listOffline(owner)).map(record => record.track)
  return tracks.filter(track => matchesFolder(track, folder))
}
