<template>
  <div
    v-if="current"
    class="player-container"
    :class="{ expanded: isExpanded }"
    @click="!isExpanded && handleExpandClick()"
  >
    <div class="mobile-header" v-if="isExpanded">
      <button class="btn-icon close-btn" @click.stop="handleExpandClick">
        <i class="mdi mdi-chevron-down"></i>
      </button>
      <span class="mobile-header-title">Tocando agora</span>
      <button class="btn-icon">
        <i class="mdi mdi-dots-vertical"></i>
      </button>
    </div>

    <div class="left-section">
      <div class="thumb">
        <img src="/LogoMusic.jpg" class="cover" alt="Capa" />
      </div>
      <div class="track-info">
        <div class="title">{{ current.title }}</div>
        <div class="artist">{{ current.cantor }}</div>
      </div>
      
      <button
        @click.stop="toggleFavorite(current)"
        class="btn-icon favorite"
        :class="{ active: isFavorite(current.id) }"
        title="Salvar na sua Biblioteca"
      >
        <i :class="isFavorite(current.id) ? 'mdi mdi-heart' : 'mdi mdi-heart-outline'"></i>
      </button>
    </div>

    <div class="center-section">
      <div class="controls">
        <button class="btn-icon secondary-control" @click.stop="download(current)" title="Baixar">
          <i class="mdi mdi-download-circle-outline"></i>
        </button>

        <button class="btn-icon" @click.stop="prev" title="Anterior">
          <i class="mdi mdi-skip-previous"></i>
        </button>

        <button class="btn-play" @click.stop="toggle" title="Play/Pause">
          <i v-if="player.isPlaying" class="mdi mdi-pause"></i>
          <i v-else class="mdi mdi-play"></i>
        </button>

        <button class="btn-icon" @click.stop="next" title="Próxima">
          <i class="mdi mdi-skip-next"></i>
        </button>

        <button class="btn-icon secondary-control mobile-queue-btn" @click.stop="toggleQueue" title="Fila de Reprodução">
          <i class="mdi mdi-playlist-play"></i>
        </button>
      </div>

      <div class="progress-container" @click.stop>
        <span class="time">{{ currentTimeText }}</span>
        <div class="slider-wrapper">
          <input
            type="range"
            min="0"
            :max="duration"
            :value="position"
            @input="onSeek"
            class="styled-slider"
          />
        </div>
        <span class="time">{{ durationText }}</span>
      </div>
    </div>

    <div class="right-section" @click.stop>
      <button class="btn-icon" @click.stop="toggleQueue" title="Fila de Reprodução">
        <i class="mdi mdi-playlist-play"></i>
        <span v-if="player.queue.length" class="badge">
          {{ player.queue.length }}
        </span>
      </button>

      <div class="volume-control">
        <i class="mdi mdi-volume-high icon-vol"></i>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="player.volume"
          @input="onVol"
          class="styled-slider vol-slider"
        />
      </div>
    </div>
  </div>

  <div v-if="showQueue" class="modal-overlay" @click.self="toggleQueue">
    <div class="modal">
      
      <div class="modal-head">
        <div class="head-left">
          <button class="btn-icon close-queue-btn" @click="toggleQueue" title="Fechar Fila">
            <i class="mdi mdi-close"></i>
          </button>
          <h3>Fila de Reprodução</h3>
        </div>
        <div class="actions">
          <button class="btn-clean danger" @click="clearQueue" title="Limpar Fila">
            Limpar
          </button>
          <button class="btn-pill primary" @click="downloadAllZip">
            Baixar tudo
          </button>
        </div>
      </div>

      <div v-if="player.queue.length" class="list">
        <div
          v-for="(q, i) in player.queue"
          :key="q.fileId || i"
          class="row"
          :class="{ active: i === player.currentIndex }"
        >
          <div class="meta" @click="playAt(i)">
            <div class="mini">
              <img src="/LogoMusic.jpg" />
              <div v-if="i === player.currentIndex" class="playing-overlay">
                <i class="mdi mdi-equalizer"></i>
              </div>
            </div>
            <div class="text">
              <div class="rt">{{ q.title }}</div>
              <div class="ra">{{ q.cantor }}</div>
            </div>
          </div>

          <div class="row-actions">
            <button @click="download(q)" title="Baixar">
              <i class="mdi mdi-download"></i>
            </button>
            <button
              @click="toggleFavorite(q)"
              class="favorite"
              :class="{ active: isFavorite(q.id) }"
              title="Favoritar"
            >
              <i :class="isFavorite(q.id) ? 'mdi mdi-heart' : 'mdi mdi-heart-outline'"></i>
            </button>
            <button @click="remove(i)" title="Remover da Fila">
              <i class="mdi mdi-close"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty list">
        <div class="empty-content">
          <i class="mdi mdi-music-off"></i>
          <p>Sua fila está vazia</p>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { useUserStore } from "@/stores/userStore"
import { useToast } from "vue-toast-notification"
import JSZip from "jszip"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "@/firebase"

const player = usePlayerStore()
const userStore = useUserStore()
const toast = useToast()

const showQueue = ref(false)
const isExpanded = ref(false)
const current = computed(() => player.current)

const duration = ref(0)
const position = ref(0)
let raf = null

const durationText = computed(() => toTime(duration.value))
const currentTimeText = computed(() => toTime(position.value))

// Quando o Howler (player.sound) for criado/trocado, registra o evento "end"
// para fazer loop automático ao chegar na última música da fila
watch(
  () => player.sound,
  (sound) => {
    if (!sound) return
    sound.on("end", () => {
      if (player.currentIndex >= player.queue.length - 1) {
        player.play(0)
      }
    })
  }
)

function loop() {
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

async function download(m) {
  if (!userStore.hasActiveSubscription)
    return toast.warning("Assinatura necessária")
  if (!m?.downloadUrl) return

  try {
    const res = await fetch(m.downloadUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = m.fileName || "musica.mp3"
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error("Erro ao baixar")
  }
}

async function downloadAllZip() {
  const zip = new JSZip()
  const seen = new Set()

  for (const m of player.queue) {
    if (seen.has(m.fileId) || !m.downloadUrl) continue
    seen.add(m.fileId)
    const res = await fetch(m.downloadUrl)
    zip.file(m.fileName || "musica.mp3", await res.blob())
  }

  const content = await zip.generateAsync({ type: "blob" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(content)
  a.download = "FilaMusicas.zip"
  a.click()
}

function isFavorite(id) {
  return userStore.user?.favorites?.includes(id)
}

async function toggleFavorite(m) {
  if (!userStore.user)
    return toast.warning("Faça login para favoritar ⭐")

  const refUser = doc(db, "users", userStore.user.uid)

  if (isFavorite(m.id)) {
    await updateDoc(refUser, { favorites: arrayRemove(m.id) })
    userStore.user.favorites =
      userStore.user.favorites.filter(f => f !== m.id)
  } else {
    await updateDoc(refUser, { favorites: arrayUnion(m.id) })
    userStore.user.favorites.push(m.id)
  }
}

function handleExpandClick() {
  if (window.innerWidth <= 768) {
    isExpanded.value = !isExpanded.value
  }
}

onMounted(() => (raf = requestAnimationFrame(loop)))
onBeforeUnmount(() => raf && cancelAnimationFrame(raf))
</script>

<style scoped>
/* =========================================
   VARIÁVEIS E BASE
========================================= */
:root {
  --spotify-base: #121212;
  --spotify-elevated: #181818;
  --spotify-highlight: #282828;
  --spotify-green: #1db954;
}

/* =========================================
   LAYOUT DESKTOP
========================================= */
.player-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 90px;
  background-color: var(--spotify-elevated, #181818);
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-top: 1px solid #282828;
  z-index: 10000;
  transition: all 0.4s cubic-bezier(0.3, 0, 0, 1);
}

.player-container.placeholder {
  justify-content: center;
  color: #b3b3b3;
  font-size: 14px;
}

.left-section {
  display: flex;
  align-items: center;
  width: 30%;
  min-width: 180px;
  gap: 14px;
}

.thumb {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.track-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.track-info .title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.track-info .title:hover { text-decoration: underline; }

.track-info .artist {
  font-size: 12px;
  color: #b3b3b3;
  margin-top: 2px;
  cursor: pointer;
}

.track-info .artist:hover { text-decoration: underline; color: #fff; }

.center-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40%;
  max-width: 722px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 8px;
}

.btn-icon {
  background: transparent;
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon i { font-size: 20px; }
.btn-icon:hover { color: #fff; }

.btn-play {
  background: #fff;
  border: none;
  color: #000;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s;
}

.btn-play i { font-size: 20px; }
.btn-play:hover { transform: scale(1.06); background: #f0f0f0; }

.favorite.active { color: #1db954; }

.progress-container {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.time {
  font-size: 11px;
  color: #b3b3b3;
  min-width: 35px;
  text-align: center;
}

.slider-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}

.styled-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: #4d4d4d;
  border-radius: 2px;
  outline: none;
  transition: background 0.3s;
  cursor: pointer;
}

.styled-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.player-container:hover .styled-slider::-webkit-slider-thumb { opacity: 1; }
.styled-slider:hover { background: #1db954; }

.right-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 30%;
  min-width: 180px;
  gap: 16px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100px;
}

.icon-vol { font-size: 18px; color: #b3b3b3; }
.vol-slider { width: 100%; }

.badge {
  position: absolute;
  top: -5px;
  right: -10px;
  background: #1db954;
  color: #fff;
  font-size: 10px;
  border-radius: 10px;
  padding: 2px 5px;
  font-weight: bold;
}
.right-section .btn-icon { position: relative; }

.mobile-header, .mobile-queue-btn { display: none; }


/* =========================================
   RESPONSIVO E MOBILE EXPANDIDO
========================================= */
@media (max-width: 768px) {
  
  .player-container {
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: #2a2a2a;
    padding: 0 10px;
    border-top: none;
    cursor: pointer;
  }

  .left-section { width: auto; flex: 1; gap: 10px; }
  .thumb { width: 40px; height: 40px; border-radius: 4px; }
  .track-info .title { font-size: 13px; }
  .center-section { width: auto; position: initial; }

  .center-section .progress-container,
  .center-section .controls .secondary-control,
  .center-section .controls .mdi-skip-previous,
  .center-section .controls .mdi-skip-next,
  .right-section {
    display: none;
  }

  .btn-play { background: transparent; color: #fff; width: auto; height: auto; }
  .btn-play i { font-size: 28px; }

  .player-container.expanded {
    bottom: 0; left: 0; right: 0; top: 0;
    height: 100dvh;
    border-radius: 0;
    background: linear-gradient(to bottom, #4a4a4a 0%, #121212 100%);
    flex-direction: column;
    justify-content: space-between;
    padding: 3vh 24px 6vh 24px;
    cursor: default;
    z-index: 9999;
    overflow-y: auto;
  }

  .mobile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 2vh;
  }
  .mobile-header-title { font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }

  .player-container.expanded .left-section {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 0;
    margin-bottom: 2vh;
  }

  .player-container.expanded .thumb {
    width: 100%;
    max-width: 350px;
    max-height: 45vh;
    height: auto;
    aspect-ratio: 1 / 1;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    margin: 0 auto 4vh auto;
  }

  .player-container.expanded .track-info { width: 100%; position: relative; }
  .player-container.expanded .track-info .title { font-size: 22px; font-weight: 700; white-space: normal; padding-right: 40px; }
  .player-container.expanded .track-info .artist { font-size: 16px; margin-top: 4px; }

  .player-container.expanded .favorite {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }
  .player-container.expanded .favorite i { font-size: 26px; }

  .player-container.expanded .center-section {
    width: 100%;
    display: flex;
    flex-direction: column-reverse;
    gap: 1.5vh;
  }

  .player-container.expanded .progress-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0;
  }
  .player-container.expanded .slider-wrapper { width: 100%; margin-bottom: 6px; }
  .player-container.expanded .styled-slider::-webkit-slider-thumb { opacity: 1; width: 14px; height: 14px; }

  .player-container.expanded .controls { width: 100%; justify-content: space-between; margin-bottom: 0; }
  .player-container.expanded .controls .secondary-control,
  .player-container.expanded .controls .mdi-skip-previous,
  .player-container.expanded .controls .mdi-skip-next { display: flex; }
  .player-container.expanded .btn-icon i { font-size: 28px; }

  .player-container.expanded .btn-play { width: 64px; height: 64px; background: #fff; color: #000; }
  .player-container.expanded .btn-play i { font-size: 32px; }
}


/* =========================================
   MODAL FILA (Design Aprimorado c/ Cabeçalho Fixo)
========================================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
}

.modal {
  background: #121212;
  width: min(650px, 100%);
  height: 85vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
  border: 1px solid #282828;
}

@media (max-width: 768px) {
  .modal {
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    border: none;
  }
}

.modal-head {
  background: #121212;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #282828;
  flex-shrink: 0;
  z-index: 10;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.close-queue-btn {
  font-size: 24px;
  color: #fff;
}
.close-queue-btn:hover { color: #1db954; }

.head-left h3 { 
  font-size: 18px; 
  font-weight: 700; 
  color: #fff; 
  letter-spacing: -0.5px;
}

.actions { display: flex; gap: 12px; align-items: center; }

.btn-clean {
  background: transparent; border: none; color: #b3b3b3; font-size: 12px; font-weight: 600; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;
}
.btn-clean:hover { color: #fff; text-decoration: underline; }

.btn-pill {
  background: #fff; color: #000; border: none; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; cursor: pointer; transition: transform 0.1s;
}
.btn-pill:hover { transform: scale(1.04); background: #f0f0f0; }

.list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 24px;
  display: flex; 
  flex-direction: column; 
  gap: 4px; 
}

.list::-webkit-scrollbar { width: 8px; }
.list::-webkit-scrollbar-track { background: transparent; }
.list::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
.list::-webkit-scrollbar-thumb:hover { background: #555; }

.row {
  background: transparent;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
  cursor: pointer;
}
.row:hover { background: rgba(255,255,255, 0.1); }
.row.active { background: transparent; }
.row.active .rt { color: #1db954; }

.meta { display: flex; gap: 14px; align-items: center; min-width: 0; flex: 1; }
.mini { position: relative; width: 44px; height: 44px; border-radius: 4px; overflow: hidden; flex-shrink: 0; background: #282828;}
.mini img { width: 100%; height: 100%; object-fit: cover; }

.playing-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
}
.playing-overlay i { color: #1db954; font-size: 20px; }

.text { min-width: 0; display: flex; flex-direction: column; }
.rt { font-size: 15px; font-weight: 400; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ra { font-size: 13px; color: #b3b3b3; margin-top: 2px;}

.row-actions { display: flex; gap: 16px; opacity: 0; transition: opacity 0.2s; align-items: center;}
.row:hover .row-actions { opacity: 1; }
@media (max-width: 768px) { .row-actions { opacity: 1; } }

.row-actions button { background: none; border: none; color: #b3b3b3; cursor: pointer; font-size: 20px; transition: color 0.2s;}
.row-actions button:hover { color: #fff; }
.favorite.active i { color: #1db954; }

.empty { display: flex; align-items: center; justify-content: center;}
.empty-content { text-align: center; color: #b3b3b3; }
.empty-content i { font-size: 56px; margin-bottom: 16px; opacity: 0.5; display: block;}
.empty-content p { font-size: 16px; font-weight: 600; }
</style>