import { db, auth } from '@/firebase'
import { collection, doc, getDocs, query, orderBy, limit, startAfter, runTransaction, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore'
import { validateKeyPolicy, redemptionPlan } from '@/utils/access-policy.mjs'
export async function keyId(code) {
 const bytes = new TextEncoder().encode(code.trim())
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte=>byte.toString(16).padStart(2,'0')).join('')
}
export async function createAccessKey(code, policy) {
 code=code.trim();if(code.length<6 || code.length>120)throw new Error('A chave deve ter entre 6 e 120 caracteres.')
 const valid=validateKeyPolicy(policy), ref=doc(db,'accessKeys',await keyId(code))
 await runTransaction(db,async tx=>{const existing=await tx.get(ref);if(existing.exists())throw new Error('Esta chave já existe.');tx.set(ref,{code,...valid,active:true,activationCount:0,createdAt:serverTimestamp()})})
 return code
}
export async function redeemAccessKey(code) {
 if(!auth.currentUser)throw new Error('Entre na sua conta para ativar o acesso.')
 if(!navigator.onLine)throw new Error('Conecte-se à internet para ativar uma chave.')
 const uid=auth.currentUser.uid,id=await keyId(code),key=doc(db,'accessKeys',id),receipt=doc(db,'keyRedemptions',id+'_'+uid),user=doc(db,'users',uid)
 return runTransaction(db,async tx=>{
  const [keySnap,receiptSnap,userSnap]=await Promise.all([tx.get(key),tx.get(receipt),tx.get(user)])
  const plan=redemptionPlan(keySnap.exists()?keySnap.data():null,userSnap.data(),receiptSnap.exists())
  if(!userSnap.exists())throw new Error('Perfil não encontrado. Entre novamente ou contate o administrador.')
  const endAt=plan.end===null?null:Timestamp.fromMillis(plan.end)
  tx.update(key,{activationCount:keySnap.data().activationCount+1})
  tx.set(receipt,{uid,keyId:id,createdAt:serverTimestamp(),lifetime:plan.lifetime,endAt})
  tx.update(user,{subscription:'ativa',subscriptionStart:serverTimestamp(),subscriptionEnd:endAt,subscriptionLifetime:plan.lifetime,accessRedemption:id+'_'+uid})
  return plan
 })
}
export async function listAccessKeys(cursor=null){const terms=[orderBy('createdAt','desc')];if(cursor)terms.push(startAfter(cursor));const snap=await getDocs(query(collection(db,'accessKeys'),...terms,limit(26)));return{keys:snap.docs.slice(0,25).map(d=>({id:d.id,...d.data()})),cursor:snap.docs.slice(0,25).at(-1),more:snap.size>25}}
export async function setKeyActive(id,active){await updateDoc(doc(db,'accessKeys',id),{active})}
export async function importLegacyKeys(){
 const snap=await getDocs(collection(db,'Chaves'));const codes=[...new Set(snap.docs.flatMap(d=>d.data().Keys||[]))];let count=0
 for(const code of codes){const ref=doc(db,'accessKeys',await keyId(code));await runTransaction(db,async tx=>{const old=await tx.get(ref);if(old.exists())return;tx.set(ref,{code,maxActivations:null,lifetime:false,durationDays:30,activationCount:0,active:true,legacy:true,createdAt:serverTimestamp()});count++})}
 return count
}
