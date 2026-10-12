<template>
  <main class="explorer-page">
    <header class="topbar">
      <nav class="breadcrumb" aria-label="Caminho da pasta">
        <button class="crumb root" @click="goRoot"><i class="mdi mdi-music-box-multiple"/><span>Biblioteca</span></button>
        <template v-if="currentCategory"><span class="sep">›</span><button class="crumb" @click="goCategory">{{ currentCategory }}</button></template>
        <template v-if="currentArtist"><span class="sep">›</span><span class="crumb active">{{ currentArtist }}</span></template>
      </nav>
      <button class="btn-search" @click="isOpen=true" aria-label="Buscar"><i class="mdi mdi-magnify"/><span>Buscar</span></button>
    </header>
    <section class="folder-intro">
      <span class="eyebrow">SEU REPERTÓRIO ORGANIZADO</span>
      <h1>{{ currentArtist || currentCategory || 'Suas pastas de músicas' }}</h1>
      <p>Escolha um estilo e um cantor. Ouça a pasta, baixe um ZIP ou guarde as músicas para ouvir sem internet.</p>
      <div class="folder-options">
        <label><input v-model="offlineOnly" type="checkbox"/> Somente salvas no aparelho</label>
        <label><input :checked="player.continuousPlayback" type="checkbox" @change="player.setContinuousPlayback($event.target.checked)"/> Continuar pela pasta ao terminar a fila</label>
        <button class="refresh-button" @click="load(true)" :disabled="loading || busy">Atualizar biblioteca</button>
      </div>
      <p v-if="!online" class="connection-note" role="status">Sem internet: mostrando as músicas salvas neste aparelho.</p>
    </section>
    <p v-if="error" class="folder-error" role="alert">{{ error }}</p>
    <section v-if="currentCategory || currentArtist" class="folder-toolbar" aria-label="Ações da pasta">
      <div><strong>{{ folderTracks.length }} músicas nesta pasta</strong><small>{{ currentArtist ? [currentCategory,currentArtist].filter(Boolean).join(' / ') : 'Todos os cantores de '+currentCategory }}</small></div>
      <FolderSummary :tracks="folderTracks"/>
      <div class="folder-buttons">
        <button class="primary" @click="playFolder(folderTracks,selectedFolder)" :disabled="!folderTracks.length" aria-label="Ouvir pasta"><i class="mdi mdi-play-circle"/>Ouvir pasta</button>
        <button @click="queueFolder(folderTracks)" :disabled="!folderTracks.length" aria-label="Adicionar pasta à fila"><i class="mdi mdi-playlist-plus"/>Adicionar pasta à fila</button>
        <button @click="playlist(folderTracks)" :disabled="!folderTracks.length"><i class="mdi mdi-playlist-music"/>Adicionar pasta à playlist</button>
        <button @click="runBatch(folderTracks,'zip',selectedFolder)" :disabled="!folderTracks.length" aria-label="Baixar pasta (.zip)"><i class="mdi mdi-folder-download"/>Baixar pasta (.zip)</button>
        <button @click="runBatch(folderTracks,'offline',selectedFolder)" :disabled="!folderTracks.length" aria-label="Salvar pasta offline"><i class="mdi mdi-cloud-download-outline"/>Salvar pasta offline</button>
      </div>
      <p class="folder-help">Ao fim da fila, a reprodução segue pela pasta da última música. Desative a opção acima para parar no fim.</p>
    </section>
    <section v-if="busy || batchMessage" class="batch-status" aria-label="Progresso da pasta" aria-live="polite">
      <div><strong>{{ batchLabel }}</strong><span>{{ batchMessage }}</span></div>
      <progress v-if="busy" :value="batchProgress" max="100" :aria-label="'Progresso '+batchLabel"/>
      <button v-if="busy" @click="cancelBatch">Pausar</button>
      <p v-if="batchFailures.length">{{ batchFailures.length }} pendências. Tente novamente: as músicas já salvas offline serão reaproveitadas.</p>
      <details v-if="batchFailures.length"><summary>Ver músicas pendentes</summary><ul><li v-for="item in batchFailures" :key="item.id">{{ item.title }} — {{ item.error }}</li></ul></details>
    </section>
    <div v-if="loading" class="loading-state" role="status"><div class="spinner"/><p>Carregando biblioteca…</p></div>
    <div v-else-if="!currentCategory && !currentArtist" class="grid-view">
      <div class="section-label"><i class="mdi mdi-folder-multiple"/>Estilos musicais — {{ categories.length }} pastas</div>
      <div class="folders-grid">
        <article v-for="cat in categories" :key="cat.name" class="folder-card">
          <button class="folder-open" @click="openCategory(cat.name)" :aria-label="'Abrir pasta '+cat.name">
            <div class="folder-icon"><i class="mdi mdi-folder"/><span class="folder-badge">{{ cat.artistCount }}</span></div>
            <div class="folder-info"><p class="folder-name">{{ cat.name }}</p><p class="folder-meta">{{ cat.songCount }} músicas · {{ cat.artistCount }} cantores</p></div>
          </button>
          <FolderSummary :tracks="cat.tracks"/>
          <div class="folder-card-actions"><button @click="playFolder(cat.tracks,{genre:cat.name,artist:null})" :aria-label="'Ouvir pasta '+cat.name"><i class="mdi mdi-play"/>Ouvir</button><button @click="runBatch(cat.tracks,'zip',{genre:cat.name,artist:null})" :aria-label="'Baixar pasta '+cat.name"><i class="mdi mdi-download"/>ZIP</button></div>
        </article>
      </div>
      <p v-if="!categories.length" class="empty-hint">{{ offlineOnly || !online ? 'Nenhuma música salva. Conecte-se à internet e use Salvar pasta offline.' : 'Nenhuma música cadastrada no catálogo. Use o envio R2 na administração.' }}</p>
    </div>
    <div v-else-if="!currentArtist" class="grid-view">
      <div class="section-label"><i class="mdi mdi-account-group"/>{{ currentCategory }} — {{ artists.length }} artistas</div>
      <div class="folders-grid">
        <article v-for="art in artists" :key="art.name" class="folder-card artist-folder">
          <button class="folder-open" @click="openArtist(art.name)" :aria-label="'Abrir pasta '+art.name">
            <div class="folder-icon artist-icon"><img v-if="art.coverUrl" :src="art.coverUrl" class="artist-thumb" alt=""/><i v-else class="mdi mdi-account-music"/><span class="folder-badge">{{ art.songCount }}</span></div>
            <div class="folder-info"><p class="folder-name">{{ art.name }}</p><p class="folder-meta">{{ art.songCount }} músicas</p></div>
          </button>
          <FolderSummary :tracks="art.tracks"/>
          <div class="folder-card-actions"><button @click="playFolder(art.tracks,{genre:currentCategory,artist:art.name})" :aria-label="'Ouvir pasta '+art.name"><i class="mdi mdi-play"/>Ouvir</button><button @click="runBatch(art.tracks,'zip',{genre:currentCategory,artist:art.name})" :aria-label="'Baixar pasta '+art.name"><i class="mdi mdi-download"/>ZIP</button></div>
        </article>
      </div>
      <p v-if="!artists.length" class="empty-hint">Esta pasta não possui músicas com o filtro atual.</p>
    </div>
    <div v-else class="list-view">
      <div class="section-label"><i class="mdi mdi-music-note"/>{{ songs.length }} músicas
        <select v-model="sortBy" aria-label="Ordenar músicas da pasta"><option value="title">Nome da música</option><option value="newest">Mais recentes</option></select>
      </div>
      <div class="songs-list">
        <article v-for="(m,idx) in songs" :key="trackKey(m)" class="song-row" :class="{ 'song-playing':trackKey(player.current)===trackKey(m) }">
          <span class="song-idx">{{ idx+1 }}</span><img :src="m.coverUrl || '/LogoMusic.jpg'" class="song-cover" alt=""/>
          <div class="song-info"><div class="song-title-wrap"><p class="song-title">{{ m.title }}</p></div><p class="song-artist">{{ m.cantor }} <span v-if="savedKeys.has(trackKey(m))" class="saved-badge">Salva offline</span></p></div>
          <div class="song-tipo hide-on-mobile"><span v-for="t in genresOf(m)" :key="t" class="tag">{{ t }}</span></div>
          <div class="song-actions">
            <button class="action-btn play-btn" @click="play(m)" title="Tocar" :aria-label="'Ouvir '+m.title"><i class="mdi mdi-play"/></button>
            <button class="action-btn" @click="addQueue(m)" title="Adicionar à fila" :aria-label="'Adicionar '+m.title+' à fila'"><i class="mdi mdi-playlist-plus"/></button>
            <button class="action-btn offline-action" @click="saveLocal(m)" title="Salvar offline" :aria-label="'Salvar offline '+m.title"><i class="mdi mdi-cloud-download-outline"/><span>Salvar offline</span></button>
            <button class="action-btn" @click="playlist([m])" :aria-label="'Adicionar '+m.title+' à playlist'"><i class="mdi mdi-playlist-music"/></button>
            <button class="action-btn" @click="download(m)" title="Baixar" :aria-label="'Baixar '+m.title"><i class="mdi mdi-download"/></button>
          </div>
        </article>
      </div>
      <p v-if="!songs.length" class="empty-hint">Nenhuma música nesta pasta com o filtro atual.</p>
    </div>
    <v-dialog v-model="isOpen" max-width="720" scrollable class="folder-search-dialog">
      <section class="folder-search-panel"><header><h2>Buscar na biblioteca</h2><button @click="isOpen=false" aria-label="Fechar busca"><i class="mdi mdi-close"/></button></header>
        <input v-model="queryText" type="search" autofocus placeholder="Estilo, cantor ou título…" aria-label="Pesquisar na biblioteca"/>
        <p v-if="!queryText" class="empty-hint">Pesquise com ou sem acentos. A busca percorre todas as pastas disponíveis.</p>
        <p v-else-if="!searchResults.length" class="empty-hint">Nenhuma música encontrada.</p>
        <div class="results"><article v-for="m in searchResults.slice(0,100)" :key="trackKey(m)" class="search-result"><div><strong>{{ m.title }}</strong><p>{{ artistOf(m) }} · {{ genresOf(m).join(', ') }}</p></div><button @click="play(m,true)" :aria-label="'Ouvir '+m.title"><i class="mdi mdi-play"/></button><button @click="openTrackFolder(m)" :aria-label="'Abrir pasta de '+m.title"><i class="mdi mdi-folder-open"/></button></article></div>
        <p v-if="searchResults.length>100">Mostrando 100 de {{ searchResults.length }} resultados. Refine a busca.</p>
      </section>
    </v-dialog>
  </main>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useUserStore } from '@/stores/userStore'
import { useToast } from 'vue-toast-notification'
import { downloadTrack, downloadBlob, saveTrackOffline } from '@/services/downloads'
import { listOffline, getTrackBlob, OFFLINE_EVENT } from '@/services/offline'
import { getCatalog } from '@/services/catalog'
import FolderSummary from '@/components/FolderSummary.vue'
import { useDownloadStore } from '@/stores/useDownloadStore'
import { useLibraryStore } from '@/stores/useLibraryStore'
import { createMusicSearch } from '@/services/music-search.mjs'
import { normalizeTrack, trackKey } from '@/utils/media'
import { genresOf, artistOf, matchesFolder, folderOf, folderLabel, foldText } from '@/utils/folders.mjs'
const player=usePlayerStore(),user=useUserStore(),toast=useToast(),route=useRoute(),router=useRouter()
const downloads=useDownloadStore(),library=useLibraryStore(),lastJobId=ref('')
const loading=ref(true),error=ref(''),allMusicas=ref([]),offlineRecords=ref([]),online=ref(navigator.onLine),offlineOnly=ref(false)
const currentCategory=ref(typeof route.query.estilo==='string'?route.query.estilo:null),currentArtist=ref(typeof route.query.cantor==='string'?route.query.cantor:null)
const isOpen=ref(false),queryText=ref(''),sortBy=ref('title')
let loadRun=0
const job=computed(()=>downloads.jobs.find(j=>j.id===lastJobId.value)),busy=computed(()=>!!job.value&&['running','queued'].includes(job.value.status)),batchProgress=computed(()=>job.value?.progress||0),batchLabel=computed(()=>job.value?.label||''),batchMessage=computed(()=>job.value?.message||''),batchFailures=computed(()=>job.value?.failures||[])
const savedKeys=computed(()=>new Set(offlineRecords.value.map(record=>trackKey(record.track))))
const available=computed(()=>offlineOnly.value || !online.value ? offlineRecords.value.map(record=>normalizeTrack(record.track)) : allMusicas.value)
const selectedFolder=computed(()=>({genre:currentCategory.value,artist:currentArtist.value}))
const folderTracks=computed(()=>available.value.filter(track=>matchesFolder(track,selectedFolder.value)))
const categories=computed(()=>{
 const map=new Map()
 for(const track of available.value)for(const genre of genresOf(track).length?genresOf(track):['Sem estilo']){
  if(!map.has(genre))map.set(genre,{name:genre,tracks:[],artists:new Set()})
  const item=map.get(genre);item.tracks.push(track);item.artists.add(artistOf(track))
 }
 return [...map.values()].map(item=>({...item,songCount:item.tracks.length,artistCount:item.artists.size})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))
})
const artists=computed(()=>{
 const map=new Map()
 for(const track of available.value.filter(track=>matchesFolder(track,{genre:currentCategory.value}))){const name=artistOf(track);if(!map.has(name))map.set(name,{name,tracks:[],coverUrl:track.coverUrl});map.get(name).tracks.push(track)}
 return [...map.values()].map(item=>({...item,songCount:item.tracks.length})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))
})
const songs=computed(()=>[...folderTracks.value].sort((a,b)=>sortBy.value==='newest' ? (b.createdAt?.seconds || 0)-(a.createdAt?.seconds || 0) : String(a.title || '').localeCompare(String(b.title || ''),'pt-BR',{numeric:true,sensitivity:'base'})))
const searchIndex=computed(()=>createMusicSearch(available.value))
const searchResults=computed(()=>searchIndex.value({text:queryText.value}))
async function refreshOffline(){const uid=user.user?.uid,records=await listOffline(uid).catch(()=>[]);if(uid===user.user?.uid)offlineRecords.value=records}
async function load(refresh=false){const run=++loadRun;loading.value=true;error.value='';await refreshOffline();try{if(navigator.onLine){const tracks=await getCatalog({refresh});if(run===loadRun)allMusicas.value=tracks}}catch(e){if(run===loadRun)error.value='Não foi possível carregar o catálogo. Confira a conexão e as regras do Firebase.'}finally{if(run===loadRun)loading.value=false}}
function navigate(genre,artist){currentCategory.value=genre;currentArtist.value=artist;const query={...route.query};if(genre)query.estilo=genre;else delete query.estilo;if(artist)query.cantor=artist;else delete query.cantor;router.replace({query}).catch(()=>{})}
const goRoot=()=>navigate(null,null),goCategory=()=>navigate(currentCategory.value,null),openCategory=name=>navigate(name,null),openArtist=name=>navigate(currentCategory.value,name)
function openTrackFolder(track){const folder=folderOf(track);navigate(folder.genre,folder.artist);isOpen.value=false}
function permitted(){if(!user.hasActiveSubscription){toast.warning('Ative sua assinatura para ouvir, baixar e salvar músicas.');return false}return true}
function playFolder(tracks,folder){if(!permitted() || !tracks.length)return;player.replaceQueue(tracks,{folder});toast.success('Pasta em reprodução. Você pode navegar enquanto ouve.')}
function queueFolder(tracks){if(!permitted())return;const added=player.addFolderToQueue(tracks);toast.success(`${added} músicas adicionadas à fila.`)}
function play(track,fromSearch=false){if(!permitted())return;if(fromSearch)player.playbackFolder=folderOf(track);else player.playbackFolder=selectedFolder.value;player.addToQueue(track,{playNow:true});updateDoc(doc(db,'musicasV2',track.id),{playCount:increment(1)}).catch(()=>{});isOpen.value=false}
function addQueue(track){if(permitted()){player.addToQueue(track);toast.success('Adicionada à fila.')}}
async function download(track){if(!permitted())return;try{await downloadTrack(user.user.uid,track);if(navigator.onLine)updateDoc(doc(db,'musicasV2',track.id),{downloadCount:increment(1)}).catch(()=>{})}catch(e){toast.error(e.message)}}
async function saveLocal(track){if(!permitted())return;try{await saveTrackOffline(user.user.uid,track);toast.success('Música salva neste aparelho.')}catch(e){toast.error(e.message)}}
function playlist(tracks){try{library.openPicker(tracks)}catch(e){toast.error(e.message)}}
function cancelBatch(){downloads.pause(lastJobId.value)}
async function runBatch(tracks,mode,folder){if(!permitted()||!tracks.length)return;try{lastJobId.value=await downloads.enqueue(tracks,mode,folderLabel(folder));toast.success('Pasta adicionada à central de downloads. Você pode navegar.')}catch(e){toast.error(e.message)}}
function networkChange(){online.value=navigator.onLine;if(online.value)load();else refreshOffline()}
watch(()=>user.user?.uid,()=>{lastJobId.value='';refreshOffline()})
watch(()=>[route.query.estilo,route.query.cantor],([genre,artist])=>{currentCategory.value=typeof genre==='string'?genre:null;currentArtist.value=typeof artist==='string'?artist:null})
onMounted(()=>{load();window.addEventListener(OFFLINE_EVENT,refreshOffline);window.addEventListener('online',networkChange);window.addEventListener('offline',networkChange)})
onBeforeUnmount(()=>{loadRun++;window.removeEventListener(OFFLINE_EVENT,refreshOffline);window.removeEventListener('online',networkChange);window.removeEventListener('offline',networkChange)})
</script>
<style scoped>

.explorer-page {
  --bg: #0f0f13;
  --surface: #1a1a22;
  --surface2: #22222e;
  --border: #2e2e3e;
  --accent: #00d1b2;
  --accent2: #00d1b2; 
  --text: #e8e8f0;
  --muted: #7070a0;
  --folder: #f59e0b;
  --folder-artist: #00d1b2;
  --danger: #ef4444;

  min-height: 100vh;
  width: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: "Segoe UI", system-ui, sans-serif;
  overflow-x: hidden;
}

/* ── TOPBAR ── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 14px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}

.breadcrumb::-webkit-scrollbar {
  display: none;
}

.crumb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  font-size: 14px;
}

.crumb:hover {
  background: var(--surface2);
  color: var(--text);
}

.crumb.root {
  color: var(--accent2);
}

.crumb.active {
  color: var(--text);
  font-weight: 600;
  cursor: default;
  pointer-events: none;
}

.sep {
  color: var(--border);
  font-size: 14px;
  flex-shrink: 0;
}

.btn-search {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.btn-search:hover {
  opacity: 0.85;
}

/* ── LOADING ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 20px;
  color: var(--muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
/* ======================
   FLOATING EQ BUTTON
====================== */
.eq-fab {
  position: fixed;
  right: 18px;
  bottom: 10rem;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 15, 15, 0.78);
  backdrop-filter: blur(10px);
  color: #fff;
  display: grid;
  place-items: center;
  z-index: 9998;
  cursor: pointer;
  box-shadow: 0 18px 50px rgba(0,0,0,0.45);
  transition: transform 0.18s ease, background 0.18s ease, border 0.18s ease;
}
.eq-fab .mdi { font-size: 26px; }
.eq-fab:hover { transform: translateY(-2px); }
.eq-fab.on {
  border-color: rgba(0, 207, 208, 0.55);
  background: rgba(0, 207, 208, 0.16);
}

/* ======================
        EQ MODAL (FODÃO)
====================== */
.eq-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(1200px 600px at 50% 10%, rgba(0,207,208,0.12), transparent 55%),
              rgba(0,0,0,0.72);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 9999;
}

.eq-panel {
  width: min(1040px, 100%);
  max-height: calc(100vh - 24px);
  background: rgba(10,10,12,0.92);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 26px;
  overflow: hidden;
  outline: none;
  box-shadow: 0 40px 120px rgba(0,0,0,0.65);
  backdrop-filter: blur(10px);
}

/* header fixo + corpo scroll */
.eq-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: radial-gradient(900px 260px at 12% -40%, rgba(0,207,208,0.22), transparent 60%),
              rgba(10,10,12,0.96);
}

.eq-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.eq-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  font-weight: 950;
  letter-spacing: 0.10em;
  font-size: 11px;
}
.eq-badge .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6b7280;
  box-shadow: 0 0 0 7px rgba(255,255,255,0.03);
}
.eq-badge.on .dot {
  background: #00cfd0;
  box-shadow: 0 0 0 7px rgba(0,207,208,0.18);
}

.eq-close {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.15s ease, background 0.15s ease;
}
.eq-close:hover { transform: translateY(-1px); background: rgba(255,255,255,0.09); }
.eq-close .mdi { font-size: 20px; }

.eq-sub {
  margin: 10px 0 0;
  color: rgba(255,255,255,0.72);
  font-weight: 650;
  line-height: 1.5;
  font-size: 13px;
}

/* SCROLL */
.eq-scroll {
  max-height: calc(100vh - 160px);
  overflow: auto;
  padding: 16px 16px 0;
}
.eq-scroll::-webkit-scrollbar { width: 10px; }
.eq-scroll::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border-radius: 999px;
}
.eq-scroll::-webkit-scrollbar-track { background: transparent; }

.eq-footer-space { height: 18px; }

/* HERO layout */
.eq-hero{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items: start;
}

@media (max-width: 900px){
  .eq-hero{ grid-template-columns: 1fr; }
}

/* ======================
   VISUALIZER CIRCULAR
====================== */
.am-card{
  padding: 14px;
  border-radius: 20px;
  background:
    radial-gradient(900px 300px at 20% -60%, rgba(0,207,208,0.22), transparent 60%),
    rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
}

.am-ring{
  position: relative;
  width: min(360px, 100%);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 999px;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.07), rgba(0,0,0,0.60));
  box-shadow:
    0 30px 90px rgba(0,0,0,0.60),
    inset 0 0 0 2px rgba(255,255,255,0.10),
    inset 0 0 60px rgba(0,207,208,0.10);
}

.am-canvas{ width: 100%; height: 100%; }
.am-canvas canvas{
  width: 100% !important;
  height: 100% !important;
  display:block;
}

.am-center{
  position:absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  width: 44%;
  height: 44%;
  border-radius: 999px;
  display:grid;
  place-items:center;
  text-align:center;
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.18), rgba(0,0,0,0.86));
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: inset 0 0 28px rgba(0,0,0,0.62);
  pointer-events:none;
}

.am-center-dot{
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: rgba(107,114,128,0.9);
  box-shadow: 0 0 0 12px rgba(255,255,255,0.05);
  margin-bottom: 6px;
}
.am-center-dot.on{
  background: rgba(0,207,208,0.95);
  box-shadow: 0 0 0 12px rgba(0,207,208,0.12);
}

.am-center-title{
  margin:0;
  font-weight: 950;
  letter-spacing: .18em;
  font-size: 12px;
  opacity: .95;
}
.am-center-sub{
  margin:2px 0 0;
  font-weight: 850;
  font-size: 11px;
  opacity: .70;
}

.am-hint{
  margin-top: 12px;
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
}
.am-hint .mdi{ font-size: 18px; margin-top: 1px; }
.am-hint p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
   CONTROLE RÁPIDO (CARD)
====================== */
.eq-control-card{
  padding: 14px;
  border-radius: 20px;
  background:
    radial-gradient(800px 260px at 20% -60%, rgba(255,255,255,0.08), transparent 60%),
    rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
}

.eq-control-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap: 12px;
  margin-bottom: 12px;
}

.eq-control-title .t{
  margin:0;
  font-weight: 950;
  letter-spacing: -0.01em;
  font-size: 16px;
}
.eq-control-title .d{
  margin: 4px 0 0;
  color: rgba(255,255,255,0.65);
  font-weight: 650;
  font-size: 13px;
}

/* switch futurista */
.switch { position: relative; width: 52px; height: 30px; }
.switch input { display:none; }
.slider{
  position:absolute;
  inset:0;
  border-radius:999px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.14);
  transition: background .16s ease;
}
.slider::after{
  content:"";
  position:absolute;
  top:50%;
  left:4px;
  width: 22px;
  height: 22px;
  border-radius:999px;
  background:#fff;
  transform: translateY(-50%);
  transition: left .16s ease, background .16s ease;
  box-shadow: 0 10px 28px rgba(0,0,0,0.45);
}
.switch input:checked + .slider{
  background: rgba(0,207,208,0.34);
}
.switch input:checked + .slider::after{
  left: 26px;
  background: #00cfd0;
}

/* presets */
.eq-presets{
  display:flex;
  flex-wrap:wrap;
  gap: 10px;
  margin: 10px 0 12px;
}

.pill{
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
  cursor: pointer;
  display:inline-flex;
  align-items:center;
  gap: 8px;
  transition: transform .15s ease, background .15s ease, border-color .15s ease;
}
.pill:hover{ transform: translateY(-1px); background: rgba(255,255,255,0.09); }
.pill:active{ transform: translateY(0) scale(0.98); }
.pill.primary{
  border-color: rgba(0,207,208,0.34);
  background: rgba(0,207,208,0.12);
}

.eq-mini-note{
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px;
  border-radius: 16px;
  background: rgba(0,207,208,0.08);
  border: 1px solid rgba(0,207,208,0.18);
  color: rgba(255,255,255,0.82);
}
.eq-mini-note .mdi{ font-size: 18px; margin-top: 1px; }
.eq-mini-note p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
   BANDS
====================== */
.eq-bands{
  margin-top: 14px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.09);
}

.eq-bands-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 12px;
  flex-wrap:wrap;
  margin-bottom: 10px;
}

.eq-h3{
  margin:0;
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.01em;
}
.eq-p{
  margin: 6px 0 0;
  color: rgba(255,255,255,0.66);
  font-weight: 650;
  font-size: 13px;
  line-height: 1.45;
}

.eq-chip{
  display:inline-flex;
  align-items:center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.78);
  font-weight: 800;
  font-size: 12px;
}

/* grid ultra responsivo */
.eq-sliders{
  display:grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

@media (max-width: 920px){
  .eq-sliders{ grid-template-columns: repeat(3, minmax(0,1fr)); }
}
@media (max-width: 520px){
  .eq-sliders{ grid-template-columns: repeat(2, minmax(0,1fr)); }
  .eq-scroll{ padding: 14px 12px 0; }
}

.band{
  position: relative;
  border-radius: 18px;
  padding: 12px 10px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.10);
  overflow:hidden;
}
.band::before{
  content:"";
  position:absolute;
  inset:-50px -80px auto;
  height: 160px;
  background: radial-gradient(240px 90px at 18% 55%, rgba(0,207,208,0.16), transparent 60%);
  pointer-events:none;
}

.band-top{
  position: relative;
  z-index: 1;
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.hz{
  margin:0;
  font-weight: 950;
  font-size: 12px;
  color: rgba(255,255,255,0.92);
}
.db{
  margin:0;
  font-weight: 950;
  font-size: 12px;
  color: rgba(0,207,208,0.95);
}

.range-wrap{
  position: relative;
  z-index: 1;
}
.range{ width: 100%; }
.range-glow{
  --p: .5;
  position:absolute;
  inset: -6px -6px -10px -6px;
  border-radius: 16px;
  background: radial-gradient(220px 120px at 50% 50%, rgba(0,207,208,0.18), transparent 60%);
  opacity: calc(0.25 + var(--p) * 0.45);
  filter: blur(10px);
  pointer-events:none;
}

.band-hint{
  position: relative;
  z-index: 1;
  margin: 8px 0 0;
  font-size: 12px;
  opacity: 0.70;
  text-align:center;
  font-weight: 800;
}

/* info note */
.eq-note{
  margin-top: 8rem;
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
}
.eq-note .mdi{ font-size: 18px; margin-top: 2px; }
.eq-note p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
        MODAL ASSINATURA (igual seu)
====================== */
.sub-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999;
}

.sub-modal {
  width: min(980px, 100%);
  min-height: 360px;
  background: #fff;
  border-radius: 22px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 340px 1fr;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.45);
  position: relative;
  outline: none;
}

.sub-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: grid;
  place-items: center;
}
.sub-close .mdi { font-size: 20px; }

.sub-left {
  background: #00cfd0;
  display: grid;
  place-items: center;
  padding: 28px;
}

.sub-left-inner { text-align: center; color: #fff; }

.sub-icon {
  width: 86px;
  height: 86px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.18);
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
}
.sub-icon .mdi { font-size: 44px; }

.sub-left-title {
  font-size: 30px;
  line-height: 1.1;
  margin: 0 0 10px;
  font-weight: 850;
  letter-spacing: -0.02em;
}
.sub-left-sub { margin: 0; opacity: 0.95; font-weight: 600; }

.sub-right { padding: 34px 34px 26px; color: #111; }

.sub-title {
  margin: 0 0 10px;
  font-size: 30px;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.sub-desc {
  margin: 0 0 18px;
  color: #4b5563;
  font-weight: 600;
  line-height: 1.55;
}

.sub-steps { display: grid; gap: 14px; margin-bottom: 22px; }

.step {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  align-items: start;
}
.step .n {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #00cfd0;
  color: #fff;
  font-weight: 900;
  display: grid;
  place-items: center;
}
.step .t { margin: 0; font-weight: 850; color: #111; }
.step .d { margin: 2px 0 0; color: #6b7280; font-weight: 600; }

.sub-cta {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 999px;
  background: #00cfd0;
  color: #111;
  text-decoration: none;
  font-weight: 900;
  letter-spacing: 0.08em;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s, filter 0.15s;
}
.sub-cta:hover { transform: translateY(-1px); filter: brightness(0.98); }
.sub-cta .mdi { font-size: 22px; }

.sub-foot {
  margin: 14px 0 0;
  text-align: center;
  color: #9ca3af;
  font-weight: 650;
}

@media (max-width: 860px) {
  .sub-modal { grid-template-columns: 1fr; }
  .sub-left { padding: 22px; }
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.pop-enter-active,
.pop-leave-active { transition: transform 0.18s ease, opacity 0.18s ease; }
.pop-enter-from,
.pop-leave-to { transform: translateY(10px) scale(0.985); opacity: 0; }
/* ── GRID VIEW ── */
.grid-view,
.list-view {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 20px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  width: 100%;
}

.folder-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  min-height: 170px;
  transition: all 0.18s ease;
}

.folder-card:hover {
  background: var(--surface2);
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(124, 106, 247, 0.15);
}

.folder-card:active {
  transform: scale(0.97);
}

.folder-icon {
  position: relative;
  font-size: 44px;
  color: var(--folder);
  line-height: 1;
}

.artist-folder .folder-icon {
  color: var(--folder-artist);
}

.folder-badge {
  position: absolute;
  bottom: -4px;
  right: -8px;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 20px;
  min-width: 20px;
  text-align: center;
}

.artist-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.artist-thumb {
  width: 58px;
  height: 58px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid var(--border);
}

.folder-info {
  width: 100%;
}

.folder-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  line-height: 1.35;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.folder-meta {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

/* ── LIST VIEW ── */
.songs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.song-row {
  display: grid;
  grid-template-columns: 32px 48px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.15s;
  cursor: default;
}

.song-row:hover {
  background: var(--surface);
  border-color: var(--border);
}

.song-row.playing {
  background: rgba(124, 106, 247, 0.12);
  border-color: var(--accent);
}

.song-idx {
  width: 20px;
  text-align: right;
  font-size: 13px;
  color: var(--muted);
  flex-shrink: 0;
}

.song-cover {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.song-info {
  min-width: 0;
  overflow: hidden;
}

.song-title-wrap {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.song-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 0;
  will-change: transform;
}

.song-artist {
  font-size: 12px;
  color: var(--muted);
  margin: 2px 0 0;
}

.song-tipo {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-shrink: 0;
  margin: 0 10px;
}

.tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  background: rgba(124, 106, 247, 0.18);
  color: var(--accent2);
  border: 1px solid rgba(124, 106, 247, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.song-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  opacity: 1;
}

.action-btn {
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
}

.action-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
}

.play-btn:hover {
  background: #22c55e;
  border-color: #22c55e;
}

/* ── MODAL ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px 16px;
  z-index: 999;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  width: 100%;
  max-width: 560px;
  border-radius: 16px;
  padding: 16px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 16px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close {
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  font-size: 16px;
  outline: none;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.music-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px;
}

.cover {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.modal-title-wrap {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.info .title {
  font-size: 14px;
  margin: 0;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  display: inline-block;
  padding-left: 100%;
  will-change: transform;
  animation: marqueeScroll 10s linear infinite;
}

.info .artist {
  font-size: 12px;
  color: var(--muted);
  margin: 2px 0 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.actions button {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.actions button:hover {
  background: var(--accent);
  border-color: var(--accent);
}

.empty,
.empty-hint {
  color: var(--muted);
  text-align: center;
  padding: 20px 10px;
  margin: 0;
}

@keyframes marqueeScroll {
  100% {
    transform: translateX(100%);
  }
  0% {
    transform: translateX(-100%);
  }
}

/* ── MEDIA QUERIES ── */
@media (max-width: 600px) {
  .crumb-text {
    display: none;
  }

  .btn-text {
    display: none;
  }

  .btn-search {
    padding: 8px 12px;
    border-radius: 50%;
  }

  .hide-on-mobile {
    display: none !important;
  }

  .grid-view,
  .list-view {
    padding: 12px;
  }

  .folders-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .folder-card {
    min-height: 140px;
    padding: 14px 10px;
  }

  .folder-icon {
    font-size: 38px;
  }

  .song-row {
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 8px;
    padding: 8px;
  }

  .song-idx {
    display: none;
  }

  .song-actions .action-btn {
    padding: 6px;
  }

 .song-title {
  display: inline-block;
  white-space: nowrap;
  min-width: max-content;
  animation: marqueeScroll 10s linear infinite;
}
  .modal-overlay {
    padding-top: 20px;
  }
}

@media (min-width: 768px) {
  .folders-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (min-width: 1200px) {
  .folders-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  .grid-view,
  .list-view {
    padding: 24px 32px;
  }
}
.song-actions .offline-action{gap:6px;width:auto;min-height:44px;color:#a8edc5}.offline-action span{font-size:11px;white-space:nowrap}@media(max-width:600px){.song-row{grid-template-columns:44px minmax(0,1fr)}.song-actions{grid-column:1/-1;justify-content:flex-end;margin-top:4px}.song-actions .action-btn{min-width:44px;min-height:44px;justify-content:center}.song-title{animation:none;min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis}.song-tipo{display:none}}
.folder-intro{padding:28px 24px 18px;max-width:1400px;margin:auto}.eyebrow{font-size:10px;letter-spacing:2px;color:#7ee8ba}.folder-intro h1{font-size:clamp(26px,4vw,38px);line-height:1.2;margin:10px 0}.folder-intro>p{color:#aebcb5;max-width:760px;line-height:1.65}.folder-options{display:flex;align-items:center;flex-wrap:wrap;gap:18px;margin-top:18px}.folder-options label{display:flex;align-items:center;gap:9px;font-size:13px;min-height:44px}.folder-options input{width:18px;height:18px;accent-color:#74e7ae}.refresh-button,.batch-status button{border:1px solid #315545;border-radius:10px;padding:12px;color:#bcead4}.folder-toolbar,.batch-status{margin:10px 24px 22px;padding:20px;border:1px solid #315545;border-radius:16px;background:linear-gradient(120deg,#173127,#141e1a)}.folder-toolbar strong{font-size:18px}.folder-toolbar small{display:block;color:#a8b9b0;margin-top:5px}.folder-buttons{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.folder-buttons button{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;min-height:46px;border-radius:10px;border:1px solid #37644d;font-size:13px;color:#d1e9dd;background:#1d3328}.folder-buttons button.primary{background:#8aefbd;color:#092b1a;font-weight:700}.folder-buttons button:disabled,.folder-card-actions button:disabled{opacity:.45;cursor:default}.folder-help{font-size:12px;color:#adc7b8;line-height:1.6;margin-top:16px}.folder-error{padding:14px 24px;color:#ffb5b5}.folder-card{padding:0!important;overflow:hidden;cursor:default!important}.folder-open{width:100%;display:flex;align-items:center;gap:12px;padding:18px;text-align:left;color:inherit;background:transparent}.folder-card-actions{border-top:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr}.folder-card-actions button{display:flex;align-items:center;justify-content:center;gap:5px;min-height:44px;font-size:13px;color:#b4e9cf}.folder-card-actions button+button{border-left:1px solid var(--border)}.folder-open:focus-visible,.folder-card-actions button:focus-visible,.folder-buttons button:focus-visible,.song-actions button:focus-visible{outline:2px solid #8aefbd;outline-offset:-3px}.batch-status{display:flex;flex-wrap:wrap;align-items:center;gap:16px}.batch-status>div{flex:1;min-width:180px}.batch-status strong,.batch-status span{display:block;overflow-wrap:anywhere}.batch-status span{font-size:12px;color:#b5c5bc;margin-top:7px}.batch-status progress{accent-color:#87efb9;width:min(260px,100%);height:12px}.batch-status>p,.batch-status details{width:100%;font-size:13px}.batch-status summary{cursor:pointer}.batch-status ul{padding:12px 22px;overflow-wrap:anywhere}.saved-badge{color:#90e9b6;font-size:10px;margin-left:6px}.song-playing{border-color:#78d9a5!important;background:#182e23!important}.section-label select{margin-left:auto;border:1px solid #33473b;border-radius:8px;color:#c4d8ce;background:#19231e;padding:8px;font-size:12px;max-width:180px}.connection-note{color:#87dfb2!important;font-size:13px}.folder-search-panel{background:#12251b;color:#d7e9df;border:1px solid #315545;border-radius:18px;padding:20px;max-height:80dvh;overflow:auto}.folder-search-panel header{display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:16px}.folder-search-panel header button,.search-result button{min-width:44px;min-height:44px;border:1px solid #315545;border-radius:10px;font-size:21px;color:#bcead4}.folder-search-panel input{width:100%;padding:14px;background:#0d1b14;border:1px solid #416b52;border-radius:10px;color:white}.search-result{display:flex;align-items:center;gap:10px;padding:14px 0;border-bottom:1px solid #2a4535}.search-result>div{flex:1;min-width:0}.search-result strong{display:block;overflow-wrap:anywhere;font-size:14px}.search-result p{font-size:12px;color:#a7bcae;margin-top:6px}.folder-search-panel .results{max-height:none!important}.folder-search-panel .empty-hint{text-align:left;padding:20px 0!important}@media(max-width:600px){.folder-intro{padding:22px 16px 10px}.folder-options{gap:4px;align-items:flex-start;flex-direction:column}.folder-toolbar,.batch-status{margin:10px 12px 18px;padding:16px}.folder-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.folder-buttons button{padding:10px 7px;font-size:11px;line-height:1.4}.folder-open{padding:16px 12px}.song-actions{flex-wrap:wrap!important}.song-actions .offline-action{font-size:10px!important}.song-info{min-width:0}.song-title{overflow-wrap:anywhere}.folder-options label{font-size:12px}.section-label{flex-wrap:wrap}.section-label select{margin-left:0}.folder-search-panel{padding:16px}.folder-search-panel h2{font-size:19px}}@media(prefers-reduced-motion:reduce){.folder-card,.song-row{transition:none!important}}
</style>

<style scoped>.folder-card :deep(.folder-summary){padding:0 16px 10px}.song-actions{flex-wrap:wrap}.folder-toolbar :deep(.folder-summary){flex-basis:100%}</style>
