import { adminServices } from './firebase-admin.mjs'
import { PublicError,createKeys,redeemKey,limitAttempts,activeAccess,musicMetadata,operationId,nextAccess,keyPolicy } from './v2-core.mjs'
import { randomUUID } from 'node:crypto'
async function adminPage(db, collection, query, size=200) {
 let q=db.collection(collection).orderBy('createdAt','desc').orderBy('__name__','desc')
 if(query.cursor){const snap=await db.collection(collection).doc(operationId(query.cursor)).get();if(!snap.exists)throw new PublicError('Página indisponível. Atualize a lista.',400);q=q.startAfter(snap)}
 const snap=await q.limit(size+1).get(),docs=snap.docs.slice(0,size)
 return {items:docs.map(d=>({...d.data(),id:d.id})),nextCursor:snap.docs.length>size?docs.at(-1).id:null}
}
export async function identity(req, requireAdmin=false) {
 const token=String(req.headers.authorization || '').replace(/^Bearer /,'')
 if (!token)throw new PublicError('Entre na sua conta.',401)
 const {db,auth}=adminServices()
 let decoded;try{decoded=await auth.verifyIdToken(token,true)}catch{throw new PublicError('Sessão inválida. Entre novamente.',401)}
 if(requireAdmin){const user=await db.collection('users').doc(decoded.uid).get();if(!user.exists || user.data().role!=='admin')throw new PublicError('Apenas administradores podem executar esta ação.',403)}
 return {db,uid:decoded.uid}
}
export function createV2Handler({verifyObject}={}) { return async (req,res) => {
 res.setHeader('Cache-Control','no-store')
 try {
  const action=String(req.query.action || ''), input=req.body || {}
  if (action==='catalog' && req.method==='GET') {
   const {db}=adminServices();let q=db.collection('musicasV2').where('published','==',true).orderBy('createdAt','desc').orderBy('__name__','desc')
   if(req.query.cursor){const id=operationId(req.query.cursor),snap=await db.collection('musicasV2').doc(id).get();if(snap.exists)q=q.startAfter(snap)}
   const snap=await q.limit(51).get(),docs=snap.docs.slice(0,50)
   res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=120')
   return res.json({tracks:docs.map(d=>({...d.data(),id:d.id})),nextCursor:snap.docs.length>50 ? docs.at(-1).id : null})
  }
  const adminActions=['create-keys','list-keys','key-status','admin-music','music-status','music-edit','publish-music','list-users','set-access','audit','health']
  const {db,uid}=await identity(req,adminActions.includes(action))
  if(req.method==='GET') {
   if(action==='access'){const snap=await db.collection('accessV2').doc(uid).get();return res.json({access:snap.exists?snap.data():null})}
   if(action==='health')return res.json({ok:true,projectId:process.env.FIREBASE_PROJECT_ID || 'repertorio-d3552',catalog:'musicasV2',localUploads:!!verifyObject})
   if(action==='list-keys'){const page=await adminPage(db,'chavesV2',req.query);return res.json({keys:page.items,nextCursor:page.nextCursor})}
   if(action==='admin-music'){const page=await adminPage(db,'musicasV2',req.query);return res.json({tracks:page.items,nextCursor:page.nextCursor})}
   if(action==='audit'){const snap=await db.collection('auditV2').orderBy('at','desc').limit(100).get();return res.json({events:snap.docs.map(d=>({...d.data(),id:d.id}))})}
   if(action==='list-users'){
    let q=db.collection('users').orderBy('__name__')
    if(req.query.cursor){if(!/^[a-zA-Z0-9_-]{1,128}$/.test(req.query.cursor))throw new PublicError('Página inválida.');q=q.startAfter(req.query.cursor)}
    const snap=await q.limit(101).get(),docs=snap.docs.slice(0,100)
    return res.json({users:docs.map(d=>{const u=d.data();return {uid:d.id,name:`${u.firstName || ''} ${u.lastName || ''}`.trim(),email:u.email || ''}}),nextCursor:snap.docs.length>100?docs.at(-1).id:null})
   }
   throw new PublicError('Ação não encontrada.',404)
  }
  if(req.method!=='POST')throw new PublicError('Método não permitido.',405)
  if(action==='create-keys')return res.json(await createKeys(db,uid,input))
  if(action==='redeem'){await limitAttempts(db,uid);return res.json(await redeemKey(db,uid,input.code))}
  if(action==='key-status'){
   if(!/^[a-f0-9]{64}$/.test(input.id || '') || typeof input.active!=='boolean')throw new PublicError('Chave inválida.')
   await db.runTransaction(async tx=>{const r=db.collection('chavesV2').doc(input.id),s=await tx.get(r);if(!s.exists)throw new PublicError('Chave não encontrada.',404);tx.update(r,{active:input.active});tx.create(db.collection('auditV2').doc(randomUUID()),{type:input.active?'key-enabled':'key-disabled',keyId:input.id,uid,at:new Date().toISOString()})})
   return res.json({ok:true})
  }
  if(action==='publish-music'){
   if(!verifyObject)throw new PublicError('Publique pelo servidor local V2. Nenhum áudio é enviado à Vercel.',405)
   const id='v2_'+operationId(input.requestId),metadata=musicMetadata(input,process.env.R2_PUBLIC_BASE_URL)
   const ref=db.collection('musicasV2').doc(id),before=await ref.get()
   if(before.exists){if(before.data().objectKey!==metadata.objectKey)throw new PublicError('Operação já usada para outro arquivo.',409);return res.json({track:{...before.data(),id},reused:true})}
   await verifyObject(metadata)
   const track={...metadata,createdAt:new Date().toISOString(),createdBy:uid,downloadCount:0,playCount:0}
   await db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists){tx.create(ref,track);tx.create(db.collection('auditV2').doc('publish-'+id),{type:'music-published',uid,trackId:id,at:track.createdAt})}else if(s.data().objectKey!==metadata.objectKey)throw new PublicError('Operação já utilizada.',409)})
   return res.json({track:{...track,id}})
  }
  if(action==='music-status' || action==='music-edit'){
   const id=operationId(input.id),ref=db.collection('musicasV2').doc(id)
   await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists)throw new PublicError('Música não encontrada.',404)
    let patch
    if(action==='music-status'){if(typeof input.published!=='boolean')throw new PublicError('Estado inválido.');patch={published:input.published}}
    else{const meta=musicMetadata({...snap.data(),...input},process.env.R2_PUBLIC_BASE_URL || new URL(snap.data().downloadUrl).origin);patch={title:meta.title,cantor:meta.cantor,estilos:meta.estilos}}
    tx.update(ref,patch);tx.create(db.collection('auditV2').doc(randomUUID()),{type:action,uid,trackId:id,at:new Date().toISOString()})})
   return res.json({ok:true})
  }
  if(action==='set-access'){
   if(!/^[a-zA-Z0-9_-]{1,128}$/.test(input.uid || ''))throw new PublicError('Usuário inválido.')
   const ref=db.collection('accessV2').doc(input.uid)
   await db.runTransaction(async tx=>{const u=await tx.get(db.collection('users').doc(input.uid)),a=await tx.get(ref);if(!u.exists)throw new PublicError('Usuário não encontrado.',404)
    const grant=input.revoke===true?{status:'inactive',lifetime:false,endsAt:null,updatedAt:new Date().toISOString()}:nextAccess(input.replace ? null : a.exists?a.data():null,keyPolicy({durationDays:input.durationDays,lifetime:input.lifetime,maxActivations:1}),Date.now())
    tx.set(ref,grant,{merge:true});tx.create(db.collection('auditV2').doc(randomUUID()),{type:input.revoke?'access-revoked':'access-granted',uid,targetUid:input.uid,at:new Date().toISOString()})})
   return res.json({ok:true})
  }
  if(action==='download-metric') {
   const id=operationId(input.id),a=await db.collection('accessV2').doc(uid).get(),u=await db.collection('users').doc(uid).get(),data=u.exists?u.data():{}
   const end=data.subscriptionEnd?.toDate?.() ?? new Date(data.subscriptionEnd)
   if(!activeAccess(a.exists?a.data():null) && !(data.subscription==='ativa' && end.getTime()>Date.now()))throw new PublicError('Assinatura inativa.',403)
   // Métrica aproximada: uma contagem por conta, faixa e dia, para evitar cliques duplicados.
   const event=db.collection('downloadsV2').doc(uid+'_'+id+'_'+new Date().toISOString().slice(0,10)),track=db.collection('musicasV2').doc(id)
   await db.runTransaction(async tx=>{const [e,t]=await Promise.all([tx.get(event),tx.get(track)]);if(!t.exists)throw new PublicError('Música indisponível.',404);if(!e.exists){tx.create(event,{uid,trackId:id,at:new Date().toISOString()});tx.update(track,{downloadCount:(t.data().downloadCount||0)+1})}})
   return res.json({ok:true})
  }
  throw new PublicError('Ação não encontrada.',404)
 }catch(error){if(!error.status)console.error('V2:',error.code || error.name);return res.status(error.status || 503).json({error:error.status?error.message:'Serviço V2 indisponível. Confira configuração do Firebase, índices e cotas.'})}
} }
