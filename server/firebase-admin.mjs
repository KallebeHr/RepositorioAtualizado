import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
export function adminServices() {
 let app=getApps().find(a=>a.name==='repertorio-v2')
 if (!app) {
  const account = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) : process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH,'utf8')) : null
  const projectId=process.env.FIREBASE_PROJECT_ID || 'repertorio-d3552'
  if(account && account.project_id !== projectId)throw new Error('A conta de serviço pertence a outro projeto Firebase.')
  app=initializeApp({projectId,credential:account ? cert(account) : applicationDefault()},'repertorio-v2')
 }
 return {db:getFirestore(app),auth:getAuth(app)}
}
