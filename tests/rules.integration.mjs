import { before,after,beforeEach,test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { initializeTestEnvironment,assertSucceeds,assertFails } from '@firebase/rules-unit-testing'
import { doc,getDoc,getDocs,collection,collectionGroup,where,setDoc,updateDoc,runTransaction,serverTimestamp,Timestamp,increment,writeBatch,query,orderBy,documentId,limit,startAfter } from 'firebase/firestore'
const projectId='demo-repertorio',hash='a'.repeat(64),hash2='b'.repeat(64)
let env
before(async()=>{env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8088,rules:await readFile('firestore.rules','utf8')}})})
after(async()=>env?.cleanup())
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await Promise.all(['admin','alice','bob','carol'].map(uid=>setDoc(doc(db,'users',uid),{email:uid+'@test.local',role:uid==='admin'?'admin':'user',subscription:'inativa',favorites:[]})));await setDoc(doc(db,'musicas','normal'),{title:'Antiga',playCount:0,downloadCount:0});await setDoc(doc(db,'musicasV2','v2'),{title:'V2',playCount:0,downloadCount:0});await setDoc(doc(db,'accessKeys',hash),{active:true,lifetime:false,durationDays:30,maxActivations:1,activationCount:0,code:'chave-teste'});await setDoc(doc(db,'accessKeys',hash2),{active:true,lifetime:true,durationDays:0,maxActivations:null,activationCount:0,code:'chave-vitalicia'})})})
function client(uid){return env.authenticatedContext(uid,{email:uid+'@test.local'}).firestore()}
async function redeem(uid,id=hash,{endDays=30}={}){const db=client(uid),key=doc(db,'accessKeys',id),receipt=doc(db,'keyRedemptions',id+'_'+uid),user=doc(db,'users',uid);return runTransaction(db,async tx=>{const[k,r]=await Promise.all([tx.get(key),tx.get(receipt)]);if(r.exists() && !k.data().legacy)throw new Error('já usada');if(k.data().maxActivations!==null && k.data().activationCount>=k.data().maxActivations)throw new Error('limite');const lifetime=k.data().lifetime,endAt=lifetime?null:Timestamp.fromMillis(Date.now()+endDays*86400000);tx.update(key,{activationCount:k.data().activationCount+1});tx.set(receipt,{uid,keyId:id,createdAt:serverTimestamp(),lifetime,endAt});tx.update(user,{subscription:'ativa',subscriptionStart:serverTimestamp(),subscriptionEnd:endAt,subscriptionLifetime:lifetime,accessRedemption:id+'_'+uid})})}
test('visitante lê catálogos normais e V2, mas não usuários ou chaves',async()=>{const db=env.unauthenticatedContext().firestore();await assertSucceeds(getDoc(doc(db,'musicas','normal')));await assertSucceeds(getDoc(doc(db,'musicasV2','v2')));await assertFails(getDoc(doc(db,'users','alice')));await assertFails(getDoc(doc(db,'accessKeys',hash)))})
test('usuário lê seu perfil e favoritos sem conseguir virar admin ou ativar sozinho',async()=>{const db=client('alice');await assertSucceeds(getDoc(doc(db,'users','alice')));await assertFails(getDocs(collection(db,'users')));await assertFails(getDoc(doc(db,'users','bob')));await assertSucceeds(updateDoc(doc(db,'users','alice'),{favorites:['normal','v2:v2']}));await assertFails(updateDoc(doc(db,'users','alice'),{role:'admin'}));await assertFails(updateDoc(doc(db,'users','alice'),{subscription:'ativa',subscriptionLifetime:true}))})
test('cadastro novo sem senha no perfil e bloqueio de cadastro privilegiado',async()=>{const db=client('newuser');await assertSucceeds(setDoc(doc(db,'users','newuser'),{email:'newuser@test.local',role:'user',subscription:'inativa',favorites:[]}));await assertFails(setDoc(doc(client('evil'),'users','evil'),{email:'evil@test.local',role:'admin',subscription:'ativa'}));await assertFails(setDoc(doc(client('secret'),'users','secret'),{email:'secret@test.local',role:'user',password:'texto'}))})
test('administrador preserva escrita dos envios normal e V2; usuário incrementa métricas apenas',async()=>{const db=client('admin');for(const name of ['musicas','musicasV2','cantores','cantoresV2','estilos','estilosV2'])await assertSucceeds(setDoc(doc(db,name,'added'),{title:'cadastro',nome:'teste'}));await assertSucceeds(updateDoc(doc(client('alice'),'musicas','normal'),{playCount:increment(1)}));await assertFails(updateDoc(doc(client('alice'),'musicas','normal'),{downloadUrl:'https://evil.test'}));await assertFails(updateDoc(doc(client('alice'),'musicas','normal'),{playCount:999}))})
test('limite de uma ativação resiste a solicitações simultâneas de duas contas',async()=>{const result=await Promise.allSettled([redeem('alice'),redeem('bob')]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);const key=await getDoc(doc(client('admin'),'accessKeys',hash));assert.equal(key.data().activationCount,1)})
test('chave ilimitada vitalícia funciona para várias contas e não pode ser repetida',async()=>{await assertSucceeds(redeem('alice',hash2));await assertSucceeds(redeem('bob',hash2));await assert.rejects(redeem('alice',hash2),/já usada/);const u=await getDoc(doc(client('alice'),'users','alice'));assert.equal(u.data().subscriptionLifetime,true);assert.equal(u.data().subscriptionEnd,null);assert.equal((await getDoc(doc(client('admin'),'accessKeys',hash2))).data().activationCount,2)})
test('prazo adulterado e contador sem recibo são recusados',async()=>{await assertFails(redeem('alice',hash,{endDays:36500}));await assertFails(updateDoc(doc(client('alice'),'accessKeys',hash),{activationCount:1}));assert.equal((await getDoc(doc(client('admin'),'accessKeys',hash))).data().activationCount,0)})
test('chave desativada, conta desativada e enumeração de chaves são bloqueadas',async()=>{await updateDoc(doc(client('admin'),'accessKeys',hash),{active:false});await assertFails(redeem('alice'));await assertFails(getDocs(collection(client('alice'),'accessKeys')));await updateDoc(doc(client('admin'),'users','bob'),{disabled:true});await assertFails(redeem('bob',hash2))})
test('consulta administrativa pagina sem repetir usuários e inclui perfis antigos sem createdAt',async()=>{const db=client('admin');const first=await getDocs(query(collection(db,'users'),orderBy(documentId()),limit(2)));const second=await getDocs(query(collection(db,'users'),orderBy(documentId()),startAfter(first.docs.at(-1)),limit(2)));assert.equal(new Set([...first.docs,...second.docs].map(d=>d.id)).size,4)})

test('chaves antigas mantêm renovação após expirar, sem renovar conta ainda ativa',async()=>{
 const db=client('admin')
 await updateDoc(doc(db,'accessKeys',hash),{legacy:true,maxActivations:null})
 await assertSucceeds(redeem('alice'))
 await assertFails(redeem('alice'))
 await updateDoc(doc(db,'users','alice'),{subscriptionEnd:Timestamp.fromMillis(Date.now()-1000)})
 await assertSucceeds(redeem('alice'))
 assert.equal((await getDoc(doc(db,'accessKeys',hash))).data().activationCount,2)
})

test('playlists privadas permitem ordenar e mover listas em lote e bloqueiam outra conta',async()=>{
 const db=client('alice'),a=doc(db,'users','alice','playlists','a'),b=doc(db,'users','alice','playlists','b');const p={name:'Minha lista',trackIds:['v2:1','v2:2'],createdAt:Date.now(),updatedAt:serverTimestamp()}
 await assertSucceeds(setDoc(a,p));await assertSucceeds(updateDoc(a,{trackIds:['v2:2','v2:1'],updatedAt:serverTimestamp()}));await assertSucceeds(setDoc(b,{...p,name:'Outra',trackIds:[]}))
 const move=writeBatch(db);move.update(a,{trackIds:['v2:1'],updatedAt:serverTimestamp()});move.update(b,{trackIds:['v2:2'],updatedAt:serverTimestamp()});await assertSucceeds(move.commit());assert.deepEqual((await getDoc(a)).data().trackIds,['v2:1']);assert.deepEqual((await getDoc(b)).data().trackIds,['v2:2'])
 await assertFails(getDoc(doc(client('bob'),'users','alice','playlists','a')));await assertFails(getDocs(collection(client('bob'),'users','alice','playlists')));await assertFails(setDoc(doc(client('bob'),'users','alice','playlists','hack'),p))
 await assertFails(updateDoc(a,{trackIds:['v2:1','v2:1'],updatedAt:serverTimestamp()}));await assertFails(updateDoc(a,{name:'',updatedAt:serverTimestamp()}));await assertFails(updateDoc(a,{trackIds:Array.from({length:501},(_,i)=>String(i)),updatedAt:serverTimestamp()}));await assertFails(updateDoc(a,{createdAt:1,updatedAt:serverTimestamp()}))
})
test('preferências e histórico têm regras próprias e não vazam para administrador ou visitante',async()=>{
 const db=client('alice'),prefs=doc(db,'users','alice','musicSettings','main'),history=doc(db,'users','alice','history','v2%3A1')
 await assertSucceeds(setDoc(prefs,{following:['João'],seen:{joao:Date.now()},syncHistory:true,updatedAt:serverTimestamp()}));await assertSucceeds(setDoc(history,{key:'v2:1',track:{id:'1',title:'Teste'},positionSeconds:15,durationSeconds:60,completed:false,lastPlayedAt:Date.now(),updatedAt:serverTimestamp()}))
 for(const uid of ['bob','admin']){await assertFails(getDoc(doc(client(uid),'users','alice','musicSettings','main')));await assertFails(getDocs(collection(client(uid),'users','alice','history')))}
 await assertFails(updateDoc(history,{positionSeconds:-1,updatedAt:serverTimestamp()}));await assertFails(updateDoc(prefs,{following:Array.from({length:101},(_,i)=>String(i)),updatedAt:serverTimestamp()}));await assertFails(updateDoc(prefs,{syncHistory:'true',updatedAt:serverTimestamp()}))
})
test('perfil desativado não pode escrever biblioteca privada',async()=>{await updateDoc(doc(client('admin'),'users','bob'),{disabled:true});await assertFails(setDoc(doc(client('bob'),'users','bob','playlists','x'),{name:'Teste',trackIds:[],createdAt:Date.now(),updatedAt:serverTimestamp()}))})

async function seedEqualizer({maximum=1,lifetime=false}={}){
 const db=client('admin');for(const uid of ['alice','bob'])await updateDoc(doc(db,'users',uid),{subscription:'ativa',subscriptionLifetime:true})
 await setDoc(doc(db,'equalizerKeys',hash),{feature:'equalizer',active:true,activationCount:0,maxActivations:maximum,lifetime,durationDays:lifetime?0:30,code:'EQ-TESTE'})
}
async function redeemEq(uid,{days=30,writeGrant=true}={}){
 const db=client(uid),key=doc(db,'equalizerKeys',hash),receiptId=hash+'_'+uid,receipt=doc(db,'equalizerRedemptions',receiptId),grant=doc(db,'users',uid,'addons','equalizer')
 return runTransaction(db,async tx=>{
  const [k,r,g]=await Promise.all([tx.get(key),tx.get(receipt),tx.get(grant)])
  if(r.exists())throw new Error('já usado');if(k.data().maxActivations!==null&&k.data().activationCount>=k.data().maxActivations)throw new Error('limite')
  const lifetime=k.data().lifetime||(g.exists()&&g.data().active&&g.data().lifetime),base=g.exists()&&g.data().active&&!g.data().lifetime&&g.data().endAt?.toMillis()>Date.now()?g.data().endAt.toMillis():Date.now(),endAt=lifetime?null:Timestamp.fromMillis(base+days*86400000)
  tx.update(key,{activationCount:k.data().activationCount+1});tx.set(receipt,{uid,keyId:hash,feature:'equalizer',createdAt:serverTimestamp(),lifetime:!!lifetime,endAt})
  if(writeGrant)tx.set(grant,{feature:'equalizer',active:true,lifetime:!!lifetime,endAt,grantedAt:serverTimestamp(),keyId:hash,receiptId})
 })
}
test('código de equalizador concede adicional em transação, sem alterar a assinatura',async()=>{
 await seedEqualizer();await assertSucceeds(redeemEq('alice'));const db=client('alice'),grant=(await getDoc(doc(db,'users','alice','addons','equalizer'))).data()
 assert.equal(grant.active,true);assert.equal(grant.lifetime,false);assert.equal((await getDoc(doc(db,'users','alice'))).data().subscriptionLifetime,true)
 await assertFails(updateDoc(doc(db,'users','alice','addons','equalizer'),{lifetime:true,endAt:null}));await assert.rejects(redeemEq('alice'),/já usado/)
})
test('códigos do equalizador resistem a concorrência e não podem ser enumerados por usuário',async()=>{
 await seedEqualizer();const results=await Promise.allSettled([redeemEq('alice'),redeemEq('bob')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1)
 await assertFails(getDocs(collection(client('alice'),'equalizerKeys')));await assertFails(getDocs(collection(client('alice'),'equalizerRedemptions')))
 assert.equal((await getDoc(doc(client('admin'),'equalizerKeys',hash))).data().activationCount,1)
})
test('concessão sem código, prazo adulterado e transação sem liberação são recusados',async()=>{
 await seedEqualizer();const db=client('alice');await assertFails(setDoc(doc(db,'users','alice','addons','equalizer'),{feature:'equalizer',active:true,lifetime:true,endAt:null,grantedAt:serverTimestamp(),keyId:hash,receiptId:hash+'_alice'}))
 await assertFails(redeemEq('alice',{days:36500}));await assertFails(redeemEq('alice',{writeGrant:false}));assert.equal((await getDoc(doc(client('admin'),'equalizerKeys',hash))).data().activationCount,0)
})
test('assinatura inativa, conta desativada e código desativado não concedem equalizador',async()=>{
 await seedEqualizer();const db=client('admin');await updateDoc(doc(db,'users','alice'),{subscription:'inativa'});await assertFails(redeemEq('alice'))
 await updateDoc(doc(db,'users','bob'),{disabled:true});await assertFails(redeemEq('bob'));await updateDoc(doc(db,'users','bob'),{disabled:false});await updateDoc(doc(db,'equalizerKeys',hash),{active:false});await assertFails(redeemEq('bob'))
})
test('administrador revoga licença; cliente não reativa nem lê a de outra conta',async()=>{
 await seedEqualizer({maximum:null,lifetime:true});await assertSucceeds(redeemEq('alice'));await assertSucceeds(redeemEq('bob'));const grant=doc(client('admin'),'users','alice','addons','equalizer')
 await assertSucceeds(updateDoc(grant,{active:false}));await assertFails(updateDoc(doc(client('alice'),'users','alice','addons','equalizer'),{active:true}));await assertFails(getDoc(doc(client('bob'),'users','alice','addons','equalizer')))
 await assertSucceeds(updateDoc(grant,{active:true}));assert.equal((await getDoc(grant)).data().lifetime,true)
})
function device(uid,id='11111111-1111-4111-8111-111111111111'){return{uid,deviceId:id,browser:'Chrome',os:'Windows',kind:'Computador',installed:false,loggedOut:false,createdAt:serverTimestamp(),lastSeen:serverTimestamp(),lastLoginAt:serverTimestamp()}}
test('aparelho só registra sua conta, com horário do servidor e metadados limitados',async()=>{
 const id='11111111-1111-4111-8111-111111111111',db=client('alice'),ref=doc(db,'users','alice','devices',id)
 await assertSucceeds(setDoc(ref,device('alice')));await assertSucceeds(updateDoc(ref,{lastSeen:serverTimestamp(),loggedOut:true}))
 await assertFails(updateDoc(ref,{lastSeen:Timestamp.fromMillis(Date.now()+86400000)}));await assertFails(updateDoc(ref,{lastSeen:serverTimestamp(),ip:'1.2.3.4'}))
 await assertFails(setDoc(doc(db,'users','bob','devices',id),device('bob')));await assertFails(updateDoc(ref,{lastSeen:serverTimestamp(),createdAt:serverTimestamp()}))
})
test('histórico e consulta global de aparelhos são privados; alertas só podem ser escritos por admin',async()=>{
 const id='11111111-1111-4111-8111-111111111111';await setDoc(doc(client('alice'),'users','alice','devices',id),device('alice'))
 await assertSucceeds(getDocs(collection(client('alice'),'users','alice','devices')));await assertFails(getDocs(collection(client('bob'),'users','alice','devices')))
 await assertFails(getDocs(collectionGroup(client('alice'),'devices')));await assertFails(getDocs(collectionGroup(env.unauthenticatedContext().firestore(),'devices')))
 await assertSucceeds(getDocs(query(collectionGroup(client('admin'),'devices'),where('lastSeen','>=',Timestamp.fromMillis(Date.now()-60000)),orderBy('lastSeen','desc'))))
 await assertFails(setDoc(doc(client('alice'),'adminDeviceAlerts','alice'),{uid:'alice',count:5}));await assertSucceeds(setDoc(doc(client('admin'),'adminDeviceAlerts','alice'),{uid:'alice',count:5}));await assertFails(getDoc(doc(client('bob'),'adminDeviceAlerts','alice')))
})
