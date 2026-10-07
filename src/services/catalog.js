import { collection, getDocs } from 'firebase/firestore'
import { readLocalData, writeLocalData } from './offline.js'
import { resolveMediaUrl } from '../utils/media.js'

let memory
let loadedAt = 0
let pending
function snapshot(records) {
  return { docs: records.map(record => ({ id: record.id, data: () => ({ ...record.data, downloadUrl: resolveMediaUrl(record.data.downloadUrl) }) })) }
}
export async function getMusicDocuments(db) {
  if (memory && Date.now() - loadedAt < 300000) return snapshot(memory)
  if (pending) return pending
  pending = (async () => {
    if (!navigator.onLine) {
      const saved = await readLocalData('catalog')
      return snapshot(saved || [])
    }
    const result = await getDocs(collection(db, 'musicas'))
    memory = result.docs.map(document => ({ id: document.id, data: document.data() }))
    loadedAt = Date.now()
    await writeLocalData('catalog', memory).catch(() => {})
    return snapshot(memory)
  })().finally(() => { pending = null })
  return pending
}
