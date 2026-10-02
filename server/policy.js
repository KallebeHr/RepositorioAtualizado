export class HttpError extends Error { constructor(status, message) { super(message); this.status = status } }
export function dateOf(v) { return v?.toDate ? v.toDate() : v?.seconds ? new Date(v.seconds*1000) : new Date(v || 0) }
export function active(user, now = Date.now()) { return !user.disabled && user.subscription === 'ativa' && dateOf(user.subscriptionEnd).getTime() > now }
export function renewalEnd(previous, days, now = Date.now()) { if (!Number.isInteger(days) || days < 1 || days > 3660) throw new HttpError(400,'Duração inválida'); return new Date(Math.max(now,dateOf(previous).getTime() || 0) + days * 86400000).toISOString() }
export function assertPublished(track, now = Date.now()) { if (track.disabled || track.status === 'draft' || (track.publishAt && dateOf(track.publishAt).getTime() > now)) throw new HttpError(404,'Música indisponível') }
export function cleanId(id) { if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new HttpError(400,'Identificador inválido'); return id }
export function uniqueIds(ids) { if (!Array.isArray(ids) || !ids.length || ids.length > 200) throw new HttpError(400,'Selecione de 1 a 200 músicas'); return [...new Set(ids.map(cleanId))].sort() }
export function metadata(input) {
 const title = String(input.title || '').trim().slice(0,200), cantor = String(input.cantor || '').trim().slice(0,120)
 const raw = input.tipo || input.estilos || []; const tipo = (Array.isArray(raw) ? raw : String(raw).split(',')).map(v=>String(v).trim().slice(0,80)).filter(Boolean).slice(0,10)
 if (!title || !cantor || !tipo.length) throw new HttpError(400,'Informe título, cantor e gênero')
 let publishAt = null
 if (input.publishAt) { const d = new Date(input.publishAt); if (!Number.isFinite(d.getTime())) throw new HttpError(400,'Data de publicação inválida'); publishAt = d.toISOString() }
 const duration = Number(input.duration || 0)
 return {title,cantor,tipo,publishAt,status:input.status === 'draft' ? 'draft' : 'published',duration:Number.isFinite(duration) && duration >= 0 ? duration : 0}
}
