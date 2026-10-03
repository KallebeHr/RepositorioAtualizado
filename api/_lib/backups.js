import {randomUUID,randomBytes,createHash} from 'node:crypto'
import {GetObjectCommand,PutObjectCommand} from '@aws-sdk/client-s3'
import {Timestamp} from 'firebase-admin/firestore'
import {storage,audit,timestamp} from './admin.js'
import {backupCollections,encode,decode} from '../../server/backup.js'
import {HttpError,cleanId} from '../../server/policy.js'
const hash=value=>createHash('sha256').update(value).digest('hex')
async function loadBackup(ctx,id){const snap=await ctx.db.collection('backups').doc(cleanId(id)).get();if(!snap.exists)throw new HttpError(404,'Backup não encontrado');const {client,Bucket}=storage(snap.data().storageProvider);const object=await client.send(new GetObjectCommand({Bucket,Key:snap.data().storageKey}));if(object.ContentLength>3*1024*1024)throw new HttpError(413,'Backup grande: use o utilitário de recuperação.');const raw=await object.Body.transformToString();const data=JSON.parse(raw);if(data.version!==1 || !Array.isArray(data.documents))throw new HttpError(400,'Backup inválido');for(const d of data.documents){if(!backupCollections.includes(d.collection))throw new HttpError(400,'Coleção inválida');cleanId(d.id)}return data}
export async function backupAction(ctx,body){
 const {db}=ctx
 if(body.action==='backup-create'){
  const documents=[];for(const name of backupCollections){const snapshot=await db.collection(name).limit(2001).get();if(snapshot.size>2000)throw new HttpError(413,'Banco grande: use npm run backup para exportar tudo.');for(const d of snapshot.docs)documents.push({collection:name,id:d.id,data:encode(d.data())})}
  const raw=JSON.stringify({version:1,createdAt:new Date().toISOString(),documents});if(Buffer.byteLength(raw)>3*1024*1024)throw new HttpError(413,'Banco grande: use npm run backup para exportar tudo.');const id=randomUUID(),{client,Bucket,provider}=storage();const storageKey=`backups/${id}.json`;await client.send(new PutObjectCommand({Bucket,Key:storageKey,Body:raw,ContentType:'application/json'}));await db.collection('backups').doc(id).set({storageKey,storageProvider:provider,count:documents.length,at:timestamp(),createdBy:ctx.uid});await audit(ctx,'backup.create',{id,count:documents.length});return {id,count:documents.length}
 }
 if(body.action==='backup-list'){const snap=await db.collection('backups').orderBy('at','desc').limit(50).get();return {backups:snap.docs.map(d=>({id:d.id,...d.data()}))}}
 if(body.action==='backup-preview'){const data=await loadBackup(ctx,body.id);const token=randomBytes(24).toString('base64url');await db.collection('restoreTickets').doc(hash(token)).set({uid:ctx.uid,id:body.id,expiresAt:new Date(Date.now()+600000).toISOString()});return {id:body.id,count:data.documents.length,token}}
 if(body.action==='backup-restore'){
  const ticket=db.collection('restoreTickets').doc(hash(String(body.token || '')));await db.runTransaction(async tx=>{const s=await tx.get(ticket);const t=s.data();if(!t || t.used || t.uid!==ctx.uid || t.id!==body.id || new Date(t.expiresAt)<new Date())throw new HttpError(403,'Solicite uma nova prévia antes de recuperar.');tx.update(ticket,{used:true})});const data=await loadBackup(ctx,body.id)
  // Dados de assinatura/chaves não são rebobinados: impedir reutilização e duplicação de pagamentos.
  const forbidden=new Set(['activationKeys','Chaves','audit','downloads','fileHashes','payments','migrations','accesses']);const allowed=data.documents.filter(d=>!forbidden.has(d.collection))
  for(let offset=0;offset<allowed.length;offset+=400){const batch=db.batch();for(const d of allowed.slice(offset,offset+400)){const decoded=decode(d.data,Timestamp);if(d.collection==='users'){for(const key of ['role','disabled','subscription','subscriptionStart','subscriptionEnd','password'])delete decoded[key]}batch.set(db.collection(d.collection).doc(d.id),decoded,{merge:true})}await batch.commit()}
  await audit(ctx,'backup.restore',{id:body.id,count:allowed.length});return {restored:allowed.length}
 }
}
