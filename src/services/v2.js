import { auth } from '@/firebase'
import { readLocalData,writeLocalData } from './offline.js'
const base=import.meta.env.VITE_V2_API_URL || '/api/v2'
export const v2UploadBase=(import.meta.env.VITE_V2_UPLOAD_API_URL || 'http://localhost:3004').replace(/\/$/,'')
export async function v2Request(action,{method='GET',body,local=false,publicRequest=false,query={}}={}) {
 const endpoint=local?v2UploadBase+'/api/v2':base
 const headers={}
 if(!publicRequest){if(!auth.currentUser)throw new Error('Entre na sua conta.');headers.Authorization='Bearer '+await auth.currentUser.getIdToken()}
 if(body)headers['Content-Type']='application/json'
 let response
 try{response=await fetch(endpoint+(endpoint.includes('?')?'&':'?')+'action='+encodeURIComponent(action)+Object.entries(query).map(([k,v])=>'&'+encodeURIComponent(k)+'='+encodeURIComponent(v)).join(''),{method,headers,signal:AbortSignal.timeout(15000),body:body?JSON.stringify(body):undefined})}catch{throw new Error(local?'Servidor local V2 indisponível. Inicie npm run api:v2 no computador do administrador.':'Serviço V2 indisponível. Confira a conexão e a publicação da API.')}
 let data;try{data=await response.json()}catch{throw new Error('A API V2 não está publicada ou configurada neste endereço.')}
 if(!response.ok)throw new Error(data.error || 'Não foi possível concluir a operação.')
 return data
}
export async function loadV2Catalog(cursor=null) {
 if(!navigator.onLine){const cached=await readLocalData('catalog-v2');return {tracks:cached || [],nextCursor:null,offline:true}}
 // Cursor é anexado separadamente ao endpoint para manter cache HTTP por página.
 const endpoint=base+(base.includes('?')?'&':'?')+'action=catalog'+(cursor?'&cursor='+encodeURIComponent(cursor):'')
 const response=await fetch(endpoint);let data;try{data=await response.json()}catch{throw new Error('Catálogo V2 indisponível. Confira a API publicada.')}
 if(!response.ok)throw new Error(data.error || 'Falha ao carregar músicas V2.')
 const current=cursor?(await readLocalData('catalog-v2') || []):[]
 await writeLocalData('catalog-v2',[...new Map([...current,...data.tracks].map(t=>[t.id,t])).values()]).catch(()=>{})
 return data
}
