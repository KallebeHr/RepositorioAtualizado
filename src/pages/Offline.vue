<template>
 <main class="offline-page">
  <header><span class="eyebrow">SUA MÚSICA, NO SEU APARELHO</span><h1>Biblioteca offline</h1><p>{{ records.length }} músicas · {{ sizeText }} · {{ online ? 'Conectado' : 'Sem internet' }}</p></header>
  <section v-if="!records.length" class="offline-guide"><h2>Como ouvir sem internet</h2><ol><li>Com internet, entre na sua conta e abra Músicas ou Músicas V2.</li><li>Toque em <strong>Salvar offline</strong> e aguarde a confirmação.</li><li>Volte a esta biblioteca para ouvir, mesmo sem conexão.</li></ol><div class="catalog-links"><router-link to="/AllMusic">Escolher músicas</router-link><router-link to="/MusicasV2">Abrir Músicas V2</router-link><router-link v-if="!user.user" to="/RegisterAndLogin?mode=login">Entrar na conta</router-link></div></section>
  <p v-if="pwaError" role="alert" class="error">{{ pwaError }}</p>
  <p v-if="error" role="alert" class="error">{{ error }}</p><p v-if="loading" role="status">Abrindo biblioteca…</p>
  <div class="tools"><input v-model="search" placeholder="Buscar título ou cantor" aria-label="Buscar músicas offline"/><button @click="playAll" :disabled="!filtered.length">Ouvir todas</button><button @click="freeAll" :disabled="!records.length">Liberar espaço</button></div>
  <article v-for="record in filtered" :key="record.key" class="offline-track"><img src="/LogoMusic.jpg" alt=""/><div><h2>{{ record.track.title }}</h2><p>{{ record.track.cantor }} · {{ (record.size/1048576).toFixed(1) }} MB</p></div><button @click="play(record.track)" :aria-label="'Ouvir '+record.track.title"><i class="mdi mdi-play"/></button><button @click="player.addToQueue(record.track)" :aria-label="'Adicionar '+record.track.title+' à fila'"><i class="mdi mdi-playlist-plus"/></button><button @click="remove(record.track)" :aria-label="'Remover '+record.track.title+' do aparelho'"><i class="mdi mdi-delete-outline"/></button></article>
  <p v-if="!loading && !records.length && user.user">Escolha uma música no catálogo ou nas pastas e toque em “Salvar offline”.</p>
  <p class="note">Disponível neste navegador e aparelho, para esta conta. Guarde espaço livre e mantenha o acesso ativo. Limpar os dados do navegador remove os arquivos.</p>
 </main>
</template>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { listOffline, removeOffline, clearOffline, OFFLINE_EVENT } from '@/services/offline'
import { pwaError } from '@/services/pwa'
const user=useUserStore(), player=usePlayerStore(), records=ref([]), error=ref(''), loading=ref(false), search=ref(''), online=ref(navigator.onLine)
const filtered=computed(()=>records.value.filter(r=>`${r.track.title} ${r.track.cantor}`.toLowerCase().includes(search.value.toLowerCase())))
const sizeText=computed(()=>`${(records.value.reduce((sum,r)=>sum+r.size,0)/1048576).toFixed(1)} MB`)
let generation=0
async function refresh(){const run=++generation;loading.value=true;try{const data=await listOffline(user.user?.uid);if(run===generation)records.value=data}catch(e){error.value=e.message}finally{if(run===generation)loading.value=false}}
function play(track){player.setFullList(filtered.value.map(r=>r.track));player.addToQueue(track,{playNow:true})}
function playAll(){if(!filtered.value.length)return;player.replaceQueue(filtered.value.map(r=>r.track))}
async function remove(track){try{await removeOffline(user.user?.uid,track)}catch(e){error.value=e.message}}
async function freeAll(){if(window.confirm('Remover todas as músicas offline desta conta neste aparelho?'))try{await clearOffline(user.user?.uid)}catch(e){error.value=e.message}}
function connection(){online.value=navigator.onLine}
watch(()=>user.user?.uid,refresh,{immediate:true})
onMounted(()=>{window.addEventListener(OFFLINE_EVENT,refresh);window.addEventListener('online',connection);window.addEventListener('offline',connection)})
onBeforeUnmount(()=>{generation++;window.removeEventListener(OFFLINE_EVENT,refresh);window.removeEventListener('online',connection);window.removeEventListener('offline',connection)})
</script>
<style scoped>.offline-page{background:#101714;color:white;min-height:85vh;padding:40px max(16px,calc((100vw - 1000px)/2)) 160px}.eyebrow{font-size:11px;letter-spacing:2px;color:#7be5a8}h1{font-size:36px;margin:12px 0}p{color:#a9bfb2;margin:10px 0}.tools{display:flex;gap:10px;flex-wrap:wrap;margin:26px 0}input{flex:1;min-width:180px}input,button{background:#21372b;color:white;border:1px solid #375543;padding:10px;border-radius:10px}button{cursor:pointer}button:disabled{opacity:.5}.offline-track{display:flex;align-items:center;gap:10px;padding:14px;border-bottom:1px solid #294035}.offline-track img{width:54px;height:54px;object-fit:cover;border-radius:10px}.offline-track>div{flex:1;min-width:0}h2{font-size:16px;overflow-wrap:anywhere}.note{font-size:13px;margin-top:35px}.error{color:#ffa8a8}.offline-guide{padding:22px;margin:24px 0;background:#193124;border:1px solid #355c43;border-radius:16px}.offline-guide h2{font-size:20px}.offline-guide ol{padding-left:20px;margin:14px 0;color:#c6ddce;line-height:1.7}.catalog-links{display:flex;gap:10px;flex-wrap:wrap}.catalog-links a{display:flex;align-items:center;min-height:44px;padding:10px 14px;background:#64df9b;border-radius:10px;color:#102518;font-size:13px;font-weight:650;text-decoration:none}@media(max-width:500px){.offline-track{display:grid;grid-template-columns:42px minmax(0,1fr) repeat(3,40px);gap:6px;padding:12px 0}.offline-track img{width:42px;height:42px}.offline-track button{padding:6px;min-height:44px}.offline-guide{padding:16px}.offline-page h1{font-size:30px}}
</style>
