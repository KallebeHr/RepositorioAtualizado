export const foldText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
export const genresOf = track => [...new Set((Array.isArray(track.estilos || track.tipo) ? track.estilos || track.tipo : [track.estilos || track.tipo]).map(value => String(value || '').trim()).filter(Boolean))]
export const artistOf = track => String(track.cantor || track.artist || '').trim() || 'Desconhecido'
export function folderOf(track, selected) {
  if (!track) return null
  const genres = genresOf(track)
  const inferred = { genre: genres[0] || 'Sem estilo', artist: artistOf(track) }
  return selected && matchesFolder(track, selected) ? { ...selected } : inferred
}
export function matchesFolder(track, folder) {
  if (!folder) return false
  const genres = genresOf(track)
  const inGenre = !folder.genre || (folder.genre === 'Sem estilo' ? !genres.length : genres.some(value => foldText(value) === foldText(folder.genre)))
  return inGenre && (!folder.artist || foldText(artistOf(track)) === foldText(folder.artist))
}
export const folderLabel = folder => [folder?.genre, folder?.artist].filter(Boolean).join(' / ')
export const musicIdentity = track => String(track?.id || track?.objectKey || track?.fileId || track?.downloadUrl || '')
export function continuationTracks(tracks, last, folder = folderOf(last)) {
  const seen = new Set()
  const list = tracks.filter(track => {
    const key = musicIdentity(track)
    if (!key || !track.downloadUrl || !matchesFolder(track, folder) || seen.has(key)) return false
    seen.add(key); return true
  }).sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'pt-BR', { numeric: true, sensitivity: 'base' }))
  const index = list.findIndex(track => musicIdentity(track) === musicIdentity(last))
  return index < 0 ? list : [...list.slice(index + 1), ...list.slice(0, index + 1)]
}
export function archiveFileName(track, index) {
  const original = String(track.fileName || `${track.title || 'musica'}.mp3`).split(/[\\/]/).at(-1)
  const safe = original.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 180) || 'musica.mp3'
  return `${String(index + 1).padStart(3, '0')}-${safe}`
}
export const favoriteKey = value => String(typeof value === 'object' ? value?.id || '' : value || '').replace(/^v2:/, '')
export const favoriteMatches = (value, track) => favoriteKey(value) === favoriteKey(typeof track === 'object' ? track : String(track))
