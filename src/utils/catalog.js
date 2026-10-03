export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export function genres(track) { const v = track?.tipo || track?.estilos || track?.genre || []; return (Array.isArray(v) ? v : [v]).filter(Boolean) }
export function dateOf(value) { const seconds=value?.seconds ?? value?._seconds; const date=value?.toDate ? value.toDate() : typeof seconds==='number' ? new Date(seconds*1000) : new Date(value || 0); return Number.isFinite(date.getTime()) ? date : new Date(0) }
export function normalizeTrack(track) { return {...track, estilos: genres(track), tipo: genres(track), month: track.month || dateOf(track.publishAt || track.createdAt).toISOString().slice(0, 7)} }
export function published(track, now = Date.now()) { return !track.disabled && track.status !== 'draft' && (!track.publishAt || dateOf(track.publishAt).getTime() <= now) }
export function nextTrack(current, catalog, recent = []) {
 const pool = catalog.filter(t => t.id !== current?.id && published(t) && (t.downloadUrl || t.storageKey))
 const same = pool.filter(t => genres(t).some(g => genres(current).map(normalize).includes(normalize(g))))
 const choices = same.length ? same : pool
 return choices.find(t => !recent.includes(t.id)) || choices[0] || null
}
export function filterTracks(catalog, {search = '', artist = '', genre = '', month = ''} = {}) {
 const term = normalize(search)
 return catalog.filter(t => published(t) && (!artist || t.cantor === artist) && (!genre || genres(t).includes(genre)) && (!month || t.month === month) && (!term || normalize([t.title,t.cantor,...genres(t)].join(' ')).includes(term)))
}
export function bytes(n) { return n !== undefined && n !== null && Number.isFinite(n) ? `${(n / 1024 / 1024).toFixed(1)} MB` : 'Tamanho não informado' }
export function time(n) { return n ? `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}` : 'Duração não informada' }
