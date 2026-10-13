import test from 'node:test'
import assert from 'node:assert/strict'
import { equalizerActive, equalizerPlan, canUseEqualizer } from '../src/utils/addon-policy.mjs'
import { deviceDescription, groupRecentDevices, DEVICE_RECENT_MS, deviceUuid } from '../src/utils/device-policy.mjs'
const now=1800000000000, key={feature:'equalizer',active:true,maxActivations:1,activationCount:0,lifetime:false,durationDays:30}
test('equalizador exige assinatura e liberação verificada, com exceção explícita do administrador',()=>{
 const user={role:'user',subscription:'ativa',subscriptionLifetime:true},grant={feature:'equalizer',active:true,lifetime:true}
 assert.equal(canUseEqualizer(user,grant,false,now),false);assert.equal(canUseEqualizer(user,grant,true,now),true)
 assert.equal(canUseEqualizer({...user,disabled:true},grant,true,now),false)
 assert.equal(canUseEqualizer({...user,subscription:'inativa'},grant,true,now),false)
 assert.equal(canUseEqualizer({...user,role:'admin'},null,false,now),true)
})
test('equalizador revogado ou expirado não libera processamento',()=>{
 assert.equal(equalizerActive({feature:'equalizer',active:true,lifetime:false,endAt:now},now),false)
 assert.equal(equalizerActive({feature:'equalizer',active:false,lifetime:true},now),false)
 assert.equal(equalizerActive({feature:'outro',active:true,lifetime:true},now),false)
})
test('novo código amplia prazo restante e preserva licença vitalícia vigente',()=>{
 const grant={feature:'equalizer',active:true,lifetime:false,endAt:now+5*86400000}
 assert.equal(equalizerPlan(key,grant,false,now).end,now+35*86400000)
 assert.equal(equalizerPlan(key,{...grant,active:false},false,now).end,now+30*86400000)
 assert.deepEqual(equalizerPlan(key,{feature:'equalizer',active:true,lifetime:true},false,now),{lifetime:true,end:null})
})
test('código desativado, esgotado, repetido ou contador inválido é recusado',()=>{
 assert.throws(()=>equalizerPlan({...key,active:false},null,false,now),/inválido/)
 assert.throws(()=>equalizerPlan({...key,activationCount:1},null,false,now),/limite/)
 assert.throws(()=>equalizerPlan(key,null,true,now),/já usou/)
 assert.throws(()=>equalizerPlan({...key,activationCount:-1},null,false,now),/inválida/)
})
test('contagem deduplica instalação, separa contas e alerta somente acima de quatro recentes',()=>{
 const devices=Array.from({length:5},(_,i)=>({uid:'a',deviceId:String(i),lastSeen:now-1000,loggedOut:false}))
 assert.equal(groupRecentDevices(devices.slice(0,4),now)[0].alert,false)
 const groups=groupRecentDevices([...devices,devices[0],{...devices[0],uid:'b'},{uid:'a',deviceId:'old',lastSeen:now-DEVICE_RECENT_MS-1},{uid:'a',deviceId:'out',lastSeen:now,loggedOut:true}],now)
 assert.equal(groups[0].count,5);assert.equal(groups[0].alert,true);assert.equal(groups[1].count,1)
})
test('descrição diferencia iOS, Android e Edge sem fingerprint ou dados pessoais',()=>{
 assert.deepEqual(deviceDescription({userAgent:'Mozilla/5.0 iPhone Mobile Safari',platform:'iPhone'}),{os:'iOS / iPadOS',browser:'Safari',kind:'Celular',installed:false})
 assert.equal(deviceDescription({userAgent:'Mozilla/5.0 Android Mobile Chrome/110'}).os,'Android')
 assert.equal(deviceDescription({userAgent:'Mozilla/5.0 Windows Chrome/110 Edg/110'}).browser,'Edge')
 assert.equal(deviceDescription({userAgent:'Mozilla/5.0 Mac Safari',platform:'MacIntel',maxTouchPoints:5},true).kind,'Tablet')
})
test('identificador usa UUID nativo ou bytes aleatórios sem depender de randomUUID',()=>{
 assert.equal(deviceUuid({randomUUID:()=> 'id-nativo'}),'id-nativo')
 assert.equal(deviceUuid({getRandomValues:bytes=>bytes.fill(16)}),'10101010-1010-4010-9010-101010101010')
 assert.equal(deviceUuid({}),null)
})
