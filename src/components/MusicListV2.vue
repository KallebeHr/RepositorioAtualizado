<template>
  <main class="v2-catalog">
    <header><h1>Músicas V2</h1><p>Novo catálogo · {{ tracks.length }} músicas carregadas</p></header>
    <div class="tools">
      <input v-model="search" type="search" placeholder="Pesquisar música, cantor ou estilo" aria-label="Pesquisar músicas V2" />
      <select v-model="genre" aria-label="Filtrar estilo"><option value="">Todos os estilos</option><option v-for="item in genres" :key="item">{{ item }}</option></select>
      <select v-model="artist" aria-label="Filtrar cantor"><option value="">Todos os cantores</option><option v-for="item in artists" :key="item">{{ item }}</option></select>
      <button @click="reload" :disabled="loading">Atualizar</button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="loading" role="status">Carregando músicas…</p>
    <section class="grid">
      <article v-for="track in filtered" :key="track.id" class="card">
        <img src="/LogoMusic.jpg" alt="" />
        <div><h2>{{ track.title }}</h2><p>{{ track.cantor }} · {{ track.estilos.join(', ') }}</p></div>
        <div class="actions">
          <button @click="play(track)" :aria-label="'Ouvir ' + track.title"><i class="mdi mdi-play" /><span>Ouvir</span></button>
          <button @click="queue(track)" :aria-label="'Adicionar ' + track.title + ' à fila'"><i class="mdi mdi-playlist-plus" /><span>Adicionar à fila</span></button>
          <button class="offline-action" @click="saveLocal(track)" :disabled="working===track.id" :aria-label="'Salvar offline '+track.title"><i class="mdi mdi-cloud-download-outline"/><span>{{ working===track.id?'Aguarde…':'Salvar offline' }}</span></button>
          <button @click="download(track)" :disabled="working === track.id" :aria-label="'Baixar ' + track.title"><i class="mdi mdi-download" /><span>Baixar arquivo</span></button>
        </div>
      </article>
    </section>
    <p v-if="!loading && !error && !filtered.length">Nenhuma música V2 encontrada.</p>
    <button v-if="hasMore" @click="more" :disabled="loading">Carregar mais músicas</button>
  </main>
</template>

<script setup>
import { saveTrackOffline, downloadTrack } from "@/services/downloads"
import { ref, computed, onMounted, watch } from 'vue'
import { collection, query, orderBy, getDocs, limit, startAfter } from 'firebase/firestore'
import { db } from '@/firebase'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { useUserStore } from '@/stores/userStore'
import { v2Error } from '@/services/music-v2-model.mjs'

const player = usePlayerStore(), userStore = useUserStore()
const tracks = ref([]), loading = ref(false), error = ref(''), message = ref(''), hasMore = ref(false)
const search = ref(''), genre = ref(''), artist = ref(''), working = ref('')
let cursor = null, generation = 0
const genres = computed(() => [...new Set(tracks.value.flatMap(track => track.estilos))].sort())
const artists = computed(() => [...new Set(tracks.value.map(track => track.cantor))].sort())
const filtered = computed(() => tracks.value.filter(track => (!genre.value || track.estilos.includes(genre.value))
  && (!artist.value || track.cantor === artist.value)
  && `${track.title} ${track.cantor} ${track.estilos.join(' ')}`.toLowerCase().includes(search.value.toLowerCase())))
watch(filtered, list => player.setFullList(list))

async function load(reset = false) {
  if (loading.value) return
  const run = ++generation
  loading.value = true
  error.value = ''
  try {
    const constraints = [orderBy('createdAt', 'desc')]
    if (!reset && cursor) constraints.push(startAfter(cursor))
    // Uma ordenação simples, sem a consulta composta do V2 anterior.
    const snapshot = await getDocs(query(collection(db, 'musicasV2'), ...constraints, limit(51)))
    if (run !== generation) return
    const docs = snapshot.docs.slice(0, 50)
    const incoming = docs.map(item => ({ ...item.data(), id: item.id, collectionName: "musicasV2",
      estilos: Array.isArray(item.data().tipo) ? item.data().tipo : [] }))
    tracks.value = [...new Map([...(reset ? [] : tracks.value), ...incoming].map(track => [track.id, track])).values()]
    cursor = docs.at(-1) || null
    hasMore.value = snapshot.size > 50
  } catch (err) { error.value = v2Error(err) }
  finally { loading.value = false }
}
const reload = () => load(true), more = () => load(false)
function permitted() {
  if (!userStore.hasActiveSubscription) { error.value = 'Assinatura necessária, como no repertório normal.'; return false }
  error.value = ''
  return true
}
function play(track) { if (permitted()) player.addToQueue(track, { playNow: true }) }
function queue(track) { if (permitted()) player.addToQueue(track) }
async function download(track) {
  if (!permitted() || working.value) return
  working.value = track.id
  message.value = ''
  try {
    await downloadTrack(userStore.user.uid, track)
    message.value = 'Download iniciado.'
  } catch (err) { error.value = err.message || 'Não foi possível baixar. Confira o CORS do R2.' }
  finally { working.value = '' }
}
async function saveLocal(track){if(!permitted() || working.value)return;working.value=track.id;try{await saveTrackOffline(userStore.user.uid,track);message.value='Música salva neste aparelho. Abra Offline para ouvir sem internet.'}catch(e){error.value=e.message}finally{working.value=''}}
onMounted(reload)
</script>

<style scoped>
.actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px!important}.actions button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:46px;padding:9px 6px;font-size:12px}.actions .offline-action{background:#1c3c29;border-color:#4d8f66;color:#bff4d1}.actions span{line-height:1.2}
.v2-catalog{min-height:100vh;background:#111;color:#fff;padding:28px 20px 110px;font-family:Inter,system-ui,sans-serif}
header,.tools,.grid,.v2-catalog>p,.v2-catalog>button{max-width:1200px;margin:0 auto 20px}header{text-align:center}h1{font-size:clamp(28px,5vw,40px);color:#58d783}header p,.card p{color:#aaa;margin-top:8px}.tools{display:flex;flex-wrap:wrap;gap:10px}.tools input{flex:2;min-width:190px}.tools select{flex:1;min-width:150px}input,select,button{background:#222;color:white;border:1px solid #444;border-radius:10px;padding:12px}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px}.card{border:1px solid #333;background:#181818;padding:16px;border-radius:14px}.card img{width:100%;height:170px;object-fit:cover;border-radius:10px;margin-bottom:12px}.card h2{font-size:18px;overflow-wrap:anywhere}.actions{display:flex;gap:10px;margin-top:15px}.actions button{flex:1}.mdi{font-size:24px}.error{color:#ffaaaa}.v2-catalog>button{display:block}@media(max-width:600px){.v2-catalog{padding:22px 12px 110px}.grid{grid-template-columns:1fr}.card{display:grid;grid-template-columns:70px 1fr;gap:12px}.card img{height:70px;margin:0}.actions{grid-column:1/-1;margin-top:0}}
</style>
