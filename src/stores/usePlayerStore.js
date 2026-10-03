import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { Howl } from 'howler'
import { api } from '@/services/api'
import { nextTrack, genres } from '@/utils/catalog'
import { useUserStore } from './userStore'
let sleepTimer = null
let sourceNodes = new WeakMap()
export const usePlayerStore = defineStore('player', {
 state:()=>({queue:[],currentIndex:-1,sound:null,isPlaying:false,volume:1,fullList:[],recent:[],genreHistory:{},error:'',loading:false,sleepAt:null,autoContinue:true,eq:{enabled:false,ready:false,bands:[{key:'60',freq:60,gain:0},{key:'170',freq:170,gain:0},{key:'350',freq:350,gain:0},{key:'1k',freq:1000,gain:0},{key:'3.5k',freq:3500,gain:0},{key:'10k',freq:10000,gain:0}]}}),
 getters:{current:s=>s.queue[s.currentIndex] || null,howlerAudioEl:s=>s.sound?._sounds?.[0]?._node || null},
 actions:{
  setFullList(list) {const tracks=new Map(this.fullList.map(t=>[t.id,t]));for(const track of list || [])tracks.set(track.id,track);this.fullList=[...tracks.values()]},
  addToQueue(track,{playNow=false}={}) {if(!track?.id || !(track.downloadUrl || track.storageKey))return;this.queue.push(track);if(this.currentIndex===-1 || playNow)this.play(this.queue.length-1)},
  async play(index=this.currentIndex) {
   if(index<0 || index>=this.queue.length)return
   if(!useUserStore().hasActiveSubscription){this.stop();this.error='Assinatura ativa necessária para ouvir.';return}
   const generation=(this._generation || 0)+1;this._generation=generation
   this.sound?.unload();this.sound=null;this.isPlaying=false;this.loading=true;this.error='';this.currentIndex=index
   try {
    const {url}=await api('media',{id:this.current.id,purpose:'stream'})
    if(generation!==this._generation)return
    const sound=markRaw(new Howl({src:[url],format:[this.current.fileName?.split('.').pop() || 'mp3'],html5:true,volume:this.volume,preload:true,
     onplay:()=>{if(generation!==this._generation)return;this.isPlaying=true;this.loading=false;this._session();if(this.eq.enabled)this.eqInitOrReconnect().catch(()=>{});if(this.sleepAt && Date.now()>=this.sleepAt)this.stop()},
     onpause:()=>{this.isPlaying=false;this._playbackState()},onstop:()=>{this.isPlaying=false;this._playbackState()},
     onend:()=>{if(generation===this._generation)this.next()},
     onloaderror:()=>{if(generation===this._generation){this.loading=false;this.isPlaying=false;this.error='Arquivo indisponível. Escolha outra música.'}},
     onplayerror:()=>{if(generation===this._generation){this.loading=false;this.isPlaying=false;this.error='Toque em reproduzir para autorizar o áudio.';sound.once('unlock',()=>{if(generation===this._generation)sound.play()})}}
    }));this.sound=sound;sound.play()
    this.recent=[...this.recent.filter(id=>id!==this.current.id),this.current.id].slice(-100)
    for(const genre of genres(this.current))this.genreHistory[genre]=(this.genreHistory[genre] || 0)+1
    try{localStorage.setItem('repertorio:genres',JSON.stringify(this.genreHistory))}catch{}
   }catch(e){if(generation===this._generation){this.loading=false;this.isPlaying=false;this.error=e.message}}
  },
  togglePlay(){if(!this.sound)return this.play(this.currentIndex<0?0:this.currentIndex);if(this.isPlaying)this.sound.pause();else this.sound.play()},
  next(){if(this.sleepAt && Date.now()>=this.sleepAt)return this.stop();if(this.currentIndex<this.queue.length-1)return this.play(this.currentIndex+1);if(this.autoContinue){const next=nextTrack(this.current,this.fullList,this.recent);if(next)return this.addToQueue(next,{playNow:true})}this.isPlaying=false;this.sound?.pause();this._playbackState()},
  prev(){if(this.sound && Number(this.sound.seek())>3)this.seekTo(0);else if(this.currentIndex>0)this.play(this.currentIndex-1);else this.seekTo(0)},
  seekTo(seconds){if(this.sound)this.sound.seek(Math.min(this.sound.duration() || 0,Math.max(0,Number(seconds))))},
  setVolume(v){this.volume=Math.min(1,Math.max(0,Number(v)));this.sound?.volume(this.volume)},
  stop(){this._generation=(this._generation || 0)+1;this.sound?.unload();this.sound=null;this.isPlaying=false;this.loading=false;this.currentIndex=-1;this._playbackState()},
  removeFromQueue(index){const current=index===this.currentIndex;this.queue.splice(index,1);if(!this.queue.length)return this.stop();if(current)this.play(Math.min(index,this.queue.length-1));else if(index<this.currentIndex)this.currentIndex--},
  clearQueue(){this.stop();this.queue=[]},
  setSleep(minutes){clearTimeout(sleepTimer);this.sleepAt=minutes>0?Date.now()+minutes*60000:null;if(this.sleepAt)sleepTimer=setTimeout(()=>{this.stop();this.sleepAt=null},minutes*60000)},
  _playbackState(){if('mediaSession' in navigator)navigator.mediaSession.playbackState=this.isPlaying?'playing':'paused'},
  _session(){if(!('mediaSession' in navigator))return;const track=this.current;if(window.MediaMetadata)navigator.mediaSession.metadata=new MediaMetadata({title:track.title,artist:track.cantor,album:'Repertório Atualizado',artwork:[{src:new URL('/Logo.png',location.origin).href,sizes:'512x512',type:'image/png'}]});const handlers={play:()=>{if(!this.isPlaying)this.togglePlay()},pause:()=>this.sound?.pause(),previoustrack:()=>this.prev(),nexttrack:()=>this.next(),seekto:e=>this.seekTo(e.seekTime),seekbackward:e=>this.seekTo(Number(this.sound?.seek() || 0)-(e.seekOffset || 10)),seekforward:e=>this.seekTo(Number(this.sound?.seek() || 0)+(e.seekOffset || 10)),stop:()=>this.stop()};for(const [name,handler] of Object.entries(handlers))try{navigator.mediaSession.setActionHandler(name,handler)}catch{}this._playbackState()},
  async eqInitOrReconnect(){const el=this.howlerAudioEl;if(!el || !this.eq.enabled)return false;if(!this._eqCtx){const Context=window.AudioContext || window.webkitAudioContext;if(!Context)return false;this._eqCtx=markRaw(new Context())}await this._eqCtx.resume();if(this._eqMediaEl===el)return true;this._eqSource?.disconnect();this._eqFilters?.forEach(f=>f.disconnect());try{el.crossOrigin='anonymous';let source=sourceNodes.get(el);if(!source){source=markRaw(this._eqCtx.createMediaElementSource(el));sourceNodes.set(el,source)}this._eqSource=source;this._eqMediaEl=el;this._eqFilters=this.eq.bands.map(b=>{const f=markRaw(this._eqCtx.createBiquadFilter());f.type='peaking';f.frequency.value=b.freq;f.Q.value=1;f.gain.value=b.gain;return f});let previous=source;for(const f of this._eqFilters){previous.connect(f);previous=f}previous.connect(this._eqCtx.destination);this.eq.ready=true;return true}catch{this.error='Equalizador indisponível neste dispositivo ou arquivo.';return false}},
  async eqSetEnabled(v){this.eq.enabled=!!v;if(v){if(this._eqSource && this._eqFilters?.length){this._eqSource.disconnect();this._eqSource.connect(this._eqFilters[0])}await this.eqInitOrReconnect()}else if(this._eqSource){this._eqSource.disconnect();this._eqSource.connect(this._eqCtx.destination)}},
  eqSetBandGain(key,value){const i=this.eq.bands.findIndex(b=>b.key===key);if(i<0)return;this.eq.bands[i].gain=Math.min(12,Math.max(-12,Number(value)));if(this._eqFilters?.[i])this._eqFilters[i].gain.value=this.eq.bands[i].gain},
  eqReset(){this.eq.bands.forEach(b=>this.eqSetBandGain(b.key,0))}
 }
})
