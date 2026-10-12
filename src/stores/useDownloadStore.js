import { defineStore } from 'pinia'
import { listDownloadJobs, storeDownloadJob, storeDownloadBlob, readDownloadBlob, deleteDownloadJob, getTrackBlob } from '@/services/offline'
import { saveTrackOffline, downloadBlob } from '@/services/downloads'
import { trackKey, normalizeTrack } from '@/utils/media'
import { archiveFileName } from '@/utils/folders.mjs'
import { useUserStore } from './userStore'
let controller,worker=false,epoch=0,finishedJob,finishJob
const MAX_BYTES=350*1024*1024
export const useDownloadStore=defineStore('downloads',{
 state:()=>({owner:'',jobs:[],error:''}),
 getters:{active:s=>s.jobs.filter(j=>['queued','running'].includes(j.status)),pending:s=>s.jobs.filter(j=>!['done','ready'].includes(j.status))},
 actions:{
  async init(uid){const run=++epoch;controller?.abort();this.owner=uid||'';this.jobs=[];this.error='';if(!uid)return;const jobs=await listDownloadJobs(uid).catch(()=>[]);if(run!==epoch)return;this.jobs=jobs.sort((a,b)=>b.createdAt-a.createdAt);for(const j of this.jobs)if(['running','queued'].includes(j.status)){j.status='paused';j.message='Retome para continuar os arquivos pendentes.';await storeDownloadJob(uid,j)}},
  async enqueue(tracks,mode,label){if(!this.owner||!useUserStore().hasActiveSubscription)throw new Error('Ative sua assinatura para baixar.');if(!['zip','offline'].includes(mode))throw new Error('Ação inválida.');const unique=[...new Map(tracks.filter(t=>t.downloadUrl).map(t=>[trackKey(t),normalizeTrack(t)])).values()];if(!unique.length)throw new Error('Nenhuma música disponível.');if(mode==='zip'&&unique.reduce((a,t)=>a+(Number(t.size)||0),0)>MAX_BYTES)throw new Error('Pasta acima de 350 MB. Salve offline ou baixe músicas individuais.');const job={id:crypto.randomUUID(),mode,label,tracks:unique,createdAt:Date.now(),status:'queued',completedKeys:[],failures:[],bytes:0,progress:0,message:'Aguardando sua vez.',autoDownload:true,filename:label.replace(/[<>:"/\\|?*]/g,' - ').replace(/\s+/g,' ').trim()+'.zip'};this.jobs.unshift(job);try{await storeDownloadJob(this.owner,job)}catch(e){this.jobs=this.jobs.filter(j=>j.id!==job.id);throw e}this.pump().catch(e=>this.error=e.message);return job.id},
  async pause(id){const j=this.jobs.find(j=>j.id===id);if(!j||!['running','queued'].includes(j.status))return;j.status='paused';j.message='Pausado. Os arquivos concluídos foram preservados.';if(controller?.jobId===id)controller.abort();await storeDownloadJob(this.owner,j)},
  async pauseAll(){await Promise.all(this.active.map(j=>this.pause(j.id)))},
  async resume(id){if(!useUserStore().hasActiveSubscription)throw new Error('Ative sua assinatura para retomar.');if(!navigator.onLine)throw new Error('Conecte-se à internet para retomar.');const j=this.jobs.find(j=>j.id===id);if(!j||['running','queued','done','ready'].includes(j.status))return;j.status='queued';j.failures=[];j.progress=Math.round(j.completedKeys.length*100/j.tracks.length);j.message='Aguardando sua vez.';await storeDownloadJob(this.owner,j);this.pump().catch(e=>this.error=e.message)},
  async remove(id){const j=this.jobs.find(j=>j.id===id);if(!j)return;const waiting=controller?.jobId===id?finishedJob:null;await this.pause(id);if(waiting)await waiting;await deleteDownloadJob(this.owner,j);this.jobs=this.jobs.filter(j=>j.id!==id)},
  async download(id){const j=this.jobs.find(j=>j.id===id);if(!j)return;const blob=await readDownloadBlob(this.owner,id,'archive');if(!blob)throw new Error('ZIP indisponível. Retome para montar novamente.');downloadBlob(blob,j.filename)},
  async pump(){if(worker)return;worker=true;const run=epoch,owner=this.owner;try{while(run===epoch){const j=this.jobs.find(j=>j.status==='queued');if(!j)break;if(!navigator.onLine||!useUserStore().hasActiveSubscription){await this.pauseAll();break}j.status='running';controller=new AbortController();controller.jobId=j.id;finishedJob=new Promise(resolve=>{finishJob=resolve});const signal=controller.signal;const checkpoint=()=>storeDownloadJob(owner,j);await checkpoint();
    try{for(const [i,t] of j.tracks.entries()){if(signal.aborted||run!==epoch)break;const key=trackKey(t);if(j.completedKeys.includes(key))continue;j.message=`${j.completedKeys.length} de ${j.tracks.length} músicas · ${t.title}`
     try{if(j.mode==='offline')await saveTrackOffline(owner,t,{signal});else{const blob=await getTrackBlob(owner,t,{signal});if(signal.aborted||run!==epoch)break;if(j.bytes+blob.size>MAX_BYTES)throw Object.assign(new Error('ZIP ultrapassa 350 MB. Salve offline.'),{fatal:true});const estimate=await navigator.storage?.estimate?.();if(estimate?.quota&&blob.size>estimate.quota-(estimate.usage||0))throw Object.assign(new Error('Espaço insuficiente no aparelho.'),{fatal:true});await storeDownloadBlob(owner,j.id,key,blob);j.bytes+=blob.size}if(signal.aborted||run!==epoch)break;j.completedKeys.push(key)
     }catch(e){if(signal.aborted||e.name==='AbortError')break;if(e.fatal)throw e;j.failures.push({id:key,title:t.title,error:e.message})}
     j.progress=Math.round((j.completedKeys.length+j.failures.length)*100/j.tracks.length);await checkpoint()
    }
    if(signal.aborted||run!==epoch){j.status='paused';j.message='Pausado. Retome os arquivos pendentes.';await checkpoint();continue}
    if(j.mode==='zip'&&j.completedKeys.length){j.message='Montando ZIP…';const zip=new(await import('jszip')).default();for(const [i,t] of j.tracks.entries()){if(j.completedKeys.includes(trackKey(t))){const b=await readDownloadBlob(owner,j.id,trackKey(t));if(!b)throw new Error('Arquivo temporário ausente. Remova esta tarefa e inicie novamente.');zip.file(archiveFileName(t,i),b)}}if(j.failures.length)zip.file('LEIA-ME-PENDENCIAS.txt',j.failures.map(f=>f.title+': '+f.error).join('\n'));const blob=await zip.generateAsync({type:'blob',compression:'STORE'});if(signal.aborted||run!==epoch){j.status='paused';await checkpoint();continue}await storeDownloadBlob(owner,j.id,'archive',blob);if(j.autoDownload&&!j.failures.length)downloadBlob(blob,j.filename)}
    j.status=j.failures.length?'partial':j.mode==='zip'?'ready':'done';j.progress=100;j.message=`${j.completedKeys.length} músicas ${j.mode==='zip'?'no ZIP':'salvas offline'}. ${j.failures.length} pendências.`;await checkpoint()
    }catch(e){j.status='error';j.message=e.message;await checkpoint()}finally{controller=null;finishJob?.();finishJob=null}
   }}finally{worker=false;if(run!==epoch)this.pump().catch(e=>this.error=e.message)}
  }
 }
})
