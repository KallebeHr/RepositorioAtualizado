<template>
  <div class="music-page">
    <header class="header">
      <h1 class="title">⭐ Favoritos</h1>
      <p class="subtitle">Suas músicas favoritas reunidas em um só lugar</p>
    </header>

    <!-- Busca + botão baixar todas -->
    <section class="search search-row">
      <input
        v-model="filtros.busca"
        type="text"
        placeholder="🔍 Pesquisar nos favoritos..."
      />
      <button class="download-all" @click="baixarTodas" :disabled="!filtradas.length">
        <ArrowDownTrayIcon class="icon" />
        Baixar todas
      </button>
    </section>

    <!-- Status -->
    <div v-if="loading" class="status">Carregando favoritos...</div>
    <div v-if="error" class="status error">{{ error }}</div>

    <!-- Lista -->
    <section v-if="!loading && filtradas.length" class="grid">
      <div v-for="m in filtradas" :key="favoriteId(m)" class="card">
        <img src="/LogoMusic.jpg" class="cover" />
        <div class="info">
          <h2 class="track-title">{{ m.title }}</h2>
          <p class="track-meta">
            <span>{{ m.cantor }}</span> •
            <span>{{ m.estilos?.join(', ') || '—' }}</span>
          </p>
        </div>
        <div class="actions">
          <button class="icon-btn" @click="enqueue(m)" title="Adicionar à fila">
            <PlusCircleIcon class="icon" />
          </button>
          <button class="icon-btn primary" @click="playNow(m)" title="Tocar agora">
            <PlayIcon class="icon" />
          </button>
          <button class="icon-btn" @click="download(m)" title="Baixar">
            <ArrowDownTrayIcon class="icon" />
          </button>
          <button
            class="icon-btn favorite active"
            @click="removeFavorite(m)"
            title="Remover dos favoritos"
          >
            <StarIcon class="icon" />
          </button>
        </div>
      </div>
    </section>

    <div v-if="!loading && !filtradas.length" class="status">
      Nenhuma música favorita encontrada.
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { db } from '@/firebase'
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useUserStore } from '@/stores/userStore'
import { downloadTrack, favoriteId } from '@/services/downloads'
import { normalizeTrack, trackKey } from '@/utils/media'
import { useToast } from 'vue-toast-notification'
import { PlayIcon, ArrowDownTrayIcon, PlusCircleIcon, StarIcon } from '@heroicons/vue/24/solid'
const player=usePlayerStore(), user=useUserStore(), toast=useToast(), favorites=ref([]), loading=ref(false),error=ref(''),filtros=ref({busca:''})
const filtradas=computed(()=>favorites.value.filter(m=>`${m.title} ${m.cantor}`.toLowerCase().includes(filtros.value.busca.toLowerCase())))
let generation=0
watch(()=>[user.user?.uid,user.user?.favorites],async()=>{
 const run=++generation;loading.value=true;error.value='';if(!user.user){favorites.value=[];loading.value=false;return}
 try{const results=await Promise.all((user.user.favorites||[]).map(async value=>{
 if(typeof value==='object' && value?.downloadUrl)return normalizeTrack(value)
 if(typeof value!=='string')return null
 const v2=value.startsWith('v2:'),id=v2?value.slice(3):value;if(!id)return null
 const snap=await getDoc(doc(db,v2?'musicasV2':'musicas',id));return snap.exists()?normalizeTrack({...snap.data(),id,collectionName:v2?'musicasV2':'musicas'}):null
 }));if(run===generation)favorites.value=[...new Map(results.filter(Boolean).map(track=>[trackKey(track),track])).values()]}catch(e){if(run===generation)error.value=e.message}finally{if(run===generation)loading.value=false}
},{immediate:true,deep:true})
function permitted(){if(!user.hasActiveSubscription){toast.warning('Assinatura necessária');return false}return true}
function enqueue(m){if(permitted())player.addToQueue(m)}
function playNow(m){if(permitted()){player.setFullList(filtradas.value);player.addToQueue(m,{playNow:true})}}
async function removeFavorite(m){try{const values=(user.user.favorites||[]).filter(value=>(typeof value==='object'?favoriteId(value):value)===favoriteId(m));if(values.length)await updateDoc(doc(db,'users',user.user.uid),{favorites:arrayRemove(...values)})}catch(e){toast.error(e.message)}}
async function download(m){if(permitted())try{await downloadTrack(user.user.uid,m)}catch(e){toast.error(e.message)}}
async function baixarTodas(){for(const track of filtradas.value)await download(track)}
</script>




<style scoped>
/* aproveitando o mesmo estilo da sua página de repertório */
.music-page {
  width: 100%;
  padding: 24px 16px;
  background: #111;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}
.header { text-align: center; margin-bottom: 24px; }
.title {
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(90deg, #1db954, #00c3ff, #1db954);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle { color: #9aa0a6; font-size: 16px; }

/* Busca + botão */
.search-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.search-row input {
  flex: 1;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid #2a2a2a;
  background: #181818;
  color: #fff;
}
.download-all {
  background: #1db954;
  color: #0b0b0b;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.download-all .icon {
  width: 20px;
  height: 20px;
}

/* Grid e cards */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 20px;
}
.card {
  background: #181818;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #242424;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 300px;
}
.cover {
  width: 100%;
  height: 180px;
  border-radius: 12px;
  object-fit: cover;
  margin-bottom: 12px;
}
.info { flex: 1; min-width: 0; overflow: hidden; }
.track-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.track-meta {
  font-size: 13px;
  color: #9aa0a6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  gap: 8px;
}
.icon-btn {
  background: #202020;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  height: 38px;
  width: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-btn.primary { background: #1db954; }
.icon-btn .icon { width: 20px; height: 20px; color: #eaeaea; }
.icon-btn.primary .icon { color: #0b0b0b; }
.icon-btn.favorite.active .icon { color: #ffd700; }

/* mobile */
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .card {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 12px;
    min-height: auto;
  }
  .cover {
    width: 70px;
    height: 70px;
    margin: 0;
  }
  .info {
    flex: 1;
    min-width: 0;
    padding-right: 5px;
  }
  .actions {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
