import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { HttpError, active } from '../../server/policy.js'
export function database() {
 if (!getApps().length) {
  if (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST && !process.env.VERCEL) initializeApp({projectId:'demo-repertorio'});
  else {
  if (!process.env.FIREBASE_ADMIN_CREDENTIALS_JSON) throw new HttpError(503,'API pendente de configuração administrativa do Firebase.')
  initializeApp({credential:cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS_JSON))})
  }
 }
 return getFirestore()
}
export async function identity(req) {
 const db = database(); const bearer = req.headers.authorization || ''
 if (!bearer.startsWith('Bearer ')) throw new HttpError(401,'Autenticação necessária')
 let token; try { token = await getAuth().verifyIdToken(bearer.slice(7),true) } catch { throw new HttpError(401,'Sessão inválida. Entre novamente.') }
 const ref = db.collection('users').doc(token.uid); const snap = await ref.get()
 if (!snap.exists || snap.data().disabled) throw new HttpError(403,'Conta indisponível')
 return {uid:token.uid,ref,user:snap.data(),db}
}
export function requireAdmin(ctx) { if (ctx.user.role !== 'admin') throw new HttpError(403,'Acesso administrativo necessário') }
export function requireSubscription(ctx) { if (!active(ctx.user)) throw new HttpError(403,'Assinatura ativa necessária') }
export function storage(provider = process.env.STORAGE_PROVIDER || 'r2') {
 const r2 = provider === 'r2'; const prefix = r2 ? 'R2' : 'B2'
 const endpoint = process.env[`${prefix}_ENDPOINT`], accessKeyId = process.env[`${prefix}_ACCESS_KEY_ID`], secretAccessKey = process.env[`${prefix}_SECRET_ACCESS_KEY`], Bucket = process.env[`${prefix}_BUCKET`]
 if (![endpoint,accessKeyId,secretAccessKey,Bucket].every(Boolean)) throw new HttpError(503,`Armazenamento ${prefix} pendente de configuração.`)
 return {client:new S3Client({region:r2?'auto':process.env.B2_REGION || 'us-east-005',endpoint,credentials:{accessKeyId,secretAccessKey}}),Bucket,provider}
}
export async function signMedia(track, purpose = 'stream') {
 if (track.storageKey) {
  const {client,Bucket} = storage(track.storageProvider || 'r2')
  return getSignedUrl(client,new GetObjectCommand({Bucket,Key:track.storageKey,...(purpose === 'download' ? {ResponseContentDisposition:`attachment; filename*=UTF-8''${encodeURIComponent(track.fileName || `${track.title}.mp3`)}`} : {})}),{expiresIn:3600})
 }
 // Compatibilidade temporária: links legados públicos continuam públicos até migração.
 let url; try {url = new URL(track.downloadUrl)} catch {throw new HttpError(404,'Arquivo indisponível')}
 const allow = (process.env.LEGACY_MEDIA_HOSTS || '').split(',').map(v=>v.trim()).filter(Boolean)
 if (url.protocol !== 'https:' || (!url.hostname.endsWith('.backblazeb2.com') && !allow.includes(url.hostname))) throw new HttpError(403,'Origem de arquivo não autorizada')
 return url.href
}
export const timestamp = () => FieldValue.serverTimestamp()
export async function audit(ctx, action, details = {}) { await ctx.db.collection('audit').add({actor:ctx.uid,action,details,at:timestamp()}) }
export {PutObjectCommand,HeadObjectCommand,getSignedUrl,FieldValue}
