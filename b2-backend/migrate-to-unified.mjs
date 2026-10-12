import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {Readable} from 'node:stream'
import {createHash} from 'node:crypto'
import dotenv from 'dotenv'
import {initializeApp,cert,deleteApp} from 'firebase-admin/app'
import {getFirestore,FieldPath,Timestamp} from 'firebase-admin/firestore'
import {getAuth} from 'firebase-admin/auth'
import {S3Client,HeadObjectCommand} from '@aws-sdk/client-s3'
import {Upload} from '@aws-sdk/lib-storage'
import {r2Configuration} from './r2-v2-upload.mjs'
import {TARGET_PROJECT,validateProjects,migrationId,migratedProfile,assertNoAuthConflicts,migrateCatalog} from './migration/model.mjs'
const directory=path.dirname(fileURLToPath(import.meta.url)),args=process.argv.slice(2),value=name=>args.includes(name)?args[args.indexOf(name)+1]:null
if(!value('--source-sa') || !value('--target-sa')){console.log('Uso: node b2-backend/migrate-to-unified.mjs --source-sa ARQUIVO --target-sa ARQUIVO [--hash-config ARQUIVO] [--apply]\nSem --apply: somente planejamento. Leia MIGRACAO-FIREBASE-R2.md.');process.exit(0)}
const apply=args.includes('--apply'),report={target:TARGET_PROJECT,apply,authImported:0,profilesCreated:0,documentsCopied:0},apps=[]
let client
async function docs(db,name){const list=[];let cursor;do{let q=db.collection(name).orderBy(FieldPath.documentId()).limit(200);if(cursor)q=q.startAfter(cursor);const snap=await q.get();list.push(...snap.docs);cursor=snap.size===200?snap.docs.at(-1):null}while(cursor);return list}
async function users(auth){const list=[];let token;do{const page=await auth.listUsers(1000,token);list.push(...page.users);token=page.pageToken}while(token);return list}
async function createOnly(ref,data){try{await ref.create(data);return true}catch(e){if(e.code===6 || e.code==='already-exists')return false;throw e}}
try{
 const sourceKey=JSON.parse(await fs.readFile(value('--source-sa'),'utf8')),targetKey=JSON.parse(await fs.readFile(value('--target-sa'),'utf8'));validateProjects(sourceKey.project_id,targetKey.project_id)
 const source=initializeApp({credential:cert(sourceKey)},'migration-source'),target=initializeApp({credential:cert(targetKey)},'migration-target');apps.push(source,target)
 const from=getFirestore(source),to=getFirestore(target),fromAuth=getAuth(source),toAuth=getAuth(target)
 const sourceUsers=await users(fromAuth),targetUsers=await users(toAuth);assertNoAuthConflicts(sourceUsers,targetUsers)
 const existingUsers=new Set(targetUsers.map(u=>u.uid)),newUsers=sourceUsers.filter(u=>!existingUsers.has(u.uid)),passwordUsers=newUsers.filter(u=>u.providerData.some(p=>p.providerId==='password'))
 let hash
 if(passwordUsers.length && apply){if(!value('--hash-config'))throw Error('Informe --hash-config para conservar as senhas das contas que usam e-mail e senha.');const h=JSON.parse(await fs.readFile(value('--hash-config'),'utf8'));if(!h.key || !Number.isInteger(h.rounds) || !Number.isInteger(h.memCost))throw Error('Hash config inválida. Leia o guia.');hash={algorithm:'SCRYPT',key:Buffer.from(h.key,'base64'),saltSeparator:Buffer.from(h.saltSeparator||'','base64'),rounds:h.rounds,memoryCost:h.memCost};if(passwordUsers.some(u=>!u.passwordHash || /REDACTED/i.test(u.passwordHash)))throw Error('A conta de serviço da origem não pode ler todos os hashes. Confira as permissões do Firebase Authentication antes de migrar.')}
 const legacy=await docs(from,'musicas'),v2=await docs(from,'musicasV2'),v2Ids=new Set(v2.map(d=>d.id)),idMap=new Map(),records=[]
 for(const [collection,list] of [['musicasV2',v2],['musicas',legacy]])for(const document of list){const targetId=migrationId(collection,document.id,v2Ids);idMap.set(collection+'/'+document.id,targetId);records.push({collection,id:document.id,targetId,data:document.data()})}
 report.source=sourceKey.project_id;report.authPlanned=newUsers.length;report.musicPlanned=records.length;report.passwordHashRequired=passwordUsers.length>0
 console.log(JSON.stringify({source:report.source,target:report.target,apply,accounts:newUsers.length,tracks:records.length,passwordHashRequired:report.passwordHashRequired}))
 if(apply){
  dotenv.config({path:path.join(directory,'.env.r2-v2'),override:true,quiet:true});const config=r2Configuration();client=new S3Client(config)
  for(let i=0;i<newUsers.length;i+=1000){const batch=newUsers.slice(i,i+1000).map(u=>({uid:u.uid,email:u.email,emailVerified:u.emailVerified,displayName:u.displayName,disabled:u.disabled,phoneNumber:u.phoneNumber,photoURL:u.photoURL,providerData:u.providerData,customClaims:u.customClaims,...(u.passwordHash?{passwordHash:Buffer.from(u.passwordHash,'base64'),passwordSalt:Buffer.from(u.passwordSalt||'','base64')}:{})}));const result=await toAuth.importUsers(batch,hash?{hash}:undefined);report.authImported+=result.successCount;if(result.failureCount)throw Error(`${result.failureCount} contas não foram importadas. A migração foi interrompida; execute novamente após resolver os conflitos.`)}
  async function copyAudio(record){
   const data=record.data,filename=String(data.fileName || `${data.title || record.id}.mp3`).split(/[\\/]/).at(-1).replace(/[\u0000-\u001f]/g,'')
   const digest=createHash('sha256').update(record.collection+'/'+record.id).digest('hex').slice(0,32),uuid=[digest.slice(0,8),digest.slice(8,12),digest.slice(12,16),digest.slice(16,20),digest.slice(20)].join('-')
   const objectKey=data.storageProvider==='r2' && data.objectKey?.startsWith('musicas-v2/')?data.objectKey:`musicas-v2/${uuid}-${filename}`
   let head
   try{head=await client.send(new HeadObjectCommand({Bucket:config.bucket,Key:objectKey}))}catch(e){if(e.$metadata?.httpStatusCode!==404 && !['NotFound','NoSuchKey'].includes(e.name))throw e}
   let size=head?.ContentLength,contentType=head?.ContentType
   if(!head){const url=new URL(data.downloadUrl);if(url.protocol!=='https:')throw Error('URL da música de origem inválida.');const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok || !response.body || /text\/html|application\/json/.test(response.headers.get('content-type')||''))throw Error('A origem não retornou áudio válido.');size=Number(response.headers.get('content-length'))||undefined;contentType=data.contentType || response.headers.get('content-type') || 'audio/mpeg';const task=new Upload({client,params:{Bucket:config.bucket,Key:objectKey,Body:Readable.fromWeb(response.body),ContentType:contentType,...(size?{ContentLength:size}:{}),CacheControl:'public, max-age=31536000, immutable'},queueSize:2,partSize:8*1024*1024,leavePartsOnError:false});await task.done();const confirmed=await client.send(new HeadObjectCommand({Bucket:config.bucket,Key:objectKey}));size=confirmed.ContentLength;contentType=confirmed.ContentType}
   if(!size)throw Error('O objeto R2 não possui áudio válido.');return {fileId:objectKey,objectKey,downloadUrl:config.publicBase+'/'+objectKey.split('/').map(encodeURIComponent).join('/'),storageProvider:'r2',fileName:filename,size,contentType}
  }
  report.catalog=await migrateCatalog(records,{apply:true,readTarget:async id=>(await to.collection('musicasV2').doc(id).get()).exists,copyAudio,writeTrack:(id,data)=>to.collection('musicasV2').doc(id).create({...data,createdAt:data.createdAt || Timestamp.now()})})
  const profiles=await docs(from,'users');for(const document of profiles)if(await createOnly(to.collection('users').doc(document.id),migratedProfile(document.data(),idMap)))report.profilesCreated++
  for(const name of ['Chaves','accessKeys','keyRedemptions'])for(const document of await docs(from,name))if(await createOnly(to.collection(name).doc(document.id),document.data()))report.documentsCopied++
  const masters=new Map();for(const record of records){const d=record.data;if(d.cantor)masters.set('cantoresV2/'+d.cantor,{collection:'cantoresV2',name:d.cantor});for(const genre of Array.isArray(d.tipo)?d.tipo:d.tipo?[d.tipo]:[])masters.set('estilosV2/'+genre,{collection:'estilosV2',name:genre})}
  for(const [old,newName] of [['cantores','cantoresV2'],['cantoresV2','cantoresV2'],['estilos','estilosV2'],['estilosV2','estilosV2']])for(const document of await docs(from,old)){const d=document.data();if(d.nome)masters.set(newName+'/'+d.nome,{collection:newName,name:d.nome,data:d})}
  const existingMasters=new Set();for(const name of ['cantoresV2','estilosV2'])for(const document of await docs(to,name)){const d=document.data();if(d.nome)existingMasters.add(name+'/'+d.nome)}
  for(const item of masters.values()){if(existingMasters.has(item.collection+'/'+item.name))continue;const id=createHash('sha256').update(item.name).digest('hex').slice(0,32);if(await createOnly(to.collection(item.collection).doc(id),{...item.data,nome:item.name,...(item.collection==='cantoresV2'?{downloads:Math.max(0,Math.trunc(Number(item.data?.downloads)||0))}:{})}))report.documentsCopied++}
 }else report.catalog=await migrateCatalog(records,{apply:false})
 const reportPath=path.join(directory,'migration-report.json');await fs.writeFile(reportPath,JSON.stringify(report,null,2));console.log(JSON.stringify({done:true,apply,authImported:report.authImported,profilesCreated:report.profilesCreated,catalog:report.catalog,reportPath}))
 if(report.catalog.failures.length)process.exitCode=1
}catch(e){console.error('Migração interrompida:',e.message);process.exitCode=1}
finally{client?.destroy();await Promise.all(apps.map(deleteApp))}
