import { defineStore } from 'pinia'
import { collection, getDocs, doc, getDoc, writeBatch, serverTimestamp, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/firebase'
import { readLocalData, writeLocalData } from '@/services/offline'
import { trackKey } from '@/utils/media'
import { playlistName, playlistIds, mergeHistory, artistKey } from '@/utils/music-library.mjs'
import { useUserStore } from './userStore'
let epoch=0, flushing=false
export const useLibraryStore=defineStore('library',{
 state:()=>({owner:'',playlists:[],following:[],seen:{},history:[],syncHistory:false,pending:[],error:'',loading:false,pickerTracks:[],pickerOpen:false}),
 actions:{
  async init(uid){const run=++epoch;this.owner=uid||'';this.playlists=[];this.following=[];this.seen={};this.history=[];this.pending=[];this.syncHistory=false;this.error='';this.pickerOpen=false;if(!uid)return;this.loading=true
   const local=await readLocalData('library:repertorio-cd75a:'+uid).catch(()=>null);if(run!==epoch)return
   if(local)for(const k of ['playlists','following','seen','history','syncHistory','pending'])if(local[k]!==undefined)this[k]=local[k]
   try{if(navigator.onLine){const [lists,settings]=await Promise.all([getDocs(collection(db,'users',uid,'playlists')),getDoc(doc(db,'users',uid,'musicSettings','main'))]);if(run!==epoch)return
    const remote=lists.docs.map(d=>({...d.data(),id:d.id}));for(const op of this.pending.filter(o=>o.kind==='playlist')){const i=remote.findIndex(p=>p.id===op.id);if(i>=0)remote.splice(i,1);if(op.value)remote.push(op.value)}this.playlists=remote
    if(settings.exists()&&!this.pending.some(o=>o.kind==='settings'))Object.assign(this,settings.data())
    if(this.syncHistory){const h=await getDocs(query(collection(db,'users',uid,'history'),orderBy('lastPlayedAt','desc'),limit(100)));if(run!==epoch)return;for(const d of h.docs)this.history=mergeHistory(this.history,d.data())}
    await this.cache();await this.flush()
   }}catch(e){if(run===epoch)this.error='Sincronização indisponível. As alterações ficam neste aparelho; publique as regras atualizadas do Firebase.'}finally{if(run===epoch)this.loading=false}
  },
  cache(){if(!this.owner)return;return writeLocalData('library:repertorio-cd75a:'+this.owner,{playlists:this.playlists,following:this.following,seen:this.seen,history:this.history,syncHistory:this.syncHistory,pending:this.pending})},
  requireOwner(){if(!this.owner||this.owner!==useUserStore().user?.uid)throw new Error('Entre na sua conta para organizar sua biblioteca.')},
  async queueOperations(ops){this.requireOwner();for(const op of ops){this.pending=this.pending.filter(p=>!(p.kind===op.kind&&p.id===op.id));this.pending.push(op)}const recent=new Set(this.history.map(h=>encodeURIComponent(h.key)));this.pending=this.pending.filter(p=>p.kind!=='history'||!p.value||recent.has(p.id));await this.cache();this.flush()},
  async flush(){if(flushing||!this.owner||!navigator.onLine||!this.pending.length)return;flushing=true;const uid=this.owner,run=epoch,ops=JSON.parse(JSON.stringify(this.pending.slice(0,400)));try{const batch=writeBatch(db);for(const op of ops){const path=op.kind==='playlist'?'playlists':op.kind==='settings'?'musicSettings':'history';const ref=doc(db,'users',uid,path,op.id);if(op.value){const data={...op.value};delete data.id;batch.set(ref,{...data,updatedAt:serverTimestamp()})}else batch.delete(ref)}await batch.commit();if(run!==epoch)return;this.pending=this.pending.filter(p=>!ops.some(o=>JSON.stringify(o)===JSON.stringify(p)));this.error='';await this.cache()}catch(e){if(run===epoch)this.error='Salvo neste aparelho. Aguardando conexão ou permissão do Firebase.'}finally{flushing=false;if(run!==epoch || (!this.error && this.pending.length))this.flush()}},
  async create(name){this.requireOwner();if(this.playlists.length>=100)throw new Error('Você já tem 100 playlists.');const p={id:crypto.randomUUID(),name:playlistName(name),trackIds:[],createdAt:Date.now()};this.playlists.push(p);await this.queueOperations([{kind:'playlist',id:p.id,value:p}]);return p.id},
  async change(id,changes){this.requireOwner();const p=this.playlists.find(p=>p.id===id);if(!p)throw new Error('Playlist não encontrada.');const value={...p,...changes};value.name=playlistName(value.name);value.trackIds=playlistIds(value.trackIds);Object.assign(p,value);await this.queueOperations([{kind:'playlist',id,value}])},
  async remove(id){this.requireOwner();this.playlists=this.playlists.filter(p=>p.id!==id);await this.queueOperations([{kind:'playlist',id,value:null}])},
  async add(id,tracks){const p=this.playlists.find(p=>p.id===id);if(p)await this.change(id,{trackIds:playlistIds([...p.trackIds,...tracks.map(trackKey)])})},
  async saveLists(lists){this.requireOwner();const values=lists.map(p=>({...p,name:playlistName(p.name),trackIds:playlistIds(p.trackIds)}));await this.queueOperations(values.map(p=>({kind:'playlist',id:p.id,value:p})))},
  async move(from,to,key){const a=this.playlists.find(p=>p.id===from),b=this.playlists.find(p=>p.id===to);if(!a||!b||from===to)return;const ids=playlistIds([...b.trackIds,key]);a.trackIds=a.trackIds.filter(k=>k!==key);b.trackIds=ids;await this.saveLists([a,b])},
  openPicker(tracks){this.requireOwner();this.pickerTracks=tracks.filter(t=>trackKey(t));this.pickerOpen=true},
  async settings(){await this.queueOperations([{kind:'settings',id:'main',value:{following:this.following,seen:this.seen,syncHistory:this.syncHistory}}])},
  async follow(name){this.requireOwner();const key=artistKey(name),exists=this.following.some(n=>artistKey(n)===key);if(exists){this.following=this.following.filter(n=>artistKey(n)!==key);delete this.seen[key]}else{if(this.following.length>=100)throw new Error('Você pode seguir até 100 cantores.');this.following.push(name);this.seen[key]=Date.now()}await this.settings()},
  async markSeen(){for(const n of this.following)this.seen[artistKey(n)]=Date.now();await this.settings()},
  record(track,position,duration,completed=false,cloud=false){if(!this.owner||this.owner!==useUserStore().user?.uid||!track)return;const entry={key:trackKey(track),track:JSON.parse(JSON.stringify(track)),positionSeconds:Math.max(0,position||0),durationSeconds:duration||0,completed,lastPlayedAt:Date.now()};this.history=mergeHistory(this.history,entry);this.cache().catch(()=>{});if(cloud&&this.syncHistory)this.queueOperations([{kind:'history',id:encodeURIComponent(entry.key),value:entry}]).catch(()=>{})},
  async clearHistory(){this.requireOwner();const uid=this.owner;const rows=this.history;this.history=[];await this.cache();await this.queueOperations(rows.map(r=>({kind:'history',id:encodeURIComponent(r.key),value:null})));if(navigator.onLine){const snap=await getDocs(collection(db,'users',uid,'history'));if(uid!==this.owner)return;for(let i=0;i<snap.docs.length;i+=400){const b=writeBatch(db);for(const d of snap.docs.slice(i,i+400))b.delete(d.ref);await b.commit()}}},
  async setHistorySync(value){this.syncHistory=!!value;await this.settings();if(value)await this.queueOperations(this.history.map(e=>({kind:'history',id:encodeURIComponent(e.key),value:e})))},
 }
})
