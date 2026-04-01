<template>
  <div class="explorer-page">
    <header class="topbar">
      <nav class="breadcrumb">
        <button class="crumb root" @click="goRoot">
          <i class="mdi mdi-music-box-multiple"></i>
          <span class="crumb-text">Biblioteca</span>
        </button>

        <template v-if="currentCategory">
          <span class="sep"><i class="mdi mdi-chevron-right"></i></span>
          <button class="crumb" @click="goCategory">
            <i class="mdi mdi-folder-open"></i>
            <span class="crumb-text">{{ currentCategory }}</span>
          </button>
        </template>

        <template v-if="currentArtist">
          <span class="sep"><i class="mdi mdi-chevron-right"></i></span>
          <span class="crumb active">
            <i class="mdi mdi-account-music"></i>
            <span class="crumb-text">{{ currentArtist }}</span>
          </span>
        </template>
      </nav>

      <button class="btn-search" @click="openModal">
        <i class="mdi mdi-magnify"></i>
        <span class="btn-text">Buscar</span>
      </button>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando biblioteca...</p>
    </div>

    <div v-else-if="!currentCategory" class="grid-view">
      <div class="section-label">
        <i class="mdi mdi-folder-multiple"></i>
        Estilos musicais — {{ categories.length }} pastas
      </div>

      <div class="folders-grid">
        <div
          v-for="cat in categories"
          :key="cat.name"
          class="folder-card"
          @click="openCategory(cat.name)"
        >
          <div class="folder-icon">
            <i class="mdi mdi-folder"></i>
            <span class="folder-badge">{{ cat.artistCount }}</span>
          </div>

          <div class="folder-info">
            <p class="folder-name">{{ cat.name }}</p>
            <p class="folder-meta">{{ cat.songCount }} músicas</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="currentCategory && !currentArtist" class="grid-view">
      <div class="section-label">
        <i class="mdi mdi-account-group"></i>
        {{ currentCategory }} — {{ artists.length }} artistas
      </div>

      <div class="folders-grid">
        <div
          v-for="art in artists"
          :key="art.name"
          class="folder-card artist-folder"
          @click="openArtist(art.name)"
        >
          <div class="folder-icon artist-icon">
            <img
              v-if="art.coverUrl"
              :src="art.coverUrl"
              class="artist-thumb"
              alt=""
            />
            <i v-else class="mdi mdi-account-music"></i>
            <span class="folder-badge">{{ art.songCount }}</span>
          </div>

          <div class="folder-info">
            <p class="folder-name">{{ art.name }}</p>
            <p class="folder-meta">{{ art.songCount }} músicas</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="currentArtist" class="list-view">
      <div class="section-label">
        <i class="mdi mdi-music-note-eighth"></i>
        {{ currentArtist }} — {{ songs.length }} músicas
      </div>

      <div class="songs-list">
        <div
          v-for="(m, idx) in songs"
          :key="m.id"
          class="song-row"
          :class="{ playing: player.currentTrack?.id === m.id }"
          @dblclick="play(m)"
        >
          <span class="song-idx">{{ idx + 1 }}</span>

          <img :src="m.coverUrl || '/LogoMusic.jpg'" class="song-cover" />

          <div class="song-info">
            <div class="song-title-wrap">
              <p class="song-title">{{ m.title }}</p>
            </div>
            <p class="song-artist">{{ m.cantor }}</p>
          </div>

          <div class="song-tipo hide-on-mobile">
            <span
              v-for="t in (Array.isArray(m.tipo) ? m.tipo : [m.tipo])"
              :key="t"
              class="tag"
            >
              {{ t }}
            </span>
          </div>

          <div class="song-actions">
            <button
              class="action-btn play-btn"
              @click.stop="play(m)"
              title="Tocar"
            >
              <i class="mdi mdi-play"></i>
            </button>

            <button
              class="action-btn"
              @click.stop="addQueue(m)"
              title="Adicionar à fila"
            >
              <i class="mdi mdi-playlist-plus"></i>
            </button>

            <button
              class="action-btn"
              @click.stop="download(m)"
              title="Baixar"
            >
              <i class="mdi mdi-download"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <header class="modal-header">
          <h2><i class="mdi mdi-magnify"></i> Buscar música</h2>
          <button class="close" @click="closeModal">
            <i class="mdi mdi-close"></i>
          </button>
        </header>

        <input
          ref="inputRef"
          v-model="queryText"
          type="text"
          class="search-input"
          placeholder="Estilo, cantor ou título..."
        />

        <div v-if="searchResults.length" class="results">
          <div v-for="m in searchResults" :key="m.id" class="music-card">
            <img :src="m.coverUrl || '/LogoMusic.jpg'" class="cover" />

            <div class="info">
              <div class="modal-title-wrap">
                <h3 class="title">{{ m.title }}</h3>
              </div>
              <p class="artist">{{ m.cantor }}</p>

              <div class="tags hide-on-mobile">
                <span
                  v-for="t in (Array.isArray(m.tipo) ? m.tipo : [m.tipo])"
                  :key="t"
                  class="tag"
                >
                  {{ t }}
                </span>
              </div>
            </div>

            <div class="actions">
              <button @click="play(m)" title="Tocar">
                <i class="mdi mdi-play"></i>
              </button>
              <button @click="addQueue(m)" title="Fila">
                <i class="mdi mdi-playlist-plus"></i>
              </button>
              <button @click="download(m)" title="Baixar">
                <i class="mdi mdi-download"></i>
              </button>
            </div>
          </div>
        </div>

        <p v-else-if="queryText" class="empty">Nenhuma música encontrada</p>
        <p v-else class="empty-hint">Digite para buscar na biblioteca completa</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from "vue"
import { db } from "@/firebase"
import { collection, getDocs, doc, updateDoc, increment } from "firebase/firestore"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { useUserStore } from "@/stores/userStore"
import { useToast } from "vue-toast-notification"

const player = usePlayerStore()
const userStore = useUserStore()
const toast = useToast()

/* ─── Estado ─── */
const loading = ref(true)
const allMusicas = ref([])

const currentCategory = ref(null)
const currentArtist = ref(null)

const isOpen = ref(false)
const queryText = ref("")
const inputRef = ref(null)

/* ─── Carrega tudo 1x ao montar ─── */
onMounted(async () => {
  const snap = await getDocs(collection(db, "musicas"))
  allMusicas.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  loading.value = false
})

/* ─── Derivações: Categorias ─── */
const categories = computed(() => {
  const map = {}
  for (const m of allMusicas.value) {
    const tipos = Array.isArray(m.tipo) ? m.tipo : [m.tipo || "Sem estilo"]
    for (const t of tipos) {
      if (!map[t]) map[t] = { name: t, artists: new Set(), songCount: 0 }
      map[t].artists.add(m.cantor)
      map[t].songCount++
    }
  }
  return Object.values(map)
    .map(c => ({ ...c, artistCount: c.artists.size }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

/* ─── Derivações: Artistas da categoria atual ─── */
const artists = computed(() => {
  if (!currentCategory.value) return []
  const map = {}
  for (const m of allMusicas.value) {
    const tipos = Array.isArray(m.tipo) ? m.tipo : [m.tipo || "Sem estilo"]
    if (!tipos.includes(currentCategory.value)) continue
    const name = m.cantor || "Desconhecido"
    if (!map[name]) map[name] = { name, songCount: 0, coverUrl: m.coverUrl || null }
    map[name].songCount++
  }
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
})

/* ─── Derivações: Músicas do artista atual ─── */
const songs = computed(() => {
  if (!currentArtist.value) return []
  return allMusicas.value.filter(m => m.cantor === currentArtist.value)
})

/* ─── Busca reativa ─── */
const searchResults = computed(() => {
  const q = queryText.value.trim().toLowerCase()
  if (!q) return []
  return allMusicas.value.filter(m => {
    const title = m.title?.toLowerCase() || ""
    const cantor = m.cantor?.toLowerCase() || ""
    const tipo = Array.isArray(m.tipo)
      ? m.tipo.join(" ").toLowerCase()
      : (m.tipo?.toLowerCase() || "")
    return title.includes(q) || cantor.includes(q) || tipo.includes(q)
  })
})

/* ─── Navegação ─── */
function goRoot() {
  currentCategory.value = null
  currentArtist.value = null
}

function goCategory() {
  currentArtist.value = null
}

function openCategory(name) {
  currentCategory.value = name
  currentArtist.value = null
}

function openArtist(name) {
  currentArtist.value = name
}

/* ─── Modal ─── */
function openModal() {
  isOpen.value = true
  nextTick(() => inputRef.value?.focus())
}

function closeModal() {
  isOpen.value = false
  queryText.value = ""
}

/* ─── Ações do player ─── */
function play(m) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Ative sua assinatura 🎶")
    return
  }
  player.addToQueue(m, { playNow: true })
  updateDoc(doc(db, "musicas", m.id), { playCount: increment(1) })
  closeModal()
}

function addQueue(m) {
     if (!userStore.hasActiveSubscription) {
    toast.warning("Ative sua assinatura 🎶")
    return
  }
  player.addToQueue(m, { playNow: false })
  toast.success("Adicionada à fila ✓")
}

async function download(m) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Assinatura necessária")
    return
  }
  if (!m.downloadUrl) return

  const res = await fetch(m.downloadUrl)
  const blob = await res.blob()
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = m.fileName || `${m.title}.mp3`
  a.click()
  URL.revokeObjectURL(a.href)

  await updateDoc(doc(db, "musicas", m.id), { downloadCount: increment(1) })
}
</script>

<style scoped>
.explorer-page {
  --bg: #0f0f13;
  --surface: #1a1a22;
  --surface2: #22222e;
  --border: #2e2e3e;
  --accent: #00d1b2;
  --accent2: #00d1b2; 
  --text: #e8e8f0;
  --muted: #7070a0;
  --folder: #f59e0b;
  --folder-artist: #00d1b2;
  --danger: #ef4444;

  min-height: 100vh;
  width: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: "Segoe UI", system-ui, sans-serif;
  overflow-x: hidden;
}

/* ── TOPBAR ── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 14px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}

.breadcrumb::-webkit-scrollbar {
  display: none;
}

.crumb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  font-size: 14px;
}

.crumb:hover {
  background: var(--surface2);
  color: var(--text);
}

.crumb.root {
  color: var(--accent2);
}

.crumb.active {
  color: var(--text);
  font-weight: 600;
  cursor: default;
  pointer-events: none;
}

.sep {
  color: var(--border);
  font-size: 14px;
  flex-shrink: 0;
}

.btn-search {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.btn-search:hover {
  opacity: 0.85;
}

/* ── LOADING ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 20px;
  color: var(--muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── GRID VIEW ── */
.grid-view,
.list-view {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 20px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  width: 100%;
}

.folder-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  min-height: 170px;
  transition: all 0.18s ease;
}

.folder-card:hover {
  background: var(--surface2);
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(124, 106, 247, 0.15);
}

.folder-card:active {
  transform: scale(0.97);
}

.folder-icon {
  position: relative;
  font-size: 44px;
  color: var(--folder);
  line-height: 1;
}

.artist-folder .folder-icon {
  color: var(--folder-artist);
}

.folder-badge {
  position: absolute;
  bottom: -4px;
  right: -8px;
  background: var(--accent);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 20px;
  min-width: 20px;
  text-align: center;
}

.artist-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.artist-thumb {
  width: 58px;
  height: 58px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid var(--border);
}

.folder-info {
  width: 100%;
}

.folder-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  line-height: 1.35;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.folder-meta {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}

/* ── LIST VIEW ── */
.songs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.song-row {
  display: grid;
  grid-template-columns: 32px 48px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.15s;
  cursor: default;
}

.song-row:hover {
  background: var(--surface);
  border-color: var(--border);
}

.song-row.playing {
  background: rgba(124, 106, 247, 0.12);
  border-color: var(--accent);
}

.song-idx {
  width: 20px;
  text-align: right;
  font-size: 13px;
  color: var(--muted);
  flex-shrink: 0;
}

.song-cover {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.song-info {
  min-width: 0;
  overflow: hidden;
}

.song-title-wrap {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.song-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 0;
  will-change: transform;
}

.song-artist {
  font-size: 12px;
  color: var(--muted);
  margin: 2px 0 0;
}

.song-tipo {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-shrink: 0;
  margin: 0 10px;
}

.tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  background: rgba(124, 106, 247, 0.18);
  color: var(--accent2);
  border: 1px solid rgba(124, 106, 247, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.song-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  opacity: 1;
}

.action-btn {
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
}

.action-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
}

.play-btn:hover {
  background: #22c55e;
  border-color: #22c55e;
}

/* ── MODAL ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px 16px;
  z-index: 999;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  width: 100%;
  max-width: 560px;
  border-radius: 16px;
  padding: 16px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 16px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close {
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  font-size: 16px;
  outline: none;
}

.results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.music-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px;
}

.cover {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.modal-title-wrap {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.info .title {
  font-size: 14px;
  margin: 0;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  display: inline-block;
  padding-left: 100%;
  will-change: transform;
  animation: marqueeScroll 10s linear infinite;
}

.info .artist {
  font-size: 12px;
  color: var(--muted);
  margin: 2px 0 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.actions button {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.actions button:hover {
  background: var(--accent);
  border-color: var(--accent);
}

.empty,
.empty-hint {
  color: var(--muted);
  text-align: center;
  padding: 20px 10px;
  margin: 0;
}

@keyframes marqueeScroll {
  100% {
    transform: translateX(100%);
  }
  0% {
    transform: translateX(-100%);
  }
}

/* ── MEDIA QUERIES ── */
@media (max-width: 600px) {
  .crumb-text {
    display: none;
  }

  .btn-text {
    display: none;
  }

  .btn-search {
    padding: 8px 12px;
    border-radius: 50%;
  }

  .hide-on-mobile {
    display: none !important;
  }

  .grid-view,
  .list-view {
    padding: 12px;
  }

  .folders-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .folder-card {
    min-height: 140px;
    padding: 14px 10px;
  }

  .folder-icon {
    font-size: 38px;
  }

  .song-row {
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 8px;
    padding: 8px;
  }

  .song-idx {
    display: none;
  }

  .song-actions .action-btn {
    padding: 6px;
  }

 .song-title {
  display: inline-block;
  white-space: nowrap;
  min-width: max-content;
  animation: marqueeScroll 10s linear infinite;
}
  .modal-overlay {
    padding-top: 20px;
  }
}

@media (min-width: 768px) {
  .folders-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (min-width: 1200px) {
  .folders-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  .grid-view,
  .list-view {
    padding: 24px 32px;
  }
}
</style>