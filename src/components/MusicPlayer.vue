<template>
  <!-- Player -->
  <div
    v-if="current"
    class="player"
    :class="{ expanded: isExpanded }"
    @click="handleExpandClick"
  >
    <!-- Left -->
    <div class="left">
      <div class="thumb">
        <img src="/LogoMusic.jpg" class="cover" />
      </div>
      <div class="info">
        <div class="t">{{ current.title }}</div>
        <div class="a">{{ current.cantor }}</div>
      </div>
    </div>

    <!-- Center -->
    <div class="center">
      <div class="controls">
        <button @click.stop="prev">
          <i class="mdi mdi-skip-previous icon"></i>
        </button>

        <button @click.stop="toggle">
          <i
            v-if="player.isPlaying"
            class="mdi mdi-pause-circle icon"
          ></i>
          <i
            v-else
            class="mdi mdi-play-circle icon"
          ></i>
        </button>

        <button @click.stop="next">
          <i class="mdi mdi-skip-next icon"></i>
        </button>

        <!-- DOWNLOAD CORRIGIDO -->
        <button @click.stop="download(current)">
          <i class="mdi mdi-download icon"></i>
        </button>

        <!-- FAVORITO -->
        <button
          @click.stop="toggleFavorite(current)"
          class="favorite"
          :class="{ active: isFavorite(current.id) }"
        >
          <i class="mdi mdi-star icon"></i>
        </button>
      </div>

      <div class="bar">
        <span class="time">{{ currentTimeText }}</span>
        <input
          type="range"
          min="0"
          :max="duration"
          :value="position"
          @input="onSeek"
          class="seek"
        />
        <span class="time">{{ durationText }}</span>
      </div>
    </div>

    <!-- Right -->
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
        <i class="mdi mdi-playlist-music icon"></i>
        <span v-if="player.queue.length" class="badge">
          {{ player.queue.length }}
        </span>
      </button>
    </div>
  </div>

  <!-- Placeholder -->
  <div v-else class="player placeholder">
    <span>Selecione uma música para começar…</span>
  </div>

  <!-- MODAL FILA -->
<div v-if="showQueue" class="modal-overlay" @click.self="toggleQueue">
  <div class="modal">
    <!-- HEADER -->
    <div class="modal-head">
      <div class="title">
        <i class="mdi mdi-playlist-music"></i>
        <h3>Fila de Reprodução</h3>
      </div>

      <div class="actions">
        <button class="btn danger" @click="clearQueue">
          <i class="mdi mdi-trash-can-outline"></i>
          Limpar
        </button>

        <button class="btn primary" @click="downloadAllZip">
          <i class="mdi mdi-download-multiple"></i>
          Baixar tudo
        </button>
      </div>
    </div>

    <!-- LISTA -->
    <div v-if="player.queue.length" class="list">
      <div
        v-for="(q, i) in player.queue"
        :key="q.fileId || i"
        class="row"
        :class="{ active: i === player.currentIndex }"
      >
        <div class="meta">
          <div class="mini">
            <img src="/LogoMusic.jpg" />
          </div>

          <div class="text">
            <div class="rt">{{ q.title }}</div>
            <div class="ra">{{ q.cantor }}</div>
          </div>
        </div>

        <div class="row-actions">
          <button @click="playAt(i)" title="Reproduzir">
            <i class="mdi mdi-play-circle-outline"></i>
          </button>

          <button @click="download(q)" title="Baixar">
            <i class="mdi mdi-download"></i>
          </button>

          <button
            @click="toggleFavorite(q)"
            class="favorite"
            :class="{ active: isFavorite(q.id) }"
            title="Favoritar"
          >
            <i class="mdi mdi-star"></i>
          </button>

          <button @click="remove(i)" title="Remover">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- EMPTY -->
    <div v-else class="empty">
      <i class="mdi mdi-music-off"></i>
      <p>Fila vazia</p>
    </div>
  </div>
</div>

</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
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
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.modal {
  background: #181818;
  width: min(720px, 95%);
  max-height: 85vh;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* HEADER */
.modal-head {
  position: sticky;
  top: 0;
  background: #202020;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2a2a2a;
  z-index: 2;
}
.modal-head .title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-head h3 {
  font-size: 16px;
  font-weight: 600;
}

.modal-head i {
  font-size: 22px;
  color: #1db954;
}
/* BOTÕES HEADER */
.actions {
  display: flex;
  gap: 8px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.btn i {
  font-size: 18px;
}

.btn.primary {
  background: #ffffff;
  color: #000;
}

.btn.primary:hover {
  filter: brightness(1.1);
}

.btn.danger {
  background: #2a2a2a;
  color: #ff6b6b;
}

.btn.danger:hover {
  background: #3a3a3a;
}

/* LISTA */
.list {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.row {
  background: #222;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s ease;
}

.row:hover {
  background: #2a2a2a;
}

.row.active {
  background: rgba(29, 185, 84, 0.15);
}

/* META */
.meta {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.mini {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.text {
  min-width: 0;
}

.rt {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ra {
  font-size: 12px;
  color: #aaa;
}

/* AÇÕES */
.row-actions {
  display: flex;
  gap: 6px;
}

.row-actions button {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
}

.row-actions button:hover {
  background: #333;
  color: #fff;
}

.favorite.active i {
  color: #ffd700;
}
/* EMPTY */
.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #aaa;
  gap: 8px;
}

.empty i {
  font-size: 40px;
  opacity: 0.6;
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
