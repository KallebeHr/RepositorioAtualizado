<template>
  <div class="player" v-if="current">
    <div class="left">
      <div class="thumb"></div>
      <div class="info">
        <div class="t">{{ current.title }}</div>
        <div class="a">{{ current.cantor }}</div>
      </div>
    </div>

    <div class="center">
      <div class="controls">
        <button @click="prev" title="Anterior">⏮</button>
        <button @click="toggle" title="Play/Pause">{{ player.isPlaying ? "⏸" : "▶" }}</button>
        <button @click="next" title="Próxima">⏭</button>
      </div>

      <div class="bar">
        <span class="time">{{ currentTimeText }}</span>
        <input
          class="seek"
          type="range"
          min="0"
          :max="duration"
          step="1"
          :value="position"
          @input="onSeek"
        />
        <span class="time">{{ durationText }}</span>
      </div>
    </div>

    <div class="right">
      <input class="vol" type="range" min="0" max="1" step="0.01" :value="player.volume" @input="onVol" />
      <button class="queue" @click="toggleQueue" title="Fila">📂 {{ player.queue.length }}</button>
    </div>

    <div v-if="showQueue" class="overlay" @click.self="toggleQueue">
      <div class="modal">
        <div class="modal-head">
          <strong>Fila</strong>
          <button @click="clearQueue" class="clear">Limpar</button>
        </div>
        <div v-if="player.queue.length" class="list">
          <div
            v-for="(q, i) in player.queue"
            :key="q.fileId || i"
            class="row"
            :class="{ active: i === player.currentIndex }"
          >
            <div class="meta">
              <div class="mini"></div>
              <div>
                <div class="rt">{{ q.title }}</div>
                <div class="ra">{{ q.cantor }}</div>
              </div>
            </div>
            <div class="row-actions">
              <button @click="playAt(i)" title="Tocar">▶</button>
              <button @click="remove(i)" title="Remover">🗑</button>
              <button @click="download(q)" title="Baixar">⬇</button>
            </div>
          </div>
        </div>
        <div v-else class="empty">Fila vazia</div>
      </div>
    </div>
  </div>

  <div v-else class="player placeholder">
    <span>Selecione uma música para começar…</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { usePlayerStore } from "@/stores/usePlayerStore"

const player = usePlayerStore()
const showQueue = ref(false)

const current = computed(() => player.current)
const duration = ref(0)
const position = ref(0)
let raf = null

function loop() {
  if (player.sound) {
    try {
      const d = player.sound.duration() || 0
      const p = player.sound.seek() || 0
      duration.value = Math.floor(d)
      position.value = Math.floor(p)
    } catch {}
  }
  raf = requestAnimationFrame(loop)
}

const durationText = computed(() => toTime(duration.value))
const currentTimeText = computed(() => toTime(position.value))

function toTime(s) {
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60).toString().padStart(2, "0")
  return `${m}:${ss}`
}

function onSeek(e) {
  const val = Number(e.target.value)
  console.log("[Player] seek ->", val)
  player.seekTo(val)
}

function onVol(e) {
  const v = Number(e.target.value)
  player.setVolume(v)
}

function toggle() {
  console.log("[Player] toggle play")
  player.togglePlay()
}

function prev() {
  console.log("[Player] prev")
  player.prev()
}
function next() {
  console.log("[Player] next")
  player.next()
}

function toggleQueue() {
  showQueue.value = !showQueue.value
  console.log("[Player] toggleQueue ->", showQueue.value)
}

function playAt(i) {
  console.log("[Player] playAt index", i)
  player.play(i)
}
function remove(i) {
  console.log("[Player] removeFromQueue", i)
  player.removeFromQueue(i)
}
function clearQueue() {
  console.log("[Player] clearQueue")
  player.clearQueue()
}
function download(music) {
  const a = document.createElement("a")
  a.href = music.downloadUrl
  a.download = music.fileName || "musica.mp3"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

onMounted(() => {
  console.log("[Player] mounted")
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
.player {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: #141414; color: #fff;
  border-top: 1px solid #232323;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 16px;
  align-items: center;
  padding: 10px 16px;
  z-index: 40;
  font-family: Inter, system-ui, sans-serif;
}
.player.placeholder {
  justify-content: center; text-align: center; font-size: 14px;
}
.left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.thumb { width: 44px; height: 44px; border-radius: 8px; background: #1b1b1b; border: 1px solid #262626; }
.info .t { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.info .a { font-size: 12px; color: #9aa0a6; }

.center { display: flex; flex-direction: column; gap: 6px; align-items: center; }
.controls { display: flex; align-items: center; gap: 10px; }
.controls button {
  background: #202020; border: 1px solid #2a2a2a; color: #f0f0f0;
  padding: 6px 10px; border-radius: 8px; cursor: pointer;
}
.controls button:hover { background: #262626; }
.bar { display: grid; grid-template-columns: 48px 1fr 48px; gap: 8px; align-items: center; width: 100%; }
.seek { width: 100%; appearance: none; height: 6px; background: #262626; border-radius: 999px; }
.seek::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #1db954; }
.time { font-size: 11px; color: #9aa0a6; text-align: center; }

.right { display: flex; justify-content: end; align-items: center; gap: 8px; }
.vol { width: 110px; }
.queue { background: #202020; border: 1px solid #2a2a2a; color: #f0f0f0; padding: 6px 10px; border-radius: 8px; cursor: pointer; }
.queue:hover { background: #262626; }

@media (max-width: 900px) {
  .player { grid-template-columns: 1fr 1fr; }
  .right { display: none; }
}

.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6);
  display: flex; align-items: flex-end; justify-content: center; z-index: 50;
}
.modal {
  width: min(720px, 96vw);
  max-height: 60vh;
  background: #151515; border-top-left-radius: 14px; border-top-right-radius: 14px;
  border: 1px solid #262626; padding: 14px; overflow: auto;
}
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.clear { background: #2a2a2a; border: 1px solid #333; color: #fff; padding: 6px 10px; border-radius: 8px; }
.list { display: flex; flex-direction: column; gap: 6px; }
.row {
  display: grid; grid-template-columns: 1fr auto; align-items: center;
  padding: 8px 6px; border-radius: 8px; border: 1px solid #232323; background: #121212;
}
.row.active { outline: 1px solid #1db95455; background: #141414; }
.meta { display: flex; align-items: center; gap: 10px; }
.mini { width: 36px; height: 36px; border-radius: 8px; background: #1b1b1b; border: 1px solid #262626; }
.rt { font-weight: 700; font-size: 14px; }
.ra { font-size: 12px; color: #9aa0a6; }
.row-actions { display: grid; grid-auto-flow: column; gap: 6px; }
.row-actions button {
  background: #202020; border: 1px solid #2a2a2a; color: #fff; padding: 4px 8px; border-radius: 8px; cursor: pointer;
}
.row-actions button:hover { background: #262626; }
.empty { color: #9aa0a6; padding: 20px; text-align: center; }
</style>
