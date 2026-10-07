<template>
  <Transition name="player-reveal">
    <section
      v-if="current"
      class="player-container"
      :class="{ expanded: isExpanded, 'is-playing': player.isPlaying, 'is-loading': player.loading, 'has-error': !!player.error }"
      :style="{ '--track-progress': progressPercent + '%' }"
      role="region"
      aria-label="Player de música global"
      @click="!isExpanded && handleExpandClick()"
      @keydown.esc.stop="collapsePlayer"
    >
      <div class="mini-progress" aria-hidden="true"><span /></div>
      <header v-if="isExpanded" class="mobile-header">
        <button class="btn-icon close-btn" @click.stop="handleExpandClick" aria-label="Recolher player" title="Voltar para o site"><i class="mdi mdi-chevron-down" aria-hidden="true" /></button>
        <div class="mobile-header-title"><span>SEU REPERTÓRIO</span><strong>{{ player.isPlaying ? 'Tocando agora' : 'Sua música, no seu ritmo' }}</strong></div>
        <button class="btn-icon header-eq" @click.stop="player.eqOpen=true" aria-label="Abrir equalizador" title="Abrir equalizador"><i class="mdi mdi-tune-vertical" aria-hidden="true" /></button>
      </header>

      <div class="left-section">
        <div class="thumb">
          <img src="/LogoMusic.jpg" class="cover" alt="" />
          <div class="artwork-shade" aria-hidden="true" />
          <div class="playback-badge" aria-hidden="true"><span class="activity-bars"><b /><b /><b /><b /></span><span>{{ player.error ? 'Áudio indisponível' : player.loading ? 'Carregando' : player.isPlaying ? 'Em reprodução' : 'Pausada' }}</span></div>
        </div>
        <div class="info-group">
          <div
            ref="expandTrigger"
            class="track-info"
            :role="isMobile && !isExpanded ? 'button' : undefined"
            :tabindex="isMobile && !isExpanded ? 0 : undefined"
            :aria-label="isMobile && !isExpanded ? 'Abrir player de ' + current.title : undefined"
            @click.stop="!isExpanded && handleExpandClick()"
            @keydown.enter.prevent="!isExpanded && handleExpandClick()"
            @keydown.space.prevent="!isExpanded && handleExpandClick()"
          >
            <div class="now-label"><span class="status-dot" aria-hidden="true" /><span>{{ playbackStatus }}</span><span v-if="savedCurrent" class="offline-badge"><i class="mdi mdi-check-circle-outline" aria-hidden="true" /> Offline</span></div>
            <Transition name="track-change" mode="out-in">
              <div :key="trackKey(current)" class="track-copy"><div class="title" :title="current.title">{{ current.title }}</div><div class="artist">{{ current.cantor }}</div></div>
            </Transition>
            <span class="expand-hint">Toque para abrir <i class="mdi mdi-chevron-up" aria-hidden="true" /></span>
            <p v-if="player.error" class="playback-error" role="alert">{{ player.error }}</p>
          </div>
          <button @click.stop="toggleFavorite(current)" class="btn-icon favorite" :class="{ active: isFavorite(favoriteId(current)) }" :aria-pressed="!!isFavorite(favoriteId(current))" :aria-label="isFavorite(favoriteId(current)) ? 'Remover dos favoritos' : 'Favoritar música'" title="Salvar na sua Biblioteca"><i :class="isFavorite(favoriteId(current)) ? 'mdi mdi-heart' : 'mdi mdi-heart-outline'" aria-hidden="true" /></button>
        </div>
      </div>

      <div class="center-section" @click.stop>
        <div class="controls">
          <button class="btn-icon previous-control" @click.stop="prev" title="Anterior" aria-label="Música anterior"><i class="mdi mdi-skip-previous" aria-hidden="true" /></button>
          <button class="btn-play" @click.stop="toggle" :aria-label="player.isPlaying ? 'Pausar música' : 'Reproduzir música'" :aria-busy="player.loading" title="Play/Pause"><i v-if="player.loading" class="mdi mdi-loading loading-icon" aria-hidden="true" /><i v-else :class="player.isPlaying ? 'mdi mdi-pause' : 'mdi mdi-play'" aria-hidden="true" /></button>
          <button class="btn-icon next-control" @click.stop="next" title="Próxima" aria-label="Próxima música"><i class="mdi mdi-skip-next" aria-hidden="true" /></button>
        </div>
        <div class="progress-container">
          <span class="time">{{ currentTimeText }}</span>
          <div class="slider-wrapper"><input type="range" min="0" :max="Math.max(duration,1)" step="0.1" :value="position" :disabled="!duration" :style="{ '--range-progress': progressPercent + '%' }" @input="onSeek" aria-label="Progresso da música" :aria-valuetext="currentTimeText + ' de ' + durationText" class="styled-slider seek-slider" /></div>
          <span class="time">{{ durationText }}</span>
        </div>
      </div>

      <div class="right-section" @click.stop>
        <div class="player-actions">
          <button class="btn-icon action-control download-control" @click.stop="download(current)" title="Baixar" aria-label="Baixar arquivo da música"><i class="mdi mdi-download" aria-hidden="true" /><span>Baixar</span></button>
          <button class="btn-icon action-control save-offline-control" :class="{ 'is-saved': savedCurrent }" @click.stop="saveCurrent" :disabled="savingOffline" :title="savedCurrent?'Salva neste aparelho':'Salvar offline'" aria-label="Salvar música offline"><i :class="savingOffline ? 'mdi mdi-loading loading-icon' : savedCurrent ? 'mdi mdi-check-circle' : 'mdi mdi-cloud-download-outline'" aria-hidden="true" /><span>{{ savingOffline ? 'Salvando…' : savedCurrent ? 'Salva offline' : 'Salvar offline' }}</span></button>
          <button class="btn-icon action-control equalizer-control" :class="{ 'eq-active': player.eq.enabled }" @click.stop="player.eqOpen=true" title="Equalizador" aria-label="Abrir equalizador"><i class="mdi mdi-tune-vertical" aria-hidden="true" /><span>Equalizador</span></button>
          <button class="btn-icon action-control queue-control" @click.stop="toggleQueue" title="Fila de Reprodução" aria-label="Abrir fila de reprodução"><span class="action-icon"><i class="mdi mdi-playlist-play" aria-hidden="true" /><span v-if="player.queue.length" class="badge">{{ player.queue.length }}</span></span><span>Fila</span></button>
          <v-menu location="top end" :z-index="11000" :offset="14">
            <template #activator="{ props }"><button v-bind="props" class="btn-icon action-control timer-control" :class="{ 'timer-active': player.sleepAt }" :aria-label="player.sleepAt ? 'Temporizador ativo: ' + timerLabel : 'Configurar temporizador'" title="Temporizador"><i class="mdi mdi-timer-outline" aria-hidden="true" /><span>{{ player.sleepAt ? timerLabel : 'Timer' }}</span></button></template>
            <v-list class="sleep-menu" aria-label="Opções do temporizador"><div class="sleep-heading"><i class="mdi mdi-weather-night" aria-hidden="true" /><div><strong>Ouça e descanse</strong><p>A música pausa ao final do tempo.</p></div></div><v-list-item v-for="minutes in [15,30,60]" :key="minutes" :title="'Pausar em ' + minutes + ' minutos'" @click="setTimer(minutes)" /><v-list-item v-if="player.sleepAt" title="Desativar temporizador" @click="setTimer(0)" /></v-list>
          </v-menu>
        </div>
        <div class="volume-control">
          <button class="btn-icon mute-control" @click.stop="toggleMute" :aria-label="player.volume === 0 ? 'Ativar som' : 'Silenciar música'" :title="player.volume === 0 ? 'Ativar som' : 'Silenciar'"><i :class="player.volume === 0 ? 'mdi mdi-volume-off' : player.volume < 0.5 ? 'mdi mdi-volume-medium' : 'mdi mdi-volume-high'" aria-hidden="true" /></button>
          <span class="volume-caption" aria-hidden="true">Volume</span>
          <input type="range" min="0" max="1" step="0.01" :value="player.volume" :style="{ '--range-progress': Math.round(player.volume * 100) + '%' }" @input="onVol" aria-label="Volume do player" :aria-valuetext="Math.round(player.volume * 100) + '%'" class="styled-slider vol-slider" />
          <span class="volume-value" aria-hidden="true">{{ Math.round(player.volume * 100) }}<small>%</small></span>
        </div>
      </div>
    </section>
  </Transition>

  <v-dialog v-model="showQueue" max-width="680" :z-index="11000" scrollable aria-labelledby="queue-title">
    <section class="modal queue-dialog">
      <header class="modal-head"><div class="head-left"><span class="queue-mark"><i class="mdi mdi-playlist-music" aria-hidden="true" /></span><div><span class="section-kicker">ESCOLHA O PRÓXIMO SOM</span><h3 id="queue-title">Sua fila de reprodução</h3><p>{{ player.queue.length }} {{ player.queue.length === 1 ? 'música' : 'músicas' }} · toque para ouvir</p></div></div><button class="btn-icon close-queue-btn" @click="toggleQueue" title="Fechar Fila" aria-label="Fechar Fila"><i class="mdi mdi-close" aria-hidden="true" /></button></header>
      <div class="queue-toolbar"><span><span class="status-dot" aria-hidden="true" /> {{ player.isPlaying ? 'Sua música continua tocando' : 'Monte a sua sequência' }}</span><div class="actions"><button class="btn-clean" @click="clearQueue" :disabled="!player.queue.length" title="Limpar Fila">Limpar</button><button class="btn-pill" @click="downloadAllZip" :disabled="!player.queue.length"><i class="mdi mdi-folder-download-outline" aria-hidden="true" /> Baixar tudo</button></div></div>
      <div v-if="player.queue.length" class="list">
        <div v-for="(q,i) in player.queue" :key="trackKey(q)" class="row" :class="{ active: i === player.currentIndex }">
          <button class="meta" @click="playAt(i)" :aria-label="'Ouvir ' + q.title" :aria-current="i === player.currentIndex ? 'true' : undefined"><span class="row-number">{{ String(i+1).padStart(2,'0') }}</span><span class="mini"><img src="/LogoMusic.jpg" alt="" /><span v-if="i === player.currentIndex" class="playing-overlay" aria-hidden="true"><span class="activity-bars" :class="{ paused: !player.isPlaying }"><b /><b /><b /><b /></span></span></span><span class="text"><span class="rt">{{ q.title }}</span><span class="ra">{{ q.cantor }}</span></span></button>
          <div class="row-actions"><button @click="download(q)" title="Baixar" :aria-label="'Baixar ' + q.title"><i class="mdi mdi-download" aria-hidden="true" /></button><button @click="toggleFavorite(q)" class="favorite" :class="{ active: isFavorite(favoriteId(q)) }" :aria-pressed="!!isFavorite(favoriteId(q))" :aria-label="'Favoritar ' + q.title" title="Favoritar"><i :class="isFavorite(favoriteId(q)) ? 'mdi mdi-heart' : 'mdi mdi-heart-outline'" aria-hidden="true" /></button><button @click="remove(i)" title="Remover da Fila" :aria-label="'Remover ' + q.title + ' da fila'"><i class="mdi mdi-close" aria-hidden="true" /></button></div>
        </div>
      </div>
      <div v-else class="empty list"><i class="mdi mdi-music-note-plus" aria-hidden="true" /><h4>Sua próxima música começa aqui</h4><p>Adicione músicas pelo catálogo ou pelas pastas para montar sua fila.</p></div>
    </section>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { useUserStore } from "@/stores/userStore"
import { useToast } from "vue-toast-notification"
import JSZip from "jszip"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "@/firebase"

import { saveTrackOffline, downloadTrack, downloadBlob, favoriteId } from '@/services/downloads'
import { getTrackBlob, OFFLINE_EVENT, listOffline } from '@/services/offline'
import { trackKey } from '@/utils/media'

const player = usePlayerStore()
const userStore = useUserStore()
const toast = useToast()

const showQueue = ref(false)
const isExpanded = ref(false)
const expandTrigger = ref(null)
const mobileQuery = window.matchMedia('(max-width: 900px), (max-height: 550px) and (pointer: coarse)')
const isMobile = ref(mobileQuery.matches)
const lastAudibleVolume = ref(player.volume || 1)
const clock = ref(Date.now())
watch(() => player.volume, value => { if (value > 0) lastAudibleVolume.value = value })
const progressPercent = computed(() => duration.value > 0 ? Math.max(0,Math.min(100,position.value / duration.value * 100)) : 0)
const timerLabel = computed(() => Math.max(0,Math.ceil((player.sleepAt - clock.value - 999) / 60000)) + ' min')
const current = computed(() => player.current)
const playbackStatus = computed(() => player.error ? 'Confira a reprodução' : player.loading ? 'Preparando sua música' : player.isPlaying ? 'Tocando agora' : 'Pronta para ouvir')

const duration = ref(0)
const position = ref(0)
let raf = null

const durationText = computed(() => toTime(duration.value))
const currentTimeText = computed(() => toTime(position.value))

function loop() {
  clock.value = Math.floor(Date.now() / 1000) * 1000
  if (player.sound) {
    try {
      duration.value = Math.floor(player.sound.duration() || 0)
      position.value = Math.floor(player.sound.seek() || 0)
    } catch {}
  }
  raf = requestAnimationFrame(loop)
}

function toTime(s) {
  const m = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, "0")
  return `${m}:${ss}`
}

function toggle() {
  if (!userStore.hasActiveSubscription)
    return toast.warning("Ative sua assinatura 🎶")
  player.togglePlay()
}
function prev() {
  userStore.hasActiveSubscription
    ? player.prev()
    : toast.warning("Ative sua assinatura 🎶")
}
function next() {
  userStore.hasActiveSubscription
    ? player.next()
    : toast.warning("Ative sua assinatura 🎶")
}

function onSeek(e) {
  player.seekTo(Number(e.target.value))
}
function onVol(e) {
  player.setVolume(Number(e.target.value))
}

function toggleQueue() {
  showQueue.value = !showQueue.value
}

function playAt(i) {
  if (!userStore.hasActiveSubscription)
    return toast.warning("Ative sua assinatura 🎶")
  player.play(i)
}
function remove(i) {
  player.removeFromQueue(i)
}
function clearQueue() {
  player.clearQueue()
}

const savingOffline=ref(false), offlineKeys=ref(new Set())
const savedCurrent=computed(()=>current.value && offlineKeys.value.has(trackKey(current.value)))
async function refreshOffline(){const uid=userStore.user?.uid;const records=await listOffline(uid).catch(()=>[]);if(uid===userStore.user?.uid)offlineKeys.value=new Set(records.map(r=>trackKey(r.track)))}
async function saveCurrent(){if(!userStore.hasActiveSubscription)return toast.warning('Ative sua assinatura');if(!current.value || savingOffline.value)return;savingOffline.value=true;try{await saveTrackOffline(userStore.user.uid,current.value);toast.success('Música salva neste aparelho. Abra Offline para ouvir sem internet.')}catch(e){toast.error(e.message)}finally{savingOffline.value=false}}
async function download(m){if(!userStore.hasActiveSubscription)return toast.warning('Assinatura necessária');try{await downloadTrack(userStore.user?.uid,m)}catch(e){toast.error(e.message)}}
async function downloadAllZip(){if(!userStore.hasActiveSubscription)return toast.warning('Assinatura necessária');const zip=new JSZip(),seen=new Set();try{let index=0;for(const m of player.queue){const key=trackKey(m);if(seen.has(key))continue;seen.add(key);zip.file(`${++index}-${m.fileName || m.title+'.mp3'}`,await getTrackBlob(userStore.user?.uid,m))}downloadBlob(await zip.generateAsync({type:'blob'}),'FilaMusicas.zip')}catch(e){toast.error(e.message)}}
watch(()=>userStore.user?.uid,(uid,previous)=>{if(uid!==previous){player.restore(uid);lastAudibleVolume.value=player.volume || 1;refreshOffline()}},{immediate:true})
watch(()=>userStore.hasActiveSubscription,active=>{if(!active && player.isPlaying)player.sound?.pause()})

function isFavorite(id) {
  return userStore.user?.favorites?.some(value => (typeof value === 'object' ? favoriteId(value) : value) === id)
}

async function toggleFavorite(m) {
  if (!userStore.user)
    return toast.warning("Faça login para favoritar ⭐")

  const refUser = doc(db, "users", userStore.user.uid)
  const id = favoriteId(m)
  if (!Array.isArray(userStore.user.favorites)) userStore.user.favorites = []

  if (isFavorite(id)) {
    const saved = userStore.user.favorites.find(value => (typeof value === "object" ? favoriteId(value) : value) === id)
    await updateDoc(refUser, { favorites: arrayRemove(saved) })
} else {
    await updateDoc(refUser, { favorites: arrayUnion(id) })
}
}

function handleExpandClick() {
  if (!isMobile.value) return
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) nextTick(() => expandTrigger.value?.focus())
}
function collapsePlayer() {
  if (!isExpanded.value) return
  isExpanded.value = false
  nextTick(() => expandTrigger.value?.focus())
}
function viewportChange(event) { isMobile.value = event.matches; if (!event.matches) isExpanded.value = false }
function toggleMute() {
  if (player.volume > 0) { lastAudibleVolume.value = player.volume; player.setVolume(0) }
  else player.setVolume(lastAudibleVolume.value || 1)
}
function setTimer(minutes) {
  player.setSleepTimer(minutes)
  toast.info(minutes ? `A música vai pausar em ${minutes} minutos.` : 'Temporizador desativado.')
}

onMounted(() => { raf = requestAnimationFrame(loop); window.addEventListener(OFFLINE_EVENT,refreshOffline); mobileQuery.addEventListener('change',viewportChange) })
onBeforeUnmount(() => { if(raf)cancelAnimationFrame(raf);window.removeEventListener(OFFLINE_EVENT,refreshOffline);mobileQuery.removeEventListener('change',viewportChange) })
</script>

<style scoped>
.player-container {
  --accent: #83efbc; --accent-soft: #b4f5d5; --text: #f1f7f3; --muted: #a6b9b0; --line: #c3efda18;
  position: fixed; z-index: 10000; bottom: 16px; left: 50%; transform: translateX(-50%); width: calc(100% - 32px); max-width: 1600px;
  display: grid; grid-template-columns: minmax(180px,1fr) minmax(210px,1.15fr) minmax(280px,1.05fr); align-items: center; gap: 24px;
  padding: 14px 20px; min-height: 108px; border: 1px solid #8db69e30; border-radius: 24px;
  background: radial-gradient(ellipse at 0% 0%,#365b4760,transparent 45%),linear-gradient(120deg,#14221af5,#101a16f5 60%,#16281ff5);
  color: var(--text); box-shadow: 0 16px 50px #0008,0 1px 0 #ffffff08 inset; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  font-family: inherit; isolation: isolate;
}
.player-container::before { content: ''; pointer-events: none; position: absolute; inset: -1px; border-radius: inherit; border: 1px solid #83efbc00; transition: border-color .5s,box-shadow .5s; }
:global(.repertorio-app:has(.player-container) .v-application__wrap) { padding-bottom: 140px; }
.player-container.has-error .now-label { color: #ffb0b6; }.player-container.has-error .status-dot { background: #ffb0b6; animation: none; }
.player-container.is-playing::before { border-color: #83efbc30; box-shadow: 0 0 22px #83efbc08; }
.player-container button { font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.player-container button:disabled { cursor: default; opacity: .5; }
.player-container button:focus-visible,.track-info:focus-visible,.styled-slider:focus-visible,.queue-dialog button:focus-visible { outline: 2px solid var(--accent,#83efbc); outline-offset: 4px; }
.left-section { display: flex; align-items: center; gap: 14px; min-width: 0; }
.thumb { width: 64px; height: 64px; position: relative; overflow: hidden; flex-shrink: 0; border-radius: 16px; background: #233c30; border: 1px solid #ffffff18; box-shadow: 0 8px 22px #0005; }
.cover { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 1.5s ease; }
.is-playing .cover { transform: scale(1.04); }
.artwork-shade,.playback-badge { display: none; }
.info-group { display: flex; flex: 1; align-items: center; gap: 8px; min-width: 0; }
.track-info { min-width: 0; flex: 1; outline: none; }
.now-label { display: flex; align-items: center; gap: 6px; min-height: 15px; margin-bottom: 5px; font-size: 10px; font-weight: 600; color: var(--muted); white-space: nowrap; }
.status-dot { display: inline-block; width: 5px; height: 5px; flex-shrink: 0; border-radius: 50%; background: #71887b; }
.is-playing .now-label .status-dot { background: var(--accent); box-shadow: 0 0 0 3px #83efbc15; animation: status-breathe 2s ease-in-out infinite; }
.offline-badge { display: inline-flex; align-items: center; gap: 3px; color: var(--accent); margin-left: 2px; font-size: 9px; }
.title { color: var(--text); font-size: 14px; font-weight: 700; line-height: 1.35; letter-spacing: -.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.artist { color: var(--muted); margin-top: 3px; font-size: 11px; line-height: 1.35; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.expand-hint { display: none; }
.playback-error { color: #ffb0b6; font-size: 11px; line-height: 1.4; margin-top: 5px; max-height: 48px; overflow: auto; }
.btn-icon { background: transparent; border: 0; color: var(--muted); display: inline-flex; justify-content: center; align-items: center; min-width: 44px; min-height: 44px; border-radius: 13px; transition: color .2s,background .2s,transform .2s; }
.btn-icon i { font-size: 22px; line-height: 1; }
.favorite.active { color: var(--accent); }
.favorite.active i { animation: favorite-pop .3s ease-out; }
.center-section { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; }
.controls { display: flex; justify-content: center; align-items: center; gap: 16px; }
.previous-control,.next-control { border-radius: 50%; }
.previous-control i,.next-control i { font-size: 25px; }
.btn-play { display: grid; place-items: center; width: 48px; height: 48px; flex-shrink: 0; padding: 0; border: 0; border-radius: 50%; color: #0c2216; background: linear-gradient(145deg,#c4f7db,var(--accent)); box-shadow: 0 4px 18px #83efbc18,0 1px 0 #ffffff80 inset; transition: transform .2s,box-shadow .3s; }
.btn-play i { font-size: 27px; line-height: 1; }
.is-playing .btn-play { box-shadow: 0 0 0 5px #83efbc08,0 4px 18px #83efbc20; }
.loading-icon { animation: loading-turn .9s linear infinite; }
.progress-container { display: flex; align-items: center; gap: 9px; width: 100%; }
.time { font-size: 10px; font-variant-numeric: tabular-nums; color: #a9bdb1; min-width: 30px; text-align: center; }
.slider-wrapper { flex: 1; min-width: 0; display: flex; align-items: center; }
.styled-slider { --range-progress: 0%; -webkit-appearance: none; appearance: none; width: 100%; min-width: 0; height: 28px; padding: 0; border: 0; border-radius: 12px; background: transparent; cursor: pointer; touch-action: pan-y; }
.styled-slider:disabled { opacity: .4; cursor: default; }
.styled-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 10px; background: linear-gradient(to right,var(--accent) 0%,var(--accent) var(--range-progress),#ffffff20 var(--range-progress),#ffffff20 100%); }
.styled-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; border-radius: 50%; margin-top: -4px; background: #dcfbe9; border: 2px solid #f6fff9; box-shadow: 0 0 10px #83efbc35; transition: transform .15s; }
.styled-slider::-moz-range-track { height: 4px; border-radius: 10px; background: #ffffff20; }
.styled-slider::-moz-range-progress { height: 4px; border-radius: 10px; background: var(--accent); }
.styled-slider::-moz-range-thumb { width: 9px; height: 9px; border-radius: 50%; background: #dcfbe9; border: 2px solid #f6fff9; }
.right-section { display: grid; gap: 4px; align-items: center; min-width: 0; }
.player-actions { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 4px; }
.action-control { flex-direction: column; gap: 4px; padding: 5px 2px; min-height: 48px; border: 1px solid transparent; }
.action-control > span:last-child { font-size: 9px; font-weight: 550; line-height: 1.2; white-space: nowrap; }
.action-control i { font-size: 20px; }
.save-offline-control.is-saved { color: var(--accent); }
.equalizer-control.eq-active { position: relative; }.equalizer-control.eq-active::after { content: ''; position: absolute; top: 6px; right: 8px; width: 4px; height: 4px; border-radius: 50%; background: var(--accent); opacity: .8; }
.action-icon { position: relative; display: flex; align-items: center; }
.badge { position: absolute; top: -5px; right: -12px; min-width: 15px; height: 15px; padding: 0 4px; display: grid; place-items: center; border-radius: 10px; background: #2f5840; border: 1px solid #507c60; color: #c8f5d8; font-size: 8px; }
.timer-control.timer-active { color: var(--accent); background: #83efbc0e; border-color: #83efbc22; }
.volume-control { display: flex; align-items: center; gap: 8px; min-width: 0; min-height: 32px; }
.mute-control { min-width: 32px; min-height: 32px; border-radius: 9px; }
.mute-control i { font-size: 18px; }
.volume-caption { color: #8ca394; font-size: 10px; }
.volume-value { color: #cfeada; min-width: 36px; text-align: right; font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; }
.volume-value small { margin-left: 1px; font-size: 9px; color: #93aa9c; }
.mobile-header,.mini-progress { display: none; }
.activity-bars { display: inline-flex; align-items: center; justify-content: center; gap: 3px; height: 17px; }
.activity-bars b { display: block; width: 3px; height: 12px; border-radius: 3px; background: #a9f6c9; transform: scaleY(.3); transform-origin: center; }
.is-playing .activity-bars b,.playing-overlay .activity-bars:not(.paused) b { animation: music-activity .9s ease-in-out infinite alternate; }
.activity-bars b:nth-child(2) { animation-delay: -.65s!important; }.activity-bars b:nth-child(3) { animation-delay: -.2s!important; }.activity-bars b:nth-child(4) { animation-delay: -.45s!important; }
.sleep-menu { padding: 12px!important; border: 1px solid #668b733d; border-radius: 18px!important; background: #14261c!important; color: #e5f6eb!important; min-width: 265px; box-shadow: 0 12px 40px #0007; }
.sleep-heading { display: flex; align-items: center; gap: 12px; padding: 8px 8px 12px; border-bottom: 1px solid #ffffff10; margin-bottom: 8px; }.sleep-heading>i { font-size: 24px; color: #83efbc; }.sleep-heading strong { font-size: 14px; }.sleep-heading p { font-size: 11px; color: #a6b9b0; margin: 4px 0 0; }.sleep-menu :deep(.v-list-item) { min-height: 44px; border-radius: 10px; }.sleep-menu :deep(.v-list-item-title) { font-size: 13px; }
.queue-dialog { --accent: #83efbc; color: #edf8f1; width: 100%; display: flex; flex-direction: column; max-height: min(80dvh,720px); background: linear-gradient(145deg,#1a3023,#101b15 65%); border: 1px solid #668b733d; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px #0008; }
.modal-head { padding: 24px 24px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0; }
.head-left { display: flex; gap: 12px; align-items: center; min-width: 0; }.queue-mark { display: grid; place-items: center; width: 46px; height: 46px; flex-shrink: 0; border: 1px solid #83efbc35; background: #83efbc12; border-radius: 14px; color: #83efbc; font-size: 25px; }.section-kicker { font-size: 9px; letter-spacing: .13em; color: #83efbc; }.head-left h3 { font-size: 20px; line-height: 1.3; font-weight: 650; letter-spacing: -.03em; }.head-left p { margin: 5px 0 0; font-size: 11px; color: #9ab4a4; }.close-queue-btn { --muted: #cce1d4; background: #ffffff08; }
.queue-toolbar { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 24px 12px; padding: 13px 0; border-top: 1px solid #ffffff12; border-bottom: 1px solid #ffffff12; }.queue-toolbar>span { display: flex; gap: 7px; align-items: center; font-size: 10px; color: #b0cab9; }.queue-toolbar .status-dot { background: #83efbc; }.actions { display: flex; gap: 8px; align-items: center; }.actions button { font: inherit; cursor: pointer; }.btn-clean { background: transparent; border: 0; color: #aabfb1; font-size: 11px!important; padding: 9px; min-height: 40px; border-radius: 10px; }.btn-pill { display: flex; align-items: center; justify-content: center; gap: 7px; border: 1px solid #83efbc30; background: #83efbc18; color: #b4f5d5; padding: 9px 12px; border-radius: 11px; min-height: 40px; font-size: 11px!important; font-weight: 650!important; }.btn-pill>i { font-size: 18px; }.actions button:disabled { opacity: .4; cursor: default; }
.list { flex: 1; overflow-y: auto; min-height: 80px; padding: 0 16px 16px; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: #345940 transparent; }
.row { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border: 1px solid transparent; border-radius: 15px; transition: background .2s,border-color .2s; }.row+.row { margin-top: 4px; }.row.active { background: #83efbc0b; border-color: #83efbc22; }.meta { display: flex; align-items: center; gap: 12px; background: transparent; border: 0; color: inherit; text-align: left; padding: 0; min-width: 0; flex: 1; min-height: 48px; cursor: pointer; border-radius: 8px; }.row-number { min-width: 18px; font-size: 10px; color: #708e7a; font-variant-numeric: tabular-nums; }.mini { position: relative; display: block; width: 46px; height: 46px; flex-shrink: 0; border-radius: 11px; overflow: hidden; }.mini img { width: 100%; height: 100%; object-fit: cover; }.playing-overlay { position: absolute; inset: 0; background: #07180dad; display: grid; place-items: center; }.text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }.rt { color: #dfefe5; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }.row.active .rt { color: #aaf1c7; }.ra { font-size: 11px; color: #8faa98; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }.row-actions { display: flex; align-items: center; gap: 3px; }.row-actions button { border: 0; background: transparent; color: #92ad9c; min-width: 36px; min-height: 40px; display: grid; place-items: center; border-radius: 10px; cursor: pointer; font-size: 18px; transition: background .2s,color .2s; }.row-actions .favorite.active { color: #83efbc; }.empty { display: flex; flex-direction: column; gap: 12px; align-items: center; justify-content: center; padding: 36px 24px; text-align: center; }.empty>i { font-size: 42px; color: #83efbc; }.empty h4 { font-size: 16px; font-weight: 600; }.empty p { max-width: 280px; color: #9ab4a4; font-size: 12px; line-height: 1.6; }
.player-reveal-enter-active,.player-reveal-leave-active { transition: opacity .25s,translate .25s; }.player-reveal-enter-from,.player-reveal-leave-to { opacity: 0; translate: 0 12px; }.track-change-enter-active,.track-change-leave-active { transition: opacity .13s,transform .13s; }.track-change-enter-from { opacity: 0; transform: translateY(4px); }.track-change-leave-to { opacity: 0; transform: translateY(-4px); }
@keyframes player-expand { from { opacity: .5; translate: 0 10px; } to { opacity: 1; translate: 0 0; } }
@keyframes status-breathe { 50% { opacity: .6; } }@keyframes music-activity { from { transform: scaleY(.3); } to { transform: scaleY(1); } }@keyframes favorite-pop { 45% { transform: scale(1.2); } }@keyframes loading-turn { to { transform: rotate(360deg); } }
@media(hover:hover) { .btn-icon:hover { color: #e6f7eb; background: #ffffff08; transform: translateY(-1px); }.action-control:hover { border-color: #83efbc25; background: #83efbc0c; }.btn-play:hover { transform: scale(1.05); box-shadow: 0 0 0 6px #83efbc0d,0 5px 20px #83efbc25; }.favorite:hover { color: var(--accent); }.styled-slider:hover::-webkit-slider-thumb { transform: scale(1.18); }.row:hover { background: #ffffff04; }.row-actions button:hover { color: #dbf7e6; background: #ffffff08; } }
.btn-icon:active,.btn-play:active { transform: scale(.94); }
@media(min-width:901px) and (max-width:1100px) { .player-container { gap: 14px; padding: 12px 16px; grid-template-columns: minmax(150px,1fr) minmax(180px,1.1fr) minmax(258px,1.2fr); }.left-section { gap: 10px; }.thumb { width: 52px; height: 52px; border-radius: 12px; }.info-group { gap: 0; }.info-group .favorite { min-width: 32px; }.offline-badge { display: none; }.action-control>span:last-child { font-size: 8px; } }
@media(max-width:900px),(max-height:550px) and (pointer:coarse) {
  :global(.repertorio-app:has(.player-container) .v-application__wrap) { padding-bottom: calc(108px + env(safe-area-inset-bottom)); }
  .player-container { left: 10px; right: 10px; bottom: max(10px,env(safe-area-inset-bottom)); transform: none; width: auto; min-height: 78px; padding: 10px 12px 12px; display: flex; gap: 10px; border-radius: 20px; }
  .mini-progress { display: block; position: absolute; left: 18px; right: 18px; bottom: 5px; height: 2px; border-radius: 3px; overflow: hidden; background: #ffffff0b; }.mini-progress span { display: block; width: var(--track-progress); height: 100%; background: var(--accent); border-radius: inherit; transition: width .4s linear; }
  .left-section { flex: 1; gap: 10px; min-width: 0; }.thumb { width: 46px; height: 46px; border-radius: 12px; }.info-group { min-width: 0; }.info-group>.favorite { display: none; }.now-label { margin-bottom: 3px; min-height: 0; font-size: 8px; }.offline-badge { display: none; }.title { font-size: 12px; }.artist { font-size: 10px; margin-top: 2px; }.expand-hint { display: inline-flex; gap: 4px; align-items: center; font-size: 8px; color: #718f7e; margin-top: 3px; }.track-info[role=button] { cursor: pointer; border-radius: 5px; }.center-section { width: auto; flex-shrink: 0; }.controls { gap: 2px; }.previous-control,.progress-container,.right-section { display: none; }.next-control { min-width: 34px; min-height: 44px; }.next-control i { font-size: 22px; }.btn-play { width: 44px; height: 44px; }.btn-play i { font-size: 25px; }.playback-error { font-size: 10px; max-height: 28px; }
  .player-container.expanded { left: 0; right: 0; bottom: 0; top: 0; width: 100%; max-width: none; height: 100dvh; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; border: 0; border-radius: 0; display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 16px; padding: max(16px,env(safe-area-inset-top)) 24px max(22px,env(safe-area-inset-bottom)); background: radial-gradient(ellipse at 50% 12%,#2e65474f,transparent 58%),radial-gradient(ellipse at 100% 70%,#26403a29,transparent 50%),#0d1813; backdrop-filter: none; -webkit-backdrop-filter: none; }
  .player-container.expanded { animation: player-expand .28s ease-out; }.expanded::before { display: none; }.expanded .mini-progress { display: none; }.mobile-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; max-width: 440px; flex-shrink: 0; }.mobile-header .btn-icon { background: #ffffff07; border: 1px solid #ffffff0a; }.mobile-header-title { text-align: center; min-width: 0; }.mobile-header-title>span { display: block; font-size: 8px; letter-spacing: .22em; color: #7fac93; margin-bottom: 4px; }.mobile-header-title strong { display: block; font-size: 11px; font-weight: 550; color: #d1e6d8; }
  .expanded .left-section { flex: none; width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 18px; }
  .expanded .thumb { width: clamp(108px,calc(100dvh - 480px),300px); height: auto; aspect-ratio: 1; max-width: 100%; border-radius: 25px; border: 1px solid #ffffff20; box-shadow: 0 25px 55px #0007,0 0 50px #67cd9220; }
  .expanded .artwork-shade { display: block; position: absolute; inset: 0; background: linear-gradient(transparent 60%,#071b0b90); }.expanded .playback-badge { display: flex; align-items: center; gap: 8px; position: absolute; bottom: 12px; left: 12px; padding: 7px 10px; border: 1px solid #ffffff20; border-radius: 10px; background: #0a1d16b3; backdrop-filter: blur(12px); color: #c8f8dd; font-size: 9px; }
  .expanded .info-group { width: 100%; gap: 12px; align-items: center; }.expanded .info-group>.favorite { display: inline-flex; background: #83efbc08; border: 1px solid #83efbc14; width: 44px; min-width: 44px; height: 44px; border-radius: 50%; }.expanded .now-label { font-size: 9px; margin-bottom: 6px; }.expanded .offline-badge { display: inline-flex; font-size: 8px; }.expanded .title { font-size: clamp(19px,5.8vw,25px); font-weight: 650; line-height: 1.2; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }.expanded .artist { margin-top: 6px; font-size: 12px; }.expanded .expand-hint { display: none; }.expanded .playback-error { font-size: 11px; max-height: 45px; }
  .expanded .center-section { width: 100%; max-width: 400px; display: flex; flex-direction: column-reverse; gap: 8px; flex-shrink: 0; }.expanded .progress-container { display: flex; gap: 10px; }.expanded .time { font-size: 10px; }.expanded .styled-slider { height: 32px; }.expanded .styled-slider::-webkit-slider-thumb { width: 14px; height: 14px; margin-top: -5px; }.expanded .controls { width: 100%; gap: 32px; }.expanded .previous-control { display: inline-flex; }.expanded .previous-control,.expanded .next-control { min-width: 48px; min-height: 48px; background: #ffffff03; border: 1px solid #ffffff06; }.expanded .previous-control i,.expanded .next-control i { font-size: 30px; }.expanded .btn-play { width: 64px; height: 64px; }.expanded .btn-play i { font-size: 34px; }
  .expanded .right-section { display: grid; width: 100%; max-width: 400px; gap: 12px; flex-shrink: 0; }.expanded .player-actions { gap: 6px; }.expanded .action-control { min-height: 54px; padding: 6px 2px; background: #ffffff04; border: 1px solid #ffffff0b; border-radius: 13px; gap: 7px; }.expanded .action-control i { font-size: 21px; }.expanded .action-control>span:last-child { font-size: 9px; }.expanded .action-control.is-saved { background: #83efbc0a; border-color: #83efbc26; }.expanded .volume-control { padding: 3px 8px 3px 2px; min-height: 44px; gap: 9px; border-radius: 13px; background: #ffffff03; }.expanded .mute-control { min-width: 40px; min-height: 38px; }.expanded .mute-control i { font-size: 21px; }.expanded .volume-caption { font-size: 10px; }.expanded .volume-value { font-size: 12px; min-width: 37px; }
}
@media(max-width:360px) { .player-container { left: 8px; right: 8px; gap: 8px; padding-inline: 10px; }.player-container:not(.expanded) .now-label { font-size: 7px; }.player-container:not(.expanded) .thumb { width: 40px; height: 40px; }.player-container:not(.expanded) .next-control { min-width: 30px; }.expanded.player-container { padding-inline: 18px; }.expanded .player-actions { gap: 4px; }.expanded .action-control>span:last-child { font-size: 8px; } }
@media(max-width:900px) and (max-height:680px) { .expanded.player-container { gap: 9px; padding-top: max(10px,env(safe-area-inset-top)); padding-bottom: max(16px,env(safe-area-inset-bottom)); }.expanded .thumb { width: clamp(108px,calc(100dvh - 390px),210px); border-radius: 20px; }.expanded .left-section { gap: 12px; }.expanded .title { font-size: 19px; }.expanded .now-label { margin-bottom: 4px; }.expanded .artist { font-size: 11px; margin-top: 4px; }.expanded .btn-play { width: 54px; height: 54px; }.expanded .btn-play i { font-size: 30px; }.expanded .center-section { gap: 4px; }.expanded .styled-slider { height: 28px; }.expanded .right-section { gap: 6px; }.expanded .action-control { min-height: 48px; gap: 5px; }.expanded .volume-control { min-height: 40px; }.expanded .playback-badge { font-size: 8px; padding: 5px 8px; }.expanded .playback-badge .activity-bars { height: 14px; } }
@media(min-width:600px) and (max-height:550px) {
  .player-container.expanded { display: grid; grid-template-columns: minmax(140px,.8fr) minmax(260px,1.2fr); grid-template-rows: 36px auto auto auto; gap: 7px 28px; padding: max(10px,env(safe-area-inset-top)) max(24px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(24px,env(safe-area-inset-left)); align-content: center; justify-content: center; align-items: center; }
  .expanded .mobile-header { grid-column: 1/-1; max-width: none; }.expanded .mobile-header .btn-icon { min-height: 36px; }.expanded .left-section { display: contents; }.expanded .thumb { grid-column: 1; grid-row: 2/5; width: min(100%,calc(100dvh - 100px)); max-height: calc(100dvh - 100px); justify-self: center; border-radius: 20px; }.expanded .info-group { grid-column: 2; grid-row: 2; max-width: none; }.expanded .title { font-size: 19px; }.expanded .now-label { margin-bottom: 3px; }.expanded .artist { margin-top: 3px; font-size: 10px; }.expanded .center-section { grid-column: 2; grid-row: 3; max-width: none; gap: 2px; }.expanded .controls { gap: 25px; }.expanded .btn-play { width: 48px; height: 48px; }.expanded .btn-play i { font-size: 28px; }.expanded .previous-control,.expanded .next-control { min-height: 42px; }.expanded .styled-slider { height: 24px; }.expanded .right-section { grid-column: 2; grid-row: 4; max-width: none; gap: 3px; }.expanded .action-control { min-height: 44px; gap: 3px; }.expanded .action-control i { font-size: 18px; }.expanded .action-control>span:last-child { font-size: 8px; }.expanded .volume-control { min-height: 36px; }.expanded .mute-control { min-height: 32px; }.expanded .playback-badge { font-size: 8px; }
}
@media(max-width:600px) { .queue-dialog { border-radius: 20px; max-height: 88dvh; }.modal-head { padding: 20px 16px 15px; gap: 8px; }.head-left { gap: 9px; }.queue-mark { width: 37px; height: 40px; font-size: 22px; border-radius: 11px; }.section-kicker { font-size: 7px; }.head-left h3 { font-size: 17px; }.head-left p { font-size: 10px; }.queue-toolbar { margin-inline: 16px; flex-wrap: wrap; }.queue-toolbar>span { width: 100%; }.actions { width: 100%; justify-content: flex-end; }.actions button { min-height: 44px; }.list { padding: 0 8px 12px; }.row { gap: 5px; padding: 6px 4px; }.meta { gap: 8px; }.row-number { display: none; }.mini { width: 38px; height: 38px; border-radius: 10px; }.rt { font-size: 11px; }.ra { font-size: 9px; }.row-actions { gap: 0; }.row-actions button { min-width: 36px; min-height: 44px; font-size: 17px; } }
@media(prefers-reduced-motion:reduce) { .player-container,.player-container *,.queue-dialog * { animation: none!important; transition: none!important; }.player-container.is-playing .cover { transform: none; }.player-reveal-enter-active,.player-reveal-leave-active,.track-change-enter-active,.track-change-leave-active { transition: none!important; } }
</style>
