import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { normalizeTrack } from '@/utils/media'
import { matchesFolder } from '@/utils/folders.mjs'
import { readLocalData, writeLocalData, listOffline } from './offline.js'

let cached = null, pending = null, revision = 0
export function invalidateCatalog() { revision++; cached = null; pending = null }
if (typeof window !== 'undefined') window.addEventListener('repertorio:catalog-change', invalidateCatalog)
export async function getCatalog({ refresh = false } = {}) {
  if (refresh) invalidateCatalog()
  if (!navigator.onLine) return (await readLocalData('catalog:repertorio-cd75a').catch(()=>[])) || []
  if (cached && Date.now() - cached.at < 120000) return cached.tracks
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
