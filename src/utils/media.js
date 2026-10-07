const configuredBase = import.meta.env?.VITE_MEDIA_BASE_URL || ''
const configuredV2Base = import.meta.env?.VITE_V2_MEDIA_BASE_URL || ''

export function objectKeyFromUrl(value) {
  try {
    const url = new URL(value)
    if (!/^(?:f\d+|s3\.[a-z0-9-]+)\.backblazeb2\.com$/i.test(url.hostname)) return null
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] === 'file' && parts.length > 2) return parts.slice(2).map(decodeURIComponent).join('/')
    return parts.length > 1 ? parts.slice(1).map(decodeURIComponent).join('/') : null
  } catch { return null }
}

export function resolveMediaUrl(value, base = configuredBase) {
  if (!value || !base) return value || ''
  const key = objectKeyFromUrl(value)
  if (!key) return value
  return `${base.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`
}

export function trackKey(track) {
  const id = String(track?.id || track?.objectKey || track?.fileId || objectKeyFromUrl(track?.downloadUrl) || track?.downloadUrl || '')
  return id && (track?.collectionName === 'musicasV2' || track?.storageProvider === 'r2') ? 'v2:' + id : id
}

export function resolveTrackUrl(track, legacyBase=configuredBase, v2Base=configuredV2Base) {
  if ((track?.collectionName === 'musicasV2' || track?.storageProvider === 'r2') && v2Base && /^musicas-v2\/[a-f0-9-]{36}-[^/]+$/i.test(track.objectKey || '')) {
    return `${v2Base.replace(/\/$/, '')}/${track.objectKey.split('/').map(encodeURIComponent).join('/')}`
  }
  return resolveMediaUrl(track?.downloadUrl, legacyBase)
}

export function normalizeTrack(track) {
  return {
    ...track,
    collectionName: track.collectionName || (track.storageProvider === 'r2' ? 'musicasV2' : 'musicas'),
    id: String(track.id || track.objectKey || track.fileId || objectKeyFromUrl(track.downloadUrl) || track.downloadUrl || ''),
    cantor: track.cantor || track.artist || '',
    estilos: Array.isArray(track.estilos || track.tipo) ? (track.estilos || track.tipo) : (track.estilos || track.tipo) ? [track.estilos || track.tipo] : [],
    downloadUrl: resolveTrackUrl(track),
    fileName: track.fileName || `${track.title || 'musica'}.mp3`,
  }
}
