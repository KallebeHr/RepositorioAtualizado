import { auth, db } from '@/firebase'
import { doc, runTransaction, updateDoc, serverTimestamp } from 'firebase/firestore'
import { DEVICE_HEARTBEAT_MS, deviceDescription, deviceUuid } from '@/utils/device-policy.mjs'

const installKey = 'repertorio:device:repertorio-cd75a:v1'
let memoryId, stopCurrent
export function installationId() {
  if (memoryId) return memoryId
  try {
    const saved = localStorage.getItem(installKey)
    if (/^[a-f0-9-]{36}$/.test(saved || '')) return memoryId = saved
    memoryId = deviceUuid(); if (memoryId) localStorage.setItem(installKey, memoryId)
  } catch { try { memoryId = deviceUuid() } catch { memoryId = null } }
  return memoryId
}
function beatKey(uid, id) { return `${installKey}:beat:${uid}:${id}` }

export function startDevicePresence(uid, isPlaying = () => false) {
  stopCurrent?.()
  if (!uid) { stopCurrent = undefined; return () => {} }
  const id = installationId()
  if (!id) { stopCurrent = undefined; return () => {} }
  const ref = doc(db, 'users', uid, 'devices', id)
  let stopped = false, inFlight = false, registered = false, retryAt = 0
  async function heartbeat() {
    if (Date.now() < retryAt || stopped || inFlight || !navigator.onLine || auth.currentUser?.uid !== uid) return
    if (document.visibilityState !== 'visible' && !isPlaying()) return
    inFlight = true
    const write = async () => {
      if (stopped || auth.currentUser?.uid !== uid) return
      let previous = 0
      try { previous = Number(localStorage.getItem(beatKey(uid, id))) || 0 } catch {}
      if (Date.now() - previous < DEVICE_HEARTBEAT_MS) { registered = true; return }
      const metadata = deviceDescription(navigator, matchMedia('(display-mode: standalone)').matches || navigator.standalone === true)
      await runTransaction(db, async tx => {
        const old = await tx.get(ref)
        if (stopped || auth.currentUser?.uid !== uid) throw new Error('Conta alterada.')
        tx.set(ref, { uid, deviceId: id, ...metadata, createdAt: old.exists() ? old.data().createdAt : serverTimestamp(), lastSeen: serverTimestamp(), lastLoginAt: old.exists() && registered && !old.data().loggedOut ? old.data().lastLoginAt : serverTimestamp(), loggedOut: false })
      })
      registered = true
      try { localStorage.setItem(beatKey(uid, id), String(Date.now())) } catch {}
    }
    try {
      // Abas da mesma instalação compartilham a contagem e a cadência de escrita.
      if (navigator.locks?.request) await navigator.locks.request(beatKey(uid, id), { ifAvailable: true }, lock => lock ? write() : undefined)
      else await write()
    } catch (error) { retryAt = Date.now() + (error.code === 'permission-denied' ? DEVICE_HEARTBEAT_MS : 30000) }
    finally { inFlight = false }
  }
  const interval = setInterval(heartbeat, 30000)
  window.addEventListener('online', heartbeat); document.addEventListener('visibilitychange', heartbeat)
  heartbeat()
  stopCurrent = () => { stopped = true; clearInterval(interval); window.removeEventListener('online', heartbeat); document.removeEventListener('visibilitychange', heartbeat) }
  return stopCurrent
}

export async function markDeviceLoggedOut(uid) {
  stopCurrent?.(); stopCurrent = undefined
  if (!uid) return
  const id = installationId()
  if (!id) return
  try { localStorage.removeItem(beatKey(uid, id)) } catch {}
  if (!navigator.onLine) return
  // Enfileira a escrita antes do signOut; não prende o botão Sair se a conexão cair.
  await Promise.race([
    updateDoc(doc(db, 'users', uid, 'devices', id), { loggedOut: true, lastSeen: serverTimestamp() }).catch(() => {}),
    new Promise(resolve => setTimeout(resolve, 1500)),
  ])
}
