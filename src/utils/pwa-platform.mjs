export function installationPlatform({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  const ios = /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
  const android = !ios && /Android/i.test(userAgent)
  const embedded = /FBAN|FBAV|Instagram|Line\/|Twitter|TikTok|;\s*wv\)/i.test(userAgent)
  return { ios, android, embedded }
}
