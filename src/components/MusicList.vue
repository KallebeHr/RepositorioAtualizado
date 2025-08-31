<template>
  <div class="music-player-container">
    <h2 class="title">🎶 Repertório</h2>

    <div v-if="loading" class="status">Carregando músicas...</div>
    <div v-if="error" class="status error">{{ error }}</div>

    <div v-if="!loading && musicas.length" class="music-list">
      <div v-for="musica in musicas" :key="musica.fileId" class="card">
        <!-- Topo -->
        <div class="top">
          <div class="pfp">
            <div v-if="isPlaying(musica)" class="playing">
              <div class="greenline line-1"></div>
              <div class="greenline line-2"></div>
              <div class="greenline line-3"></div>
              <div class="greenline line-4"></div>
              <div class="greenline line-5"></div>
            </div>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path d="M3 22v-20l18 10-18 10z"/>
            </svg>
          </div>
          <div class="texts">
            <p class="title-1">{{ musica.title }}</p>
            <p class="title-2">{{ musica.cantor || "—" }}</p>
          </div>
        </div>

        <!-- Controles -->
        <div class="controls">
          <button v-if="!isPlaying(musica)" @click="playMusic(musica)" class="ctrl-btn">▶</button>
          <button v-else @click="pauseMusic(musica)" class="ctrl-btn">⏸</button>

          <a :href="musica.downloadUrl" download class="download-btn">⬇</a>
        </div>

        <!-- Barra -->
        <div class="time">
          <div class="elapsed" :style="{ width: progress[musica.fileId] + '%' }"></div>
        </div>
        <div class="time-labels">
          <span>{{ formatTime(currentTime[musica.fileId] || 0) }}</span>
          <span>{{ formatTime(duration[musica.fileId] || 0) }}</span>
        </div>

        <!-- Áudio -->
        <audio
          :ref="el => setAudioRef(el, musica.fileId)"
          :src="musica.downloadUrl"
          preload="metadata"
          @timeupdate="updateProgress(musica)"
          @loadedmetadata="setDuration(musica)"
          @ended="onEnded(musica)"
        ></audio>
      </div>
    </div>

    <div v-if="!loading && !musicas.length" class="status">Nenhuma música encontrada.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { db } from "@/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"

const musicas = ref([])
const loading = ref(true)
const error = ref("")

const audioRefs = ref({})
const currentPlaying = ref(null)
const progress = ref({})
const duration = ref({})
const currentTime = ref({})

function setAudioRef(el, id) {
  if (el) audioRefs.value[id] = el
}
function playMusic(musica) {
  pauseOthers()
  const audio = audioRefs.value[musica.fileId]
  if (audio) {
    audio.play()
    currentPlaying.value = musica.fileId
  }
}
function pauseMusic(musica) {
  const audio = audioRefs.value[musica.fileId]
  if (audio) {
    audio.pause()
    currentPlaying.value = null
  }
}
function pauseOthers() {
  Object.values(audioRefs.value).forEach(a => a.pause())
}
function isPlaying(musica) {
  return currentPlaying.value === musica.fileId
}
function updateProgress(musica) {
  const audio = audioRefs.value[musica.fileId]
  if (audio) {
    currentTime.value[musica.fileId] = audio.currentTime
    duration.value[musica.fileId] = audio.duration
    progress.value[musica.fileId] = (audio.currentTime / audio.duration) * 100
  }
}
function setDuration(musica) {
  const audio = audioRefs.value[musica.fileId]
  if (audio) duration.value[musica.fileId] = audio.duration
}
function onEnded(musica) {
  currentPlaying.value = null
  progress.value[musica.fileId] = 0
}
function formatTime(seconds) {
  if (!seconds) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}
async function fetchMusicas() {
  try {
    loading.value = true
    const q = query(collection(db, "musicas"), orderBy("createdAt", "desc"))
    const qs = await getDocs(q)
    musicas.value = qs.docs.map(doc => doc.data())
  } catch (err) {
    error.value = "Erro ao buscar músicas."
  } finally {
    loading.value = false
  }
}
onMounted(fetchMusicas)
</script>

<style scoped>
.music-player-container {
  max-width: 1000px;
  margin: 40px auto;
  padding: 10px;
  color: #fff;
  font-family: "Inter", sans-serif;
}
.title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 20px;
}
.music-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.card {
  background: #181818;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: background 0.2s;
}
.card:hover {
  background: #222;
}
.top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pfp {
  height: 48px;
  width: 48px;
  background: #333;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.texts {
  flex: 1;
}
.title-1 {
  font-size: 16px;
  font-weight: 600;
}
.title-2 {
  font-size: 13px;
  color: #bbb;
}
.controls {
  display: flex;
  gap: 12px;
}
.ctrl-btn {
  background: #1db954;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  color: white;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.ctrl-btn:hover {
  transform: scale(1.05);
}
.download-btn {
  margin-left: auto;
  color: #aaa;
  text-decoration: none;
  font-size: 18px;
}
.download-btn:hover {
  color: #1db954;
}
.time {
  width: 100%;
  background: #333;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
}
.elapsed {
  background: #1db954;
  height: 100%;
  transition: width 0.2s;
}
.time-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}

/* equalizer */
.playing {
  display: flex;
  gap: 2px;
}
.greenline {
  background: #1db954;
  height: 20px;
  width: 2px;
  transform-origin: bottom;
}
.line-1 { animation: playing 1s ease-in-out infinite 0.2s; }
.line-2 { animation: playing 1s ease-in-out infinite 0.5s; }
.line-3 { animation: playing 1s ease-in-out infinite 0.6s; }
.line-4 { animation: playing 1s ease-in-out infinite 0s; }
.line-5 { animation: playing 1s ease-in-out infinite 0.4s; }
@keyframes playing {
  0% { transform: scaleY(0.1); }
  33% { transform: scaleY(0.6); }
  66% { transform: scaleY(0.9); }
  100% { transform: scaleY(0.1); }
}
</style>
