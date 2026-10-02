<template>
 <section class="page-shell">
  <header class="page-heading"><div><p class="eyebrow">SEU PRÓXIMO SOM</p><h1>{{title}}</h1><p class="muted">Explore o catálogo e mantenha a música tocando enquanto navega.</p></div><router-link to="/Biblioteca" class="secondary">Minhas playlists</router-link></header>
  <div class="filter-bar">
   <label class="search-field">Pesquisar<input v-model="search" type="search" placeholder="Música, cantor ou gênero"></label>
   <label>Cantor<select aria-label="Cantor" v-model="artist"><option value="">Todos os cantores</option><option v-for="a in artists" :key="a">{{a}}</option></select></label>
   <label>Gênero<select aria-label="Gênero" v-model="genre"><option value="">Todos os gêneros</option><option v-for="g in allGenres" :key="g">{{g}}</option></select></label>
   <label>Mês<select aria-label="Mês" v-model="month"><option value="">Todos os meses</option><option v-for="m in months" :key="m" :value="m">{{monthName(m)}}</option></select></label>
  </div>
  <div v-if="mode==='artists' || mode==='genres' || mode==='months'" class="discovery-grid"><router-link v-for="group in groups" :key="group.name" :to="group.to" class="discovery-card"><i :class="`mdi mdi-${mode==='artists'?'microphone':mode==='genres'?'music-note':'calendar-month'}`"></i><strong>{{group.label}}</strong><small>{{group.count}} músicas · {{bytes(group.size)}}</small></router-link></div>
  <div class="actions"><span>{{filtered.length}} músicas</span><label class="check"><input type="checkbox" :checked="pageTracks.length>0 && pageTracks.every(t=>selected.includes(t.id))" @change="selectPage($event.target.checked)"> Selecionar esta página</label><button class="secondary" :disabled="!selected.length || busy" @click="requestPackage">Solicitar pacote · {{selected.length}}</button><label v-if="user.user" class="check"><input type="checkbox" v-model="onlyFavorites"> Apenas favoritos</label></div>
  <div v-if="selected.length" class="package-summary"><strong>{{selected.length}} músicas selecionadas · {{bytes(selectedTracks.reduce((n,t)=>n+(t.size || 0),0))}}</strong><details><summary>Ver músicas do pacote</summary><ul><li v-for="t in selectedTracks" :key="t.id">{{t.title}} — {{t.cantor}}</li></ul></details><button class="secondary" @click="selected=[]">Limpar seleção</button></div>
  <p v-if="catalog.loading" role="status">Carregando músicas…</p><div v-if="catalog.error" role="alert" class="error">{{catalog.error}} <button class="secondary" @click="catalog.load(true)">Tentar novamente</button></div>
  <p role="status" class="status-message">{{message}}</p>
  <div class="track-list"><article class="track-row" v-for="track in pageTracks" :key="track.id" :class="{playing:player.current?.id===track.id}">
   <input type="checkbox" :value="track.id" v-model="selected" :aria-label="`Selecionar ${track.title}`">
   <button class="track-play" @click="play(track)" :aria-label="`Reproduzir ${track.title}`"><i :class="`mdi mdi-${player.current?.id===track.id && player.isPlaying?'volume-high':'play'}`"></i></button>
   <div class="track-meta"><strong>{{track.title}}</strong><router-link :to="{path:'/Cantor',query:{nome:track.cantor}}">{{track.cantor}}</router-link><small><router-link v-for="g in genres(track)" :key="g" :to="{path:'/Genero',query:{nome:g}}">{{g}} </router-link> · {{monthName(track.month)}}</small></div>
   <div class="track-file"><span>{{time(track.duration)}}</span><small>{{bytes(track.size)}} · {{track.quality || 'Qualidade não informada'}}</small></div>
   <div class="track-actions"><button class="icon-button" @click="favorite(track)" :aria-label="`${isFavorite(track)?'Remover':'Adicionar'} ${track.title} ${isFavorite(track)?'dos':'aos'} favoritos`" :aria-pressed="isFavorite(track)"><i :class="`mdi mdi-${isFavorite(track)?'heart':'heart-outline'}`"></i></button><button class="icon-button" @click="queue(track)" :aria-label="`Adicionar ${track.title} à fila`"><i class="mdi mdi-playlist-plus"></i></button><button class="icon-button" @click="download(track)" :aria-label="`Baixar ${track.title}`"><i class="mdi mdi-download"></i></button><button v-if="user.user" class="icon-button" @click="choosePlaylist(track)" :aria-label="`Adicionar ${track.title} a uma playlist`"><i class="mdi mdi-folder-plus-outline"></i></button></div>
  </article></div>
  <p v-if="!catalog.loading && !catalog.error && !filtered.length" class="empty-state">Nenhuma música encontrada. Experimente outros filtros.</p>
  <div class="actions pagination"><button class="secondary" :disabled="page===1" @click="page--">Anterior</button><span>Página {{page}} de {{Math.max(1,Math.ceil(filtered.length/40))}}</span><button class="secondary" :disabled="page*40>=filtered.length" @click="page++">Próxima</button></div>
  <section v-if="recommendations.length && !onlyFavorites" class="recommendations"><h2>Dos gêneros que você ouve</h2><div class="discovery-grid"><button class="discovery-card" v-for="track in recommendations" :key="track.id" @click="play(track)"><strong>{{track.title}}</strong><small>{{track.cantor}}</small></button></div></section>
  <v-dialog v-model="playlistDialog" max-width="440"><v-card><v-card-title>Adicionar à playlist</v-card-title><v-card-text><label>Playlist<select aria-label="Playlist" v-model="chosenPlaylist"><option disabled value="">Selecione</option><option v-for="p in playlists" :key="p.id" :value="p.id">{{p.name}}</option></select></label><p v-if="!playlists.length">Crie uma playlist em Minha biblioteca.</p></v-card-text><v-card-actions><v-btn @click="playlistDialog=false">Cancelar</v-btn><v-btn @click="addPlaylist" :disabled="!chosenPlaylist">Adicionar</v-btn></v-card-actions></v-card></v-dialog>
 </section>
</template>
<script setup>
import {computed,ref,onMounted,watch} from 'vue'
import {useRoute} from 'vue-router'
import {collection,doc,query,where,getDocs,updateDoc,arrayUnion,arrayRemove} from 'firebase/firestore'
import {db} from '@/firebase'
import {useCatalogStore} from '@/stores/catalogStore'
import {usePlayerStore} from '@/stores/usePlayerStore'
import {useUserStore} from '@/stores/userStore'
import {filterTracks,genres,bytes,time} from '@/utils/catalog'
import {downloadTrack,downloadPackage} from '@/services/api'
const props=defineProps({mode:{type:String,default:'all'},heading:String,favorites:Boolean})
const route=useRoute(),catalog=useCatalogStore(),player=usePlayerStore(),user=useUserStore()
const search=ref(''),artist=ref(''),genre=ref(''),month=ref(''),onlyFavorites=ref(!!props.favorites),selected=ref([]),page=ref(1),message=ref(''),busy=ref(false)
const title=computed(()=>props.heading || (props.mode==='artists'?'Cantores':props.mode==='genres'?'Gêneros':props.mode==='months'?'Novidades por mês':'Todas as músicas'))
const publishedTracks=computed(()=>filterTracks(catalog.tracks))
const artists=computed(()=>[...new Set(publishedTracks.value.map(t=>t.cantor))].filter(Boolean).sort())
const allGenres=computed(()=>[...new Set(publishedTracks.value.flatMap(genres))].sort())
const months=computed(()=>[...new Set(publishedTracks.value.map(t=>t.month))].filter(m=>m!=='1970-01').sort().reverse())
const filtered=computed(()=>filterTracks(catalog.tracks,{search:search.value,artist:artist.value,genre:genre.value,month:month.value}).filter(t=>!onlyFavorites.value || isFavorite(t)).sort((a,b)=>props.mode==='months'?b.month.localeCompare(a.month):a.title.localeCompare(b.title)))
const pageTracks=computed(()=>filtered.value.slice((page.value-1)*40,page.value*40))
const selectedTracks=computed(()=>catalog.tracks.filter(t=>selected.value.includes(t.id)))
const groups=computed(()=>{const values=props.mode==='artists'?artists.value:props.mode==='genres'?allGenres.value:months.value;return values.map(name=>{const tracks=publishedTracks.value.filter(t=>props.mode==='artists'?t.cantor===name:props.mode==='genres'?genres(t).includes(name):t.month===name);return {name,label:props.mode==='months'?monthName(name):name,count:tracks.length,size:tracks.reduce((n,t)=>n+(t.size || 0),0),to:props.mode==='artists'?{path:'/Cantor',query:{nome:name}}:props.mode==='genres'?{path:'/Genero',query:{nome:name}}:{path:'/Mes',query:{mes:name}}}})})
const recommendations=computed(()=>{const ranked=Object.entries(player.genreHistory).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);return publishedTracks.value.filter(t=>genres(t).some(g=>ranked.includes(g))).slice(0,6)})
function monthName(m){if(!m || m==='1970-01')return 'Sem mês informado';return new Date(`${m}-01T12:00:00`).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}
function isFavorite(t){return user.user?.favorites?.includes(t.id) || false}
function play(t){if(!user.hasActiveSubscription){message.value='Entre na sua conta e ative a assinatura para ouvir.';return}player.addToQueue(t,{playNow:true})}
function queue(t){if(!user.hasActiveSubscription){message.value='Assinatura ativa necessária.';return}player.addToQueue(t);message.value=`${t.title} adicionada à fila.`}
async function favorite(t){if(!user.user){message.value='Entre para salvar favoritos.';return}try{await updateDoc(doc(db,'users',user.user.uid),{favorites:isFavorite(t)?arrayRemove(t.id):arrayUnion(t.id)})}catch{message.value='Não foi possível salvar o favorito.'}}
async function download(t){try{await downloadTrack(t);message.value='Download autorizado.'}catch(e){message.value=e.message}}
async function requestPackage(){busy.value=true;try{const r=await downloadPackage(selected.value);message.value=r.status==='ready'?'Download autorizado.':'Pacote solicitado. Acompanhe em Minha conta; ele será preparado fora do celular.'}catch(e){message.value=e.message}finally{busy.value=false}}
function selectPage(value){const ids=pageTracks.value.map(t=>t.id);selected.value=value?[...new Set([...selected.value,...ids])]:selected.value.filter(id=>!ids.includes(id))}
const playlistDialog=ref(false),playlists=ref([]),chosenPlaylist=ref(''),playlistTrack=ref(null)
async function choosePlaylist(t){try{const snap=await getDocs(query(collection(db,'playlists'),where('uid','==',user.user.uid)));playlists.value=snap.docs.map(d=>({...d.data(),id:d.id}));playlistTrack.value=t;chosenPlaylist.value='';playlistDialog.value=true}catch{message.value='Não foi possível carregar as playlists.'}}
async function addPlaylist(){try{await updateDoc(doc(db,'playlists',chosenPlaylist.value),{trackIds:arrayUnion(playlistTrack.value.id)});playlistDialog.value=false;message.value='Música adicionada à playlist.'}catch{message.value='Não foi possível salvar.'}}
watch([search,artist,genre,month,onlyFavorites],()=>page.value=1)
watch(()=>route.query,query=>{artist.value=query.cantor || (route.path==='/Cantor'?query.nome:'') || '';genre.value=query.genero || (route.path==='/Genero'?query.nome:'') || '';month.value=query.mes || '';search.value=query.busca || ''},{immediate:true})
onMounted(()=>{catalog.load();try{player.genreHistory=JSON.parse(localStorage.getItem('repertorio:genres') || '{}')}catch{}})
</script>
