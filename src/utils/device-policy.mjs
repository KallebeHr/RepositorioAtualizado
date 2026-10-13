import { dateMillis } from './access-policy.mjs'

export const DEVICE_HEARTBEAT_MS = 3 * 60 * 1000
export const DEVICE_RECENT_MS = 7 * 60 * 1000
export const DEVICE_ALERT_LIMIT = 4
export function deviceUuid(random = globalThis.crypto) {
  if (typeof random?.randomUUID === 'function') return random.randomUUID()
  // getRandomValues também atende navegadores que não oferecem randomUUID.
  if (typeof random?.getRandomValues !== 'function') return null
  const bytes = random.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}
export function deviceDescription({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}, installed = false) {
  const ios = /iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
  const os = ios ? 'iOS / iPadOS' : /Android/i.test(userAgent) ? 'Android' : /Windows/i.test(userAgent) ? 'Windows' : /Mac/i.test(userAgent) ? 'macOS' : /Linux/i.test(userAgent) ? 'Linux' : 'Não informado'
  const browser = /Edg\/|EdgiOS|EdgA\//i.test(userAgent) ? 'Edge' : /OPR\/|Opera/i.test(userAgent) ? 'Opera' : /Firefox\/|FxiOS/i.test(userAgent) ? 'Firefox' : /Chrome\/|CriOS/i.test(userAgent) ? 'Chrome' : /Safari/i.test(userAgent) ? 'Safari' : 'Outro navegador'
  const kind = /iPad|Tablet/i.test(userAgent) || (ios && !/iPhone|iPod/i.test(userAgent)) ? 'Tablet' : /Mobile|Android|iPhone|iPod/i.test(userAgent) ? 'Celular' : 'Computador'
  return { os, browser, kind, installed: installed === true }
}
export function deviceRecent(device, now = Date.now()) {
  const seen = dateMillis(device.lastSeen)
  return device.loggedOut !== true && seen > 0 && seen >= now - DEVICE_RECENT_MS && seen <= now + 60000
}
export function groupRecentDevices(devices, now = Date.now()) {
  const groups = new Map()
  for (const device of devices) {
    if (!device.uid || !device.deviceId || !deviceRecent(device, now)) continue
    if (!groups.has(device.uid)) groups.set(device.uid, new Map())
    const set = groups.get(device.uid), previous = set.get(device.deviceId)
    if (!previous || dateMillis(device.lastSeen) > dateMillis(previous.lastSeen)) set.set(device.deviceId, device)
  }
  return [...groups].map(([uid, list]) => ({ uid, count: list.size, alert: list.size > DEVICE_ALERT_LIMIT, devices: [...list.values()].sort((a,b) => dateMillis(b.lastSeen)-dateMillis(a.lastSeen)) })).sort((a,b) => b.count-a.count || a.uid.localeCompare(b.uid))
}
