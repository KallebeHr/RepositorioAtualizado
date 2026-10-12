import { foldText } from './folders.mjs'
export const durationOf = t => Number.isFinite(Number(t?.durationSeconds ?? t?.duration)) && Number(t?.durationSeconds ?? t?.duration)>0 ? Number(t.durationSeconds ?? t.duration) : 0
export const bytesOf = t => Number.isFinite(Number(t?.size)) && Number(t.size)>0 ? Number(t.size) : 0
export const timeOf = t => t?.toMillis?.() || (t?.seconds ? t.seconds*1000 : typeof t==='number'?t:Date.parse(t)||0)
export const monthOf = t => { const n=timeOf(t?.createdAt); if(!n)return '';const d=new Date(n);return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).format(d) }
export function folderStats(tracks){return tracks.reduce((a,t)=>{a.count++;const d=durationOf(t),b=bytesOf(t);a.duration+=d;a.bytes+=b;if(!d)a.missingDuration++;if(!b)a.missingSize++;return a},{count:0,duration:0,bytes:0,missingDuration:0,missingSize:0})}
export function formatDuration(n){if(!Number.isFinite(n)||n<=0)return 'Não informada';n=Math.floor(n);return n>=3600?`${Math.floor(n/3600)}h ${Math.floor(n%3600/60)}min`:`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}
export const formatBytes = n => !n?'Não informado':n<1048576?`${Math.ceil(n/1024)} KB`:`${(n/1048576).toFixed(1)} MB`
export function playlistName(value){const n=String(value||'').trim();if(!n||n.length>80)throw new Error('Use um nome de 1 a 80 caracteres.');return n}
export function playlistIds(ids){const result=[...new Set(ids.filter(x=>typeof x==='string'&&x.length>0&&x.length<=1500))];if(result.length>500)throw new Error('Cada playlist aceita até 500 músicas.');return result}
export function resumePosition(position,duration,completed=false){const p=Math.max(0,Number(position)||0);return completed || (duration>0&&p>=duration-2)?0:p}
export function mergeHistory(list,entry){return [entry,...list.filter(x=>x.key!==entry.key)].sort((a,b)=>b.lastPlayedAt-a.lastPlayedAt).slice(0,100)}
export const artistKey = name => foldText(name).trim()
export function isArtistNews(track,following,seen){const key=artistKey(track.cantor||track.artist);return following.some(n=>artistKey(n)===key)&&timeOf(track.createdAt)>(seen[key]||0)}
