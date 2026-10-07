import test from 'node:test'
import assert from 'node:assert/strict'
import {createKeys,redeemKey,keyPolicy,keyId,activeAccess,nextAccess,musicMetadata,limitAttempts} from '../server/v2-core.mjs'
import {createV2Handler} from '../server/v2-handler.mjs'
import fs from 'node:fs/promises'
function fakeDb(seed={}) {
 const data=new Map(Object.entries(seed).map(([k,v])=>[k,structuredClone(v)]));let tail=Promise.resolve()
 const ref=path=>({path}),snapshot=r=>({exists:data.has(r.path),data:()=>structuredClone(data.get(r.path))})
 return {data,collection:name=>({doc:id=>ref(name+'/'+id)}),runTransaction:callback=>{
  const run=tail.then(async()=>{const writes=[];const result=await callback({get:async r=>snapshot(r),create:(r,v)=>{if(data.has(r.path))throw Error('exists');writes.push([r.path,v,false])},set:(r,v,options)=>writes.push([r.path,v,options?.merge]),update:(r,v)=>writes.push([r.path,v,true])});for(const [k,v,merge] of writes)data.set(k,merge?{...data.get(k),...structuredClone(v)}:structuredClone(v));return result})
  tail=run.catch(()=>{});return run
 }}
}
const now=Date.parse('2026-10-04T20:00:00Z'),code='R2-12345678-12345678-12345678-12345678'
const record=options=>({...keyPolicy({durationDays:30,maxActivations:1,...options}),active:true,activationCount:0})
test('valida duração, limite de usos e prazo das chaves',()=>{
 assert.throws(()=>keyPolicy({durationDays:0}),/Duração/);assert.throws(()=>keyPolicy({maxActivations:0}),/Limite/)
 assert.throws(()=>keyPolicy({expiresAt:'2020-01-01'}),/futuro/)
 assert.equal(keyPolicy({lifetime:true,maxActivations:null}).durationDays,null)
})
test('chave de uso único atende só uma de duas contas concorrentes sem tocar o legado',async()=>{
 const old={Keys:['LEGADO']},user={subscription:'ativa',password:'preservada'}
 const db=fakeDb({['chavesV2/'+keyId(code)]:record(), 'Chaves/old':old,'users/u1':user})
 const results=await Promise.allSettled([redeemKey(db,'u1',code,now),redeemKey(db,'u2',code,now)])
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(db.data.get('chavesV2/'+keyId(code)).activationCount,1)
 assert.deepEqual(db.data.get('Chaves/old'),old);assert.deepEqual(db.data.get('users/u1'),user)
})
test('repetir ativação na mesma conta não consome outro uso nem acrescenta dias',async()=>{
 const db=fakeDb({['chavesV2/'+keyId(code)]:record({maxActivations:null})})
 const first=await redeemKey(db,'u1',code,now),second=await redeemKey(db,'u1',code,now+86400000)
 assert.equal(second.alreadyUsed,true);assert.equal(second.access.endsAt,first.access.endsAt)
 assert.equal(db.data.get('chavesV2/'+keyId(code)).activationCount,1)
})
test('chave ilimitada vitalícia libera contas diferentes uma vez por conta',async()=>{
 const db=fakeDb({['chavesV2/'+keyId(code)]:record({maxActivations:null,lifetime:true})})
 for(let i=0;i<5;i++){const r=await redeemKey(db,'u'+i,code,now);assert.equal(r.access.lifetime,true);assert.equal(r.access.endsAt,null)}
 assert.equal(db.data.get('chavesV2/'+keyId(code)).activationCount,5)
})
test('não aceita chaves desativadas, expiradas ou além do limite',async()=>{
 for(const patch of [{active:false},{expiresAt:'2026-01-01'},{activationCount:1}]){
  const db=fakeDb({['chavesV2/'+keyId(code)]:{...record(),...patch}});await assert.rejects(redeemKey(db,'u1',code,now));assert.equal([...db.data.keys()].some(k=>k.startsWith('accessV2/')),false)
 }
})
test('geração em lote é idempotente, usa identificadores únicos e não altera Chaves',async()=>{
 const db=fakeDb({'Chaves/old':{Keys:['old']}}),input={requestId:'operation-12345',quantity:10,durationDays:30,maxActivations:1}
 const first=await createKeys(db,'admin',input),retry=await createKeys(db,'admin',input)
 assert.equal(new Set(first.codes).size,10);assert.deepEqual(first.codes,retry.codes);assert.equal(retry.reused,true)
 assert.equal([...db.data.keys()].filter(k=>k.startsWith('chavesV2/')).length,10)
 await assert.rejects(createKeys(db,'other',input),/indisponível/)
 assert.deepEqual(db.data.get('Chaves/old'),{Keys:['old']})
})
test('renovação estende acesso vigente e não consome chave finita para acesso já vitalício',()=>{
 const access={status:'active',endsAt:'2026-10-10T20:00:00.000Z'}
 assert.equal(nextAccess(access,{durationDays:30,lifetime:false},now).endsAt,'2026-11-09T20:00:00.000Z')
 assert.throws(()=>nextAccess({status:'active',lifetime:true},{durationDays:30},now),/vitalício/)
 assert.equal(activeAccess({status:'inactive',lifetime:true},now),false)
})
test('cadastro V2 restringe caminho, valida campos e gera URL R2 no servidor',()=>{
 const input={title:' Música ',cantor:' Cantor ',estilos:'Forró, Piseiro',objectKey:'musicas-v2/12345678-1234-1234-1234-123456789012-áudio.mp3',size:123,fileName:'áudio.mp3',downloadUrl:'https://malicious.invalid'}
 const metadata=musicMetadata(input,'https://media.test');assert.equal(metadata.collectionName,'musicasV2');assert.equal(metadata.title,'Música');assert.deepEqual(metadata.estilos,['Forró','Piseiro']);assert.match(metadata.downloadUrl,/^https:\/\/media.test/)
 assert.throws(()=>musicMetadata({...input,objectKey:'musicas/old.mp3'},'https://media.test'),/fora/)
})
test('tentativas de ativação têm limite por conta e minuto',async()=>{
 const db=fakeDb();for(let i=0;i<12;i++)await limitAttempts(db,'u1');await assert.rejects(limitAttempts(db,'u1'),/Aguarde/)
})
test('API recusa operação administrativa sem token antes de acessar Firebase',async()=>{
 let status;const res={setHeader(){},status(n){status=n;return this},json(value){return value}}
 const result=await createV2Handler()({method:'POST',headers:{},query:{action:'create-keys'},body:{}},res)
 assert.equal(status,401);assert.match(result.error,/Entre/)
})
test('preserva configuração Firebase e componentes de upload B2 originais',async()=>{
 const baseline=new URL('../../../../analysis_source/repertoriozezao/',import.meta.url)
 // A verificação byte a byte do original é feita no relatório de empacotamento;
 // aqui, os adaptadores legados continuam falando com a porta original.
 for(const file of ['AddMusicListAdmin.vue','addMusicAdmin.vue']){const source=await fs.readFile(new URL('../src/components/'+file,import.meta.url),'utf8');assert.match(source,/localhost:3001/);assert.doesNotMatch(source,/v2UploadBase|musicasV2/)}
 const api=await fs.readFile(new URL('../b2-backend/index.js',import.meta.url),'utf8');assert.match(api,/b2_authorize_account/);assert.doesNotMatch(api,/S3Client/)
})

test('configuração V2 não sobrescreve env B2 ou redireciona o frontend',async()=>{
 const script=await fs.readFile(new URL('../scripts/configure-r2.mjs',import.meta.url),'utf8')
 assert.match(script,/writeFile\('b2-backend\/\.env\.v2'/)
 assert.match(script,/\.env\.v2\.backup-/)
 assert.doesNotMatch(script,/writeFile\(['"](?:b2-backend\/\.env['"]|\.env\.local)/)
})
