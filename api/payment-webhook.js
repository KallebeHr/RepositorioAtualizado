import {createHmac,timingSafeEqual} from 'node:crypto'
import {database,timestamp} from './_lib/admin.js'
import {renewalEnd,HttpError} from '../server/policy.js'
export function validSignature(headers,id,secret,now=Date.now()){
 const parts=Object.fromEntries(String(headers['x-signature'] || '').split(',').map(s=>s.trim().split('=')))
 const requestId=String(headers['x-request-id'] || '');const ts=String(parts.ts || '');const timestampMs=ts.length>10?Number(ts):Number(ts)*1000
 if(!parts.v1 || !/^[a-f0-9]{64}$/i.test(parts.v1) || !requestId || !Number.isFinite(timestampMs) || Math.abs(now-timestampMs)>600000)return false
 const expected=createHmac('sha256',secret).update(`id:${String(id).toLowerCase()};request-id:${requestId};ts:${ts};`).digest();const actual=Buffer.from(parts.v1,'hex');return expected.length===actual.length && timingSafeEqual(expected,actual)
}
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end()
 if(!process.env.MERCADOPAGO_WEBHOOK_SECRET || !process.env.MERCADOPAGO_ACCESS_TOKEN)return res.status(503).json({error:'Pagamento não configurado'})
 try{
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;const id=req.query['data.id'] || body?.data?.id
  if(!id || !validSignature(req.headers,id,process.env.MERCADOPAGO_WEBHOOK_SECRET))throw new HttpError(401,'Assinatura inválida')
  const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`}});if(!response.ok)throw new HttpError(502,'Falha ao consultar pagamento');const payment=await response.json()
  if(payment.status!=='approved')return res.status(200).json({received:true})
  const price=Number(process.env.SUBSCRIPTION_PRICE_BRL || 30)
  if(payment.currency_id!=='BRL'||Number(payment.transaction_amount)!==price||payment.external_reference?.includes('/'))throw new HttpError(400,'Pagamento incompatível')
  if(process.env.MERCADOPAGO_COLLECTOR_ID && String(payment.collector_id)!==process.env.MERCADOPAGO_COLLECTOR_ID)throw new HttpError(400,'Recebedor incompatível')
  const db=database(),paymentRef=db.collection('payments').doc(String(payment.id)),userRef=db.collection('users').doc(String(payment.external_reference))
  await db.runTransaction(async tx=>{const [previous,user]=await Promise.all([tx.get(paymentRef),tx.get(userRef)]);if(previous.exists)return;if(!user.exists || user.data().disabled)throw new HttpError(400,'Conta indisponível');tx.set(paymentRef,{uid:payment.external_reference,amount:price,status:'approved',at:timestamp()});tx.update(userRef,{subscription:'ativa',subscriptionEnd:renewalEnd(user.data().subscriptionEnd,30)});tx.set(db.collection('audit').doc(),{actor:'payment-webhook',action:'subscription.payment',details:{paymentId:String(payment.id),uid:payment.external_reference},at:timestamp()})})
  return res.status(200).json({received:true})
 }catch(e){return res.status(e.status || 500).json({error:e.status?e.message:'Falha ao processar pagamento'})}
}
