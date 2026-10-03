import {createHash,randomUUID} from 'node:crypto'
import {Readable} from 'node:stream'
import archiver from 'archiver'
import {Upload} from '@aws-sdk/lib-storage'
import {database,storage,signMedia,timestamp} from '../api/_lib/admin.js'
import {assertPublished} from '../server/policy.js'
const db=database(),workerId=randomUUID(),hash=v=>createHash('sha256').update(v).digest('hex')
async function prepareGroups(){
 const songs=await db.collection('musicas').get();const groups=new Map()
 for(const s of songs.docs){const t=s.data();try{assertPublished(t)}catch{continue}const date=t.publishAt || t.createdAt?.toDate?.()?.toISOString() || '';const tipo=t.tipo || t.estilos || [];for(const group of [`cantor:${t.cantor}`,...(Array.isArray(tipo)?tipo:[tipo]).filter(Boolean).map(g=>`genero:${g}`),...(date?[`mes:${String(date).slice(0,7)}`]:[])]){if(!groups.has(group))groups.set(group,[]);groups.get(group).push(s)}}
 for(const [label,items] of groups){items.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);for(let offset=0;offset<items.length;offset+=200){const part=items.slice(offset,offset+200);const signature=hash(JSON.stringify(part.map(s=>[s.id,s.updateTime.toMillis()])));const ref=db.collection('packages').doc(signature);await db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)tx.set(ref,{ids:part.map(s=>s.id),label,status:'pending',size:part.reduce((n,s)=>n+(s.data().size || 0),0),tracks:part.map(s=>({id:s.id,title:s.data().title,cantor:s.data().cantor})),createdAt:timestamp()})})}}
 console.log('Pacotes por cantor, gênero e mês enfileirados.')
}
async function build(snapshot){const ref=snapshot.ref;const claim=await db.runTransaction(async tx=>{const s=await tx.get(ref);const t=s.data();if(t.status!=='pending' && !(t.status==='processing' && new Date(t.leaseUntil)<new Date()))return false;tx.update(ref,{status:'processing',workerId,leaseUntil:new Date(Date.now()+15*60000).toISOString()});return true});if(!claim)return
 let zip,upload;let heartbeat
 try{
  heartbeat=setInterval(()=>ref.update({leaseUntil:new Date(Date.now()+15*60000).toISOString()}).catch(()=>{}),60000)
  const s=await ref.get();const {client,Bucket,provider}=storage();const key=`packages/${ref.id}.zip`
  zip=archiver('zip',{store:true});upload=new Upload({client,params:{Bucket,Key:key,Body:zip,ContentType:'application/zip'},queueSize:2,partSize:8*1024*1024})
  const uploadPromise=upload.done();uploadPromise.catch(()=>{});let archiveError;zip.on('error',e=>{archiveError=e;upload.abort().catch(()=>{})})
  for(const [index,id] of s.data().ids.entries()){const song=await db.collection('musicas').doc(id).get();if(!song.exists)throw Error('Música inexistente');assertPublished(song.data());const url=await signMedia(song.data());const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(120000)});if(!response.ok || !response.body)throw Error('Arquivo indisponível');const name=(song.data().fileName || `${song.data().title}.mp3`).replace(/[^\p{L}\p{N}._ -]/gu,'_');zip.append(Readable.fromWeb(response.body),{name:`${String(index+1).padStart(3,'0')}-${name}`})}
  await zip.finalize();const result=await uploadPromise;if(archiveError)throw archiveError
  await ref.update({status:'ready',storageKey:key,storageProvider:provider,completedAt:timestamp(),etag:result.ETag || null})
  const requests=await db.collection('downloads').where('packageId','==',ref.id).get();for(let i=0;i<requests.size;i+=400){const batch=db.batch();for(const r of requests.docs.slice(i,i+400))batch.update(r.ref,{status:'ready'});await batch.commit()}
  console.log(`Pacote pronto: ${ref.id}`)
 }catch(e){zip?.destroy();await upload?.abort().catch(()=>{});await ref.update({status:'failed',error:'Falha ao preparar arquivos; consulte o administrador.',failedAt:timestamp()});console.error('Falha no pacote',ref.id,e.name)}finally{clearInterval(heartbeat)}
}
if(process.argv.includes('--prepare'))await prepareGroups()
if(process.argv.includes('--retry-failed')){const failed=await db.collection('packages').where('status','==','failed').get();for(const s of failed.docs)await s.ref.update({status:'pending'})}
const pending=await db.collection('packages').where('status','in',['pending','processing']).limit(20).get();for(const s of pending.docs)await build(s)
console.log('Ciclo de preparação concluído.')
