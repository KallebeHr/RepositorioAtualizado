import { randomBytes, createHash } from 'node:crypto'
export class PublicError extends Error { constructor(message, status = 400) { super(message); this.status = status } }
export const keyId = value => createHash('sha256').update(String(value).trim().toUpperCase()).digest('hex')
export const operationId = value => { if (!/^[a-zA-Z0-9_-]{8,64}$/.test(value || '')) throw new PublicError('Identificador da operação inválido.'); return value }
export function keyPolicy(input) {
 const days = Number(input.durationDays ?? 30), maximum = input.maxActivations === null ? null : Number(input.maxActivations ?? 1)
 if (!input.lifetime && (!Number.isInteger(days) || days < 1 || days > 36500)) throw new PublicError('Duração inválida.')
 if (maximum !== null && (!Number.isInteger(maximum) || maximum < 1 || maximum > 1000000)) throw new PublicError('Limite de ativações inválido.')
 const expiration = input.expiresAt ? new Date(input.expiresAt) : null
 if (expiration && (!Number.isFinite(expiration.getTime()) || expiration.getTime() <= Date.now())) throw new PublicError('A validade da chave deve estar no futuro.')
 return { durationDays: input.lifetime ? null : days, lifetime: input.lifetime === true, maxActivations: maximum, expiresAt: expiration?.toISOString() ?? null, label: String(input.label || '').trim().slice(0, 120) }
}
export function activeAccess(access, now = Date.now()) { return access?.status === 'active' && (access.lifetime === true || new Date(access.endsAt).getTime() > now) }
export function nextAccess(access, policy, now) {
 if (activeAccess(access, now) && access.lifetime) throw new PublicError('Sua conta já possui acesso V2 vitalício.', 409)
 const start = new Date(now).toISOString()
 const base = activeAccess(access, now) ? new Date(access.endsAt).getTime() : now
 return { status: 'active', lifetime: policy.lifetime === true, startsAt: access?.startsAt || start, endsAt: policy.lifetime ? null : new Date(base + policy.durationDays * 86400000).toISOString(), updatedAt: start }
}
export async function createKeys(db, uid, input) {
 const policy = keyPolicy(input), quantity = Number(input.quantity ?? 1), requestId = operationId(input.requestId)
 if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new PublicError('Gere entre 1 e 100 chaves por lote.')
 const codes = Array.from({length:quantity}, () => 'R2-' + randomBytes(16).toString('hex').toUpperCase().match(/.{1,8}/g).join('-'))
 const batchRef = db.collection('keyBatchesV2').doc(requestId)
 return db.runTransaction(async tx => {
  const previous = await tx.get(batchRef)
  if (previous.exists) { if (previous.data().createdBy !== uid) throw new PublicError('Operação indisponível.',403); return { codes:previous.data().codes, reused:true } }
  const refs = codes.map(code => db.collection('chavesV2').doc(keyId(code)))
  for (const ref of refs) { if ((await tx.get(ref)).exists) throw new PublicError('Colisão de chave. Tente um novo lote.',409) }
  const at = new Date().toISOString()
  refs.forEach((ref,i) => tx.create(ref, {...policy, code:codes[i], active:true, activationCount:0, createdAt:at, createdBy:uid}))
  tx.create(batchRef,{codes,createdBy:uid,createdAt:at})
  tx.create(db.collection('auditV2').doc('batch-'+requestId),{type:'keys-created',uid,quantity,at})
  return {codes,reused:false}
 })
}
export async function redeemKey(db, uid, code, now = Date.now()) {
 if (!/^R2-[A-F0-9]{8}(?:-[A-F0-9]{8}){3}$/i.test(code?.trim() || '')) throw new PublicError('Chave V2 inválida.')
 const hash = keyId(code), keyRef = db.collection('chavesV2').doc(hash)
 const usedRef = db.collection('redemptionsV2').doc(hash+'_'+uid), accessRef = db.collection('accessV2').doc(uid)
 return db.runTransaction(async tx => {
  const [key, used, access] = await Promise.all([tx.get(keyRef),tx.get(usedRef),tx.get(accessRef)])
  if (used.exists) return {alreadyUsed:true,access:access.exists ? access.data() : null}
  if (!key.exists) throw new PublicError('Chave inválida.')
  const data=key.data()
  if (!data.active || data.expiresAt && new Date(data.expiresAt).getTime() <= now) throw new PublicError('Chave desativada ou expirada.')
  if (data.maxActivations !== null && data.activationCount >= data.maxActivations) throw new PublicError('Esta chave atingiu o limite de ativações.',409)
  const grant=nextAccess(access.exists ? access.data() : null,data,now)
  tx.set(accessRef,{...grant,lastKeyId:hash},{merge:true})
  tx.update(keyRef,{activationCount:(data.activationCount || 0)+1})
  tx.create(usedRef,{uid,keyId:hash,at:new Date(now).toISOString()})
  tx.create(db.collection('auditV2').doc('redeem-'+hash+'_'+uid),{type:'key-redeemed',uid,keyId:hash,at:new Date(now).toISOString()})
  return {alreadyUsed:false,access:grant}
 })
}
export async function limitAttempts(db,uid) {
 const minute=Math.floor(Date.now()/60000),ref=db.collection('attemptsV2').doc(uid+'_'+minute)
 await db.runTransaction(async tx => { const s=await tx.get(ref),count=s.exists ? s.data().count : 0; if(count>=12)throw new PublicError('Aguarde um minuto antes de tentar novamente.',429);tx.set(ref,{count:count+1,expiresAt:new Date((minute+120)*60000)}) })
}
export function musicMetadata(input, publicBase) {
 const title=String(input.title || '').trim(),cantor=String(input.cantor || '').trim()
 if (!title || title.length>200 || !cantor || cantor.length>160) throw new PublicError('Informe título e cantor válidos.')
 const objectKey=String(input.objectKey || '')
 if (!/^musicas-v2\/[a-f0-9-]{36}-[^/]+$/i.test(objectKey)) throw new PublicError('Arquivo fora do catálogo V2.')
 const size=Number(input.size)
 if (!Number.isInteger(size) || size<1 || size>300*1024*1024) throw new PublicError('Tamanho inválido.')
 const estilos=(Array.isArray(input.estilos) ? input.estilos : String(input.estilos || '').split(',')).map(x=>String(x).trim().slice(0,60)).filter(Boolean).slice(0,10)
 return { title,cantor,estilos,downloadUrl:publicBase.replace(/\/$/,'')+'/'+objectKey.split('/').map(encodeURIComponent).join('/'),objectKey,fileId:objectKey,size,fileName:String(input.fileName || objectKey.split('/').pop()).slice(0,255),contentType:String(input.contentType || 'audio/mpeg'),storageProvider:'r2',collectionName:'musicasV2',published:true }
}
