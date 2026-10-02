import axios from 'axios'
import {api} from './api'
export async function uploadAudio(file,metadata,onProgress=()=>{}) {
 const buffer=await file.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',buffer);const sha256=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')
 const ticket=await api('upload-sign',{...metadata,fileName:file.name,size:file.size,contentType:file.type || (/\.mp3$/i.test(file.name)?'audio/mpeg':''),sha256})
 await axios.put(ticket.url,file,{headers:ticket.headers,onUploadProgress:event=>onProgress(Math.round((event.loaded/(event.total || file.size))*100))})
 return api('upload-complete',{id:ticket.id})
}
export function audioDuration(file){return new Promise(resolve=>{const audio=new Audio();const url=URL.createObjectURL(file);const done=value=>{audio.removeAttribute('src');audio.load();URL.revokeObjectURL(url);resolve(value)};const timer=setTimeout(()=>done(0),5000);audio.onloadedmetadata=()=>{clearTimeout(timer);done(Number.isFinite(audio.duration)?audio.duration:0)};audio.onerror=()=>{clearTimeout(timer);done(0)};audio.preload='metadata';audio.src=url})}
