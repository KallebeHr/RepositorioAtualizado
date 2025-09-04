<template>
  <div class="overlay">
    <div class="modal">
      <header>
        <h3>🎶 Fila de Reprodução</h3>
        <button class="close" @click="$emit('close')">✖</button>
      </header>

      <div v-if="queue.length" class="queue-list">
        <div v-for="(music, i) in queue" :key="music.fileId" class="queue-item">
          <div>
            <p class="q-title">{{ music.title }}</p>
            <p class="q-artist">{{ music.cantor }}</p>
          </div>
          <div class="actions">
            <button @click="remove(i)">🗑</button>
            <button @click="download(music)">⬇</button>
          </div>
        </div>
      </div>
      <p v-else class="empty">Nenhuma música na fila.</p>

      <footer>
        <button @click="downloadAll" class="download-all">⬇ Baixar todas</button>
        <button @click="clear" class="clear">🗑 Limpar fila</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { usePlayerStore } from "@/stores/usePlayerStore"
const player = usePlayerStore()
const queue = player.queue

function remove(i) {
  player.removeFromQueue(i)
}

function clear() {
  player.clearQueue()
}

function download(music) {
  const link = document.createElement("a")
  link.href = music.downloadUrl
  link.download = music.fileName
  link.click()
}

function downloadAll() {
  queue.forEach(music => download(music))
}
</script>

<style scoped>
.overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
}
.modal {
  background: #181818; padding: 20px; border-radius: 12px; width: 400px; max-height: 70vh; overflow-y: auto; color: #fff;
}
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.close { background: none; border: none; color: #fff; font-size: 18px; cursor: pointer; }
.queue-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #333; }
.q-title { font-size: 14px; font-weight: bold; }
.q-artist { font-size: 12px; color: #aaa; }
.actions button { background: none; border: none; color: #fff; cursor: pointer; margin-left: 6px; }
.actions button:hover { color: #1db954; }
footer { display: flex; justify-content: space-between; margin-top: 16px; }
.download-all, .clear { background: #1db954; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
.clear { background: #e63946; }
.download-all:hover { background: #1ed760; }
.clear:hover { background: #ff4c4c; }
</style>
