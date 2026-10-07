import { getTrackBlob, saveOffline } from './offline.js'
export function downloadBlob(blob, filename) {
 const url=URL.createObjectURL(blob), anchor=document.createElement('a')
 anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)
}
export async function downloadTrack(owner, track) { downloadBlob(await getTrackBlob(owner,track), track.fileName || `${track.title || 'musica'}.mp3`) }
export async function saveTrackOffline(owner, track) { const record=await saveOffline(owner,track); navigator.storage?.persist?.().catch(()=>{}); return record }
export const favoriteId=track=>track.collectionName==='musicasV2'||track.storageProvider==='r2'?'v2:'+track.id:track.id
