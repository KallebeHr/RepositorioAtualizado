import {backupAction} from './_lib/backups.js'
import { randomUUID, randomBytes, createHash } from 'node:crypto'
import { identity, requireAdmin, requireSubscription, storage, signMedia, audit, timestamp, PutObjectCommand, HeadObjectCommand, getSignedUrl, FieldValue } from './_lib/admin.js'
import { HttpError, renewalEnd, cleanId, uniqueIds, metadata, assertPublished, active } from '../server/policy.js'
const hash = v => createHash('sha256').update(v).digest('hex')
const audioTypes = new Set(['audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/flac','audio/aac','audio/x-m4a'])
export async function execute(ctx, body) {
 const {db,uid,ref,user} = ctx; const action = body.action
 // Limite por conta em transação; múltiplas instâncias compartilham o contador.
 const rateRef = db.collection('rateLimits').doc(`${uid}-${Math.floor(Date.now()/60000)}`)
 await db.runTransaction(async tx => { const s = await tx.get(rateRef); const count = s.data()?.count || 0; if(count >= 120) throw new HttpError(429,'Muitas solicitações. Aguarde um minuto.'); tx.set(rateRef,{count:count+1,expiresAt:new Date(Date.now()+120000)}) })
 if (action === 'activate') {
  const key = String(body.key || '').trim(); if (key.length < 6 || key.length > 128) throw new HttpError(400,'Chave inválida')
  const keyRef = db.collection('activationKeys').doc(hash(key)); const legacy = await db.collection('Chaves').get()
  const end = await db.runTransaction(async tx => {
   const [k,u,...old] = await Promise.all([tx.get(keyRef),tx.get(ref),...legacy.docs.map(d=>tx.get(d.ref))]); const data = k.data()
   if (data?.usedBy || data?.revoked || (data?.expiresAt && new Date(data.expiresAt) < new Date())) throw new HttpError(409,'Chave utilizada, revogada ou expirada')
   const legacyDoc = old.find(s=>(s.data()?.Keys || []).includes(key))
   if (!k.exists && !legacyDoc) throw new HttpError(400,'Chave inválida')
   const end = renewalEnd(u.data()?.subscriptionEnd,data?.days || 30)
   tx.set(keyRef,{days:data?.days || 30,usedBy:uid,usedAt:new Date().toISOString()},{merge:true})
   if(legacyDoc) tx.update(legacyDoc.ref,{Keys:FieldValue.arrayRemove(key)})
   tx.update(ref,{subscription:'ativa',subscriptionStart:u.data()?.subscriptionStart || new Date().toISOString(),subscriptionEnd:end})
   tx.set(db.collection('audit').doc(),{actor:uid,action:'subscription.activate',details:{keyHash:hash(key),end},at:timestamp()})
   return end
  }); return {subscriptionEnd:end}
 }
 if (action === 'media') {
  requireSubscription(ctx); const id = cleanId(body.id); const snap = await db.collection('musicas').doc(id).get()
  if (!snap.exists) throw new HttpError(404,'Música não encontrada'); const track = snap.data(); assertPublished(track)
  const purpose = body.purpose === 'download' ? 'download' : 'stream'; const url = await signMedia(track,purpose)
  const batch = db.batch(); batch.set(db.collection(purpose==='download'?'downloads':'accesses').doc(),{uid,ids:[id],title:track.title,status:'authorized',bytes:track.size || 0,at:timestamp()}); batch.update(snap.ref,{[purpose==='download'?'downloads':'plays']:FieldValue.increment(1)}); await batch.commit()
  return {url,expiresIn:3600}
 }
 if (action === 'package-request') {
  requireSubscription(ctx); const ids = uniqueIds(body.ids)
  const songs = await Promise.all(ids.map(id=>db.collection('musicas').doc(id).get()))
  for(const song of songs) {if(!song.exists) throw new HttpError(404,'Música não encontrada');assertPublished(song.data())}
  const signature = hash(JSON.stringify(songs.map(s=>[s.id,s.updateTime.toMillis()])))
  const packageRef = db.collection('packages').doc(signature); const snap = await packageRef.get()
  let url = null; if(snap.exists && snap.data().status==='ready') url = await signMedia({...snap.data(),fileName:`repertorio-${signature.slice(0,8)}.zip`},'download')
  const size = songs.reduce((n,s)=>n+(s.data().size || 0),0)
  if(!snap.exists) await packageRef.set({ids,status:'pending',size,tracks:songs.map(s=>({id:s.id,title:s.data().title,cantor:s.data().cantor})),createdAt:timestamp()})
  const request = await db.collection('downloads').add({uid,ids,packageId:signature,bytes:size,status:url?'authorized':'pending',at:timestamp()})
  return {id:signature,requestId:request.id,status:url?'ready':(snap.data()?.status || 'pending'),size,url}
 }
 if (action === 'package-status') {
  requireSubscription(ctx); const s=await db.collection('packages').doc(cleanId(body.id)).get();if(!s.exists)throw new HttpError(404,'Pacote não encontrado');const data=s.data();
  const songs=await Promise.all(data.ids.map(id=>db.collection('musicas').doc(cleanId(id)).get()));for(const song of songs){if(!song.exists)throw new HttpError(404,'Pacote contém música indisponível');assertPublished(song.data())}
  return {...data,url:data.status==='ready'?await signMedia({...data,fileName:'repertorio.zip'},'download'):null}
 }
 if (action === 'checkout') {
  if(!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.PUBLIC_SITE_URL) throw new HttpError(503,'Pagamento online ainda não configurado. Solicite uma chave pelo WhatsApp.')
  const response = await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{Authorization:`Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({items:[{id:'subscription-30',title:'Repertório — assinatura 30 dias',quantity:1,currency_id:'BRL',unit_price:Number(process.env.SUBSCRIPTION_PRICE_BRL || 30)}],external_reference:uid,notification_url:`${process.env.PUBLIC_SITE_URL}/api/payment-webhook`,back_urls:{success:`${process.env.PUBLIC_SITE_URL}/Conta`,failure:`${process.env.PUBLIC_SITE_URL}/Conta`,pending:`${process.env.PUBLIC_SITE_URL}/Conta`},auto_return:'approved'})})
  const result=await response.json();if(!response.ok)throw new HttpError(502,'Não foi possível iniciar o pagamento');return {url:result.init_point}
 }
 requireAdmin(ctx)
 if(action.startsWith('backup-'))return backupAction(ctx,body)
 if(action === 'configuration') { return {firebase:true,r2:!!(process.env.R2_BUCKET && process.env.R2_SECRET_ACCESS_KEY),b2:!!process.env.B2_SECRET_ACCESS_KEY,payments:!!process.env.MERCADOPAGO_ACCESS_TOKEN,worker:!!process.env.PACKAGE_WORKER_CONFIGURED} }
 if (action === 'upload-sign') {
  const data = metadata(body); const size = Number(body.size); const contentType = String(body.contentType || '')
  if (!audioTypes.has(contentType) || !Number.isSafeInteger(size) || size <= 0 || size > 200*1024*1024) throw new HttpError(400,'Envie áudio de até 200 MB')
  const checksum = String(body.sha256 || ''); if(!/^[a-f0-9]{64}$/.test(checksum)) throw new HttpError(400,'Verificação do arquivo obrigatória')
  const duplicate=await db.collection('musicas').where('sha256','==',checksum).limit(1).get(); if(!duplicate.empty) throw new HttpError(409,'Arquivo duplicado no catálogo')
  const {client,Bucket,provider}=storage(); const id=randomUUID(); const fileName=String(body.fileName || 'musica.mp3').replace(/[^\p{L}\p{N}._ -]/gu,'_').slice(0,160); const storageKey=`audio/${id}/${fileName}`
  const upload = {uid,data,size,contentType,sha256:checksum,fileName,storageKey,storageProvider:provider,expiresAt:new Date(Date.now()+3600000).toISOString()}
  await db.collection('uploads').doc(id).set(upload)
  const url=await getSignedUrl(client,new PutObjectCommand({Bucket,Key:storageKey,ContentType:contentType,ChecksumSHA256:Buffer.from(checksum,'hex').toString('base64')}),{expiresIn:900})
  return {id,url,headers:{'Content-Type':contentType,'x-amz-checksum-sha256':Buffer.from(checksum,'hex').toString('base64')}}
 }
 if (action === 'upload-complete') {
  const id=cleanId(body.id);const uploadRef=db.collection('uploads').doc(id);const snap=await uploadRef.get();const u=snap.data()
  if(!u || u.uid!==uid || new Date(u.expiresAt)<new Date()) throw new HttpError(400,'Envio expirado')
  const {client,Bucket}=storage(u.storageProvider);const head=await client.send(new HeadObjectCommand({Bucket,Key:u.storageKey,ChecksumMode:'ENABLED'}))
  if(head.ContentLength!==u.size || (head.ChecksumSHA256 && head.ChecksumSHA256!==Buffer.from(u.sha256,'hex').toString('base64')))throw new HttpError(400,'Arquivo incompleto ou diferente do informado')
  // Documento por hash evita duplicatas em conclusões concorrentes.
  await db.runTransaction(async tx=>{const duplicate=db.collection('fileHashes').doc(u.sha256);const d=await tx.get(duplicate);const completed=await tx.get(db.collection('musicas').doc(id));if(completed.exists)return;if(d.exists)throw new HttpError(409,'Arquivo duplicado');tx.set(duplicate,{musicId:id});tx.set(db.collection('musicas').doc(id),{...u.data,size:u.size,fileName:u.fileName,storageKey:u.storageKey,storageProvider:u.storageProvider,sha256:u.sha256,quality:`${u.contentType}${u.data.duration ? ' · '+Math.round(u.size*8/u.data.duration/1000)+' kbps' : ''}`,createdAt:timestamp()});tx.update(uploadRef,{completed:true});tx.set(db.collection('audit').doc(),{actor:uid,action:'music.upload',details:{id},at:timestamp()})})
  return {id}
 }
 if(action==='keys-create') {const days=Number(body.days || 30);renewalEnd(null,days);const key=randomBytes(18).toString('base64url');await db.collection('activationKeys').doc(hash(key)).set({days,createdAt:timestamp(),createdBy:uid,usedBy:null});await audit(ctx,'keys.create',{days});return {key} }
 if(action==='keys-list') {const snap=await db.collection('activationKeys').orderBy('createdAt','desc').limit(100).get();return {keys:snap.docs.map(d=>({id:d.id,...d.data()}))} }
 if(action==='keys-revoke') {await db.collection('activationKeys').doc(cleanId(body.id)).update({revoked:true});await audit(ctx,'keys.revoke',{id:body.id});return {ok:true} }
 if(action==='music-edit') {const ids=uniqueIds(body.ids);const allowed={};for(const key of ['cantor','title','status','disabled','publishAt','tipo'])if(body.changes?.[key]!==undefined)allowed[key]=body.changes[key];if(!Object.keys(allowed).length)throw new HttpError(400,'Nenhuma alteração');const docs=await Promise.all(ids.map(id=>db.collection('musicas').doc(id).get()));const batch=db.batch();for(const d of docs){if(!d.exists)throw new HttpError(404,'Música não encontrada');const merged=metadata({...d.data(),...allowed});batch.update(d.ref,{...merged,...(typeof allowed.disabled==='boolean'?{disabled:allowed.disabled}:{}),updatedAt:timestamp()})}batch.set(db.collection('audit').doc(),{actor:uid,action:'music.edit',details:{ids,changes:allowed},at:timestamp()});await batch.commit();return {updated:ids.length} }
 if(action==='music-import') {if(!Array.isArray(body.rows)||body.rows.length>200)throw new HttpError(400,'Importe até 200 linhas por vez');const batch=db.batch();for(const row of body.rows){const id=cleanId(row.id);const snap=await db.collection('musicas').doc(id).get();if(!snap.exists)throw new HttpError(404,`Música ${id} não encontrada`);batch.update(snap.ref,{...metadata({...snap.data(),...row}),updatedAt:timestamp()})}batch.set(db.collection('audit').doc(),{actor:uid,action:'music.import',details:{count:body.rows.length},at:timestamp()});await batch.commit();return {updated:body.rows.length} }
 if(action==='user-edit') {const target=db.collection('users').doc(cleanId(body.uid));const snap=await target.get();if(!snap.exists)throw new HttpError(404,'Conta não encontrada');const changes={};if(typeof body.disabled==='boolean'){if(body.uid===uid && body.disabled)throw new HttpError(400,'Não desative a própria conta');changes.disabled=body.disabled}if(body.days)changes.subscriptionEnd=renewalEnd(snap.data().subscriptionEnd,Number(body.days)),changes.subscription='ativa';const batch=db.batch();batch.update(target,changes);batch.set(db.collection('audit').doc(),{actor:uid,action:'user.edit',details:{uid:body.uid,changes},at:timestamp()});await batch.commit();return {ok:true} }
 if(action==='notify') {const message=String(body.message || '').trim().slice(0,500);if(!message)throw new HttpError(400,'Informe a mensagem');await db.collection('notifications').add({message,createdAt:timestamp(),createdBy:uid});await audit(ctx,'notification.create');return {ok:true} }
 if(action==='dashboard') {const cols=['users','downloads','accesses','audit','packages'];const snaps=await Promise.all(cols.map(c=>db.collection(c).limit(1000).get()));const result=Object.fromEntries(cols.map((c,i)=>[c,snaps[i].docs.map(d=>{const data=d.data();delete data.password;return {id:d.id,...data}})]));result.summary={users:result.users.length,active:result.users.filter(u=>active(u)).length,downloads:result.downloads.length,accesses:result.accesses.length,requestedBytes:result.downloads.reduce((n,d)=>n+(d.bytes || 0),0),limited:snaps.some(s=>s.size>=1000)};return result }
 if(action==='music-check') {
  const ids=uniqueIds(body.ids);if(ids.length>10)throw new HttpError(400,'Verifique até 10 músicas por vez');
  const results=await Promise.all(ids.map(async id=>{const s=await db.collection('musicas').doc(id).get();if(!s.exists)return {id,available:false};const t=s.data();try{if(t.storageKey){const {client,Bucket}=storage(t.storageProvider);await client.send(new HeadObjectCommand({Bucket,Key:t.storageKey}))}else{const url=await signMedia(t);const response=await fetch(url,{method:'HEAD',redirect:'error',signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error()}return {id,available:true}}catch{return {id,available:false}}}));await audit(ctx,'music.check',{results});return {results}
 }
 throw new HttpError(400,'Operação desconhecida')
}
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff')
 if(req.method!=='POST')return res.status(405).json({error:'Use POST'})
 try {const body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!body || JSON.stringify(body).length>512000)throw new HttpError(413,'Solicitação muito grande');const ctx=await identity(req);return res.status(200).json(await execute(ctx,body))} catch(e){if(!e.status)console.error('API error',e.code || e.name);return res.status(e.status || 500).json({error:e.status?e.message:'Não foi possível concluir a operação.'})}
}
