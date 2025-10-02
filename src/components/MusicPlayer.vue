<template>
  <!-- Player -->
  <div
    v-if="current"
    class="player"
    :class="{ expanded: isExpanded }"
    @click="handleExpandClick"
  >
    <!-- Thumbnail e Info -->
    <div class="left">
      <div class="thumb">
        <img src="/LogoMusic.jpg" class="cover" />
      </div>
      <div class="info">
        <div class="t">{{ current.title }}</div>
        <div class="a">{{ current.cantor }}</div>
      </div>
    </div>

    <!-- Controles -->
    <div class="center">
      <div class="controls">
        <button @click.stop="prev"><BackwardIcon class="icon" /></button>
        <button @click.stop="toggle">
          <PauseIcon v-if="player.isPlaying" class="icon" />
          <PlayIcon v-else class="icon" />
        </button>
        <button @click.stop="next"><ForwardIcon class="icon" /></button>
        <!-- Favoritar música atual -->
        <button
          @click.stop="toggleFavorite(current)"
          class="favorite"
          :class="{ active: isFavorite(current.id) }"
          title="Favoritar"
        >
          <StarIcon class="icon" />
        </button>
      </div>

      <div class="bar">
        <span class="time">{{ currentTimeText }}</span>
        <input
          type="range"
          min="0"
          :max="duration"
          step="1"
          :value="position"
          @input="onSeek"
          class="seek"
        />
        <span class="time">{{ durationText }}</span>
      </div>
    </div>

    <!-- Volume e Fila -->
    <div class="right">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="player.volume"
        @input="onVol"
        class="vol"
      />
      <button @click.stop="toggleQueue">
        <QueueListIcon class="icon" />
        <span v-if="player.queue.length" class="badge">{{ player.queue.length }}</span>
      </button>
    </div>
  </div>

  <!-- Placeholder -->
  <div v-else class="player placeholder">
    <span>Selecione uma música para começar…</span>
  </div>

  <!-- Modal da Fila -->
  <div v-if="showQueue" class="modal-overlay" @click.self="toggleQueue">
    <div class="modal">
      <div class="modal-head">
        <h3>Fila de Reprodução</h3>
        <div class="actions">
          <button @click="clearQueue" class="clear">Limpar</button>
          <button @click="downloadAllZip" class="clear">Baixar Todas</button>
        </div>
      </div>

      <div v-if="player.queue.length" class="list">
        <div
          v-for="(q, i) in player.queue"
          :key="q.fileId || i"
          class="row"
          :class="{ active: i === player.currentIndex }"
        >
          <div class="meta">
            <div class="mini">
              <img src="/LogoMusic.jpg" class="cover" />
            </div>
            <div>
              <div class="rt">{{ q.title }}</div>
              <div class="ra">{{ q.cantor }}</div>
            </div>
          </div>
          <div class="row-actions">
            <button @click="playAt(i)"><PlayIcon class="icon" /></button>
            <button @click="remove(i)"><TrashIcon class="icon" /></button>
            <button @click="download(q)"><ArrowDownTrayIcon class="icon" /></button>
            <!-- Favoritar música da fila -->
            <button
              @click="toggleFavorite(q)"
              class="favorite"
              :class="{ active: isFavorite(q.id) }"
              title="Favoritar"
            >
              <StarIcon class="icon" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty">Fila vazia</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { useUserStore } from "@/stores/userStore"
import { useToast } from "vue-toast-notification"
import JSZip from "jszip"
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  QueueListIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  StarIcon,
} from "@heroicons/vue/24/solid"

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
  const ss = Math.floor(s % 60).toString().padStart(2, "0")
  return `${m}:${ss}`
}

function onSeek(e) {
  player.seekTo(Number(e.target.value))
}
function onVol(e) {
  player.setVolume(Number(e.target.value))
}

function toggle() {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Ative sua assinatura para usar o player 🎶")
    return
  }
  player.togglePlay()
}
function prev() {
  if (userStore.hasActiveSubscription) player.prev()
  else toast.warning("Ative sua assinatura para usar o player 🎶")
}
function next() {
  if (userStore.hasActiveSubscription) player.next()
  else toast.warning("Ative sua assinatura para usar o player 🎶")
}

function toggleQueue() {
  showQueue.value = !showQueue.value
}

function playAt(i) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Ative sua assinatura 🎶")
    return
  }
  player.play(i)
}
function remove(i) {
  player.removeFromQueue(i)
}
function clearQueue() {
  player.clearQueue()
}

function download(music) {
  if (!music.downloadUrl) return
  const a = document.createElement("a")
  a.href = music.downloadUrl
  a.download = music.fileName || "musica.mp3"
  a.click()
}

async function downloadAllZip() {
  if (!player.queue.length) return
  const zip = new JSZip()
  const seen = new Set()
  const uniqueTracks = player.queue.filter(t => {
    if (seen.has(t.fileId)) return false
    seen.add(t.fileId)
    return true
  })

  for (const track of uniqueTracks) {
    if (!track.downloadUrl) continue
    try {
      const res = await fetch(track.downloadUrl)
      const blob = await res.blob()
      zip.file(track.fileName || "musica.mp3", blob)
    } catch {}
  }
  const content = await zip.generateAsync({ type: "blob" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(content)
  a.download = "FilaMusicas.zip"
  a.click()
}

function handleExpandClick() {
  if (window.innerWidth <= 768) {
    isExpanded.value = !isExpanded.value
  }
}

/* ---------- FAVORITOS ---------- */
function isFavorite(musicId) {
  return userStore.user?.favorites?.includes(musicId)
}

async function toggleFavorite(m) {
  if (!userStore.user) {
    toast.warning("Você precisa estar logado para favoritar músicas ⭐")
    return
  }

  const userRef = doc(db, "users", userStore.user.uid)

  try {
    if (isFavorite(m.id)) {
      await updateDoc(userRef, { favorites: arrayRemove(m.id) })
      userStore.user.favorites = userStore.user.favorites.filter(id => id !== m.id)
      toast.success(`Removida dos favoritos: ${m.title}`)
    } else {
      await updateDoc(userRef, { favorites: arrayUnion(m.id) })
      userStore.user.favorites = [...(userStore.user.favorites || []), m.id]
      toast.success(`Adicionada aos favoritos: ${m.title}`)
    }
  } catch (err) {
    console.error("Erro ao atualizar favoritos:", err)
    toast.error("Não foi possível atualizar os favoritos.")
  }
}

onMounted(() => {
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
.player {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #181818;
  color: #fff;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #2a2a2a;
  z-index: 50;
  transition: all 0.3s ease;
}
.player.placeholder {
  justify-content: center;
  text-align: center;
  font-size: 14px;
}
.left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  background: #2a2a2a;
  flex-shrink: 0;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.info .t {
  font-weight: 600;
  font-size: 14px;
}
.info .a {
  font-size: 12px;
  color: #aaa;
}
.center {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}
.controls {
  display: flex;
  gap: 12px;
}
.controls button {
  background: #222;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
}
.controls button:hover {
  background: #333;
}
.icon {
  width: 20px;
  height: 20px;
}
.favorite.active .icon {
  color: #ffd700; /* estrela dourada */
}
.bar {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  gap: 6px;
  align-items: center;
  width: 100%;
}
.seek {
  width: 100%;
}
.time {
  font-size: 11px;
  color: #aaa;
  text-align: center;
}
.right {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}
.vol {
  width: 80px;
}
.badge {
  background: #1db954;
  color: #fff;
  font-size: 11px;
  border-radius: 8px;
  padding: 2px 6px;
  margin-left: 4px;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}
.modal {
  background: #202020;
  border-radius: 12px;
  padding: 16px;
  width: min(600px, 90%);
  max-height: 80vh;
  overflow-y: auto;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.actions {
  display: flex;
  gap: 8px;
}
.clear {
  background: #333;
  border: none;
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.clear:hover {
  background: #444;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2a2a2a;
  padding: 8px;
  border-radius: 8px;
}
.row.active {
  background: #1db95422;
}
.meta {
  display: flex;
  gap: 10px;
  align-items: center;
}
.mini {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #333;
  overflow: hidden;
  flex-shrink: 0;
}
.mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rt {
  font-size: 14px;
  font-weight: 600;
}
.ra {
  font-size: 12px;
  color: #aaa;
}
.row-actions {
  display: flex;
  gap: 6px;
}
.row-actions button {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
}
.empty {
  text-align: center;
  color: #aaa;
  padding: 16px;
}
@media (max-width: 768px) {
  .player {
    grid-template-columns: 1fr;
    padding: 8px;
  }
  .player.expanded {
    top: 0;
    height: 100vh;
    flex-direction: column;
    grid-template-columns: 1fr;
    align-items: center;
    justify-content: flex-start;
    padding: 20px;
    text-align: center;
  }
  .player.expanded .left {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 30px;
  }
  .player.expanded .thumb {
    width: 80%;
    max-width: 320px;
    height: auto;
    aspect-ratio: 1 / 1;
    margin: 0 auto;
  }
  .player.expanded .thumb img {
    border-radius: 12px;
  }
  .player.expanded .info {
    margin-top: 16px;
  }
  .player.expanded .info .t {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 6px;
  }
  .player.expanded .info .a {
    font-size: 14px;
    color: #bbb;
  }
  .player.expanded .center {
    width: 100%;
    margin-top: 30px;
    gap: 20px;
  }
  .player.expanded .controls {
    gap: 24px;
  }
  .player.expanded .bar {
    width: 90%;
    margin: 0 auto;
  }
  .player.expanded .right {
    width: 90%;
    margin: 20px auto 0;
    justify-content: center;
  }
  .vol {
    width: 100%;
  }
}
</style>
