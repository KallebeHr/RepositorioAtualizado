import { normalizeTrack, trackKey, resolveTrackUrl } from '../utils/media.js'

export const OFFLINE_EVENT = 'repertorio:offline-change'
let dbPromise
const pending = new Map()

function openDatabase() {
  if (!('indexedDB' in globalThis)) return Promise.reject(new Error('Este navegador não permite salvar músicas offline.'))
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('repertorio-offline', 2)
    request.onupgradeneeded = event => {
      const db = request.result
      const tracks = event.oldVersion < 1 ? db.createObjectStore('tracks', { keyPath: 'key' }) : request.transaction.objectStore('tracks')
      if (event.oldVersion < 1) db.createObjectStore('data', { keyPath: 'key' })
      tracks.createIndex('owner', 'owner')
      const blobs = db.createObjectStore('blobs', { keyPath: 'key' })
      // Migra arquivos anteriores sem baixar novamente.
      if (event.oldVersion === 1) {
        const cursor = tracks.openCursor()
        cursor.onsuccess = () => {
          const row = cursor.result
          if (!row) return
          const { blob, ...record } = row.value
          if (blob) {
            const key = storageKey(record.owner, record.track)
            record.key = key
            if (row.key !== key) row.delete()
            tracks.put(record); blobs.put({ key, blob })
          }
          row.continue()
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { dbPromise = null; reject(request.error) }
  })
  return dbPromise
}

async function operation(store, mode, run) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode)
    let result
    const request = run(transaction.objectStore(store))
    request.onsuccess = () => { result = request.result }
    transaction.oncomplete = () => resolve(result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error || new Error('Não foi possível salvar no aparelho.'))
  })
}

const storageKey = (owner, track) => `${owner}:${trackKey(track)}`
function changed() { window.dispatchEvent(new Event(OFFLINE_EVENT)) }

async function fetchAudio(url, options) {
  try { return await fetch(url, { mode: 'cors', ...options }) }
  catch (error) {
    if (error.name === 'TypeError') throw new Error('Não foi possível acessar o áudio. Confira a conexão e o CORS do B2/R2 para este endereço do site.', { cause: error })
    throw error
  }
}

export async function listOffline(owner) {
  if (!owner) return []
  const all = await operation('tracks', 'readonly', store => store.index('owner').getAll(owner))
  return all.filter(record => record.owner === owner).map(({ blob, ...record }) => record).sort((a, b) => b.savedAt - a.savedAt)
}

export async function getOfflineRecord(owner, track) {
  if (!owner) return null
  const key = storageKey(owner, track)
  const [record, data] = await Promise.all([operation('tracks', 'readonly', store => store.get(key)), operation('blobs', 'readonly', store => store.get(key))])
  return record && data ? { ...record, blob: data.blob } : null
}

export async function saveOffline(owner, track, { signal } = {}) {
  if (!owner) throw new Error('Entre na sua conta para salvar músicas offline.')
  if (!trackKey(track) || !track.downloadUrl) throw new Error('Arquivo indisponível.')
  const key = storageKey(owner, track)
  if (pending.has(key)) return pending.get(key)
  const task = (async () => {
    const existing = await getOfflineRecord(owner, track)
    if (existing) return existing
    if (!navigator.onLine) throw new Error('Conecte-se à internet para salvar esta música.')
    const response = await fetchAudio(resolveTrackUrl(track), { signal })
    if (!response.ok || response.status === 206) throw new Error('Falha ao baixar a música completa. Tente novamente.')
    const blob = await response.blob()
    if (!blob.size || /text\/html|application\/json/.test(blob.type)) throw new Error('O endereço não retornou um arquivo de áudio.')
    const estimate = await navigator.storage?.estimate?.()
    if (estimate?.quota && blob.size > estimate.quota - (estimate.usage || 0)) throw new Error('Espaço insuficiente no aparelho. Remova músicas salvas.')
    const record = { key, owner, track: JSON.parse(JSON.stringify(normalizeTrack(track))), blob, size: blob.size, savedAt: Date.now() }
    try { await storeTrack(record) }
    catch (error) {
      if (error?.name === 'QuotaExceededError') throw new Error('Espaço insuficiente no aparelho. Remova músicas salvas.')
      throw error
    }
    changed()
    return record
  })().finally(() => pending.delete(key))
  pending.set(key, task)
  return task
}

async function storeTrack({ blob, ...record }) {
 const db = await openDatabase()
 return new Promise((resolve,reject) => {
  const tx = db.transaction(['tracks','blobs'],'readwrite')
  tx.objectStore('tracks').put(record); tx.objectStore('blobs').put({key:record.key,blob})
  tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error)
 })
}
export async function removeOffline(owner, track) {
 const db = await openDatabase(), key=storageKey(owner,track)
 await new Promise((resolve,reject)=>{const tx=db.transaction(['tracks','blobs'],'readwrite');tx.objectStore('tracks').delete(key);tx.objectStore('blobs').delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})
 changed()
}

export async function clearOffline(owner) {
  const records = await listOffline(owner)
  await Promise.all(records.map(record => removeOffline(owner, record.track)))
  changed()
}

export async function getTrackBlob(owner, track) {
  const saved = await getOfflineRecord(owner, track).catch(() => null)
  if (saved) return saved.blob
  if (!navigator.onLine) throw new Error('Esta música não foi salva para ouvir offline.')
  const response = await fetchAudio(resolveTrackUrl(track))
  if (!response.ok || response.status === 206) throw new Error('Não foi possível baixar a música completa.')
  const blob = await response.blob()
  if (!blob.size || /text\/html|application\/json/.test(blob.type)) throw new Error('Arquivo de áudio inválido.')
  return blob
}

export async function getPlaybackSource(owner, track) {
  const record = await getOfflineRecord(owner, track).catch(() => null)
  if (record) return { url: URL.createObjectURL(record.blob), local: true }
  if (!navigator.onLine) throw new Error('Esta música não foi salva para ouvir offline.')
  return { url: resolveTrackUrl(track), local: false }
}

export async function readLocalData(key) {
  return (await operation('data', 'readonly', store => store.get(key)))?.value
}
export async function writeLocalData(key, value) {
  return operation('data', 'readwrite', store => store.put({ key, value: JSON.parse(JSON.stringify(value)) }))
}
