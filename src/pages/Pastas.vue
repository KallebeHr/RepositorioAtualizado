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
    <!-- BOTÃO FLUTUANTE (EQUALIZADOR) -->
    <button
      class="eq-fab"
      :class="{ on: eqEnabled }"
      @click="toggleEqUI"
      aria-label="Abrir equalizador"
      title="Equalizador"
    >
      <span class="mdi mdi-tune-vertical"></span>
    </button>

    <!-- UI DO EQUALIZADOR -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="eqUIOpen"
          class="eq-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Equalizador"
          @click.self="eqUIOpen = false"
        >
          <transition name="pop">
            <div class="eq-panel" tabindex="-1" ref="eqPanelRef" @keydown.esc="eqUIOpen = false">
              <!-- HEADER FIXO (sempre visível) -->
              <header class="eq-header">
                <div class="eq-title-row">
                  <div class="eq-badge" :class="{ on: eqEnabled }">
                    <span class="dot"></span>
                    <span>{{ eqEnabled ? "EQUALIZADOR ATIVO" : "EQUALIZADOR DESATIVADO" }}</span>
                  </div>

                  <button class="eq-close" @click="eqUIOpen = false" aria-label="Fechar">
                    <span class="mdi mdi-close"></span>
                  </button>
                </div>

                <p class="eq-sub">
                  Um equalizador futurista, em tempo real. Ajuste as bandas e veja o espectro circular reagindo ao som.
                </p>
              </header>

              <!-- ÁREA SCROLL (quando o conteúdo for grande) -->
              <div class="eq-scroll">
                <!-- HERO: VISUAL + CONTROLES PRINCIPAIS -->
                <section class="eq-hero">
                  <!-- VISUALIZER CIRCULAR -->
                  <div class="am-card">
                    <div class="am-ring">
                      <div class="am-canvas" ref="amEl"></div>

                      <!-- Centro (informações) -->
                      <div class="am-center">
                        <div class="am-center-dot" :class="{ on: eqEnabled }"></div>
                        <p class="am-center-title">SPECTRUM</p>
                        <p class="am-center-sub">{{ eqEnabled ? "PROCESSANDO" : "BYPASS" }}</p>
                      </div>
                    </div>

                    <div class="am-hint">
                      <span class="mdi mdi-gesture-tap"></span>
                      <p>
                        Se o círculo não reagir, dê play e toque em qualquer botão/slider (alguns browsers exigem interação).
                      </p>
                    </div>
                  </div>

                  <!-- CONTROLES DIDÁTICOS -->
                  <div class="eq-control-card">
                    <div class="eq-control-top">
                      <div class="eq-control-title">
                        <p class="t">Controle Rápido</p>
                        <p class="d">Liga/desliga e presets prontos.</p>
                      </div>

                      <label class="switch">
                        <input type="checkbox" v-model="eqEnabled" @change="applyEqEnabled" />
                        <span class="slider"></span>
                      </label>
                    </div>

                    <div class="eq-presets">
                      <button class="pill" @click="resetEq" type="button">
                        <span class="mdi mdi-refresh"></span> Reset
                      </button>

                      <button class="pill primary" @click="applyPreset('bass')" type="button">
                        <span class="mdi mdi-waveform"></span> Grave+
                      </button>

                      <button class="pill primary" @click="applyPreset('vocal')" type="button">
                        <span class="mdi mdi-microphone"></span> Voz
                      </button>

                      <button class="pill primary" @click="applyPreset('bright')" type="button">
                        <span class="mdi mdi-brightness-5"></span> Brilho
                      </button>
                    </div>

                    <div class="eq-mini-note">
                      <span class="mdi mdi-shield-check-outline"></span>
                      <p>Não quebra o áudio: quando OFF, o som passa direto (bypass).</p>
                    </div>
                  </div>
                </section>

                <!-- BANDS: SLIDERS -->
                <section class="eq-bands">
                  <div class="eq-bands-head">
                    <div>
                      <h3 class="eq-h3">Bandas do Equalizador</h3>
                      <p class="eq-p">
                        Dica: Grave mexe no “peso”, Voz clareia o vocal e Agudo dá brilho.
                      </p>
                    </div>
                    <div class="eq-chip">
                      <span class="mdi mdi-tune-vertical"></span>
                      <span>Range -12dB a +12dB</span>
                    </div>
                  </div>

                  <div class="eq-sliders">
                    <div class="band" v-for="b in bands" :key="b.key">
                      <div class="band-top">
                        <p class="hz">{{ b.label }}</p>
                        <p class="db">{{ formatDb(b.gain) }} dB</p>
                      </div>

                      <div class="range-wrap">
                        <input
                          class="range"
                          type="range"
                          :min="-12"
                          :max="12"
                          :step="0.5"
                          v-model.number="b.gain"
                          @input="onBandChange"
                        />
                        <div class="range-glow" :style="{ '--p': (b.gain + 12) / 24 }"></div>
                      </div>

                      <p class="band-hint">{{ b.freq }} Hz</p>
                    </div>
                  </div>

                  <div class="eq-note">
                    <span class="mdi mdi-information-outline"></span>
                    <MusicPlayer />
                  </div>
                </section>

                <div class="eq-footer-space"></div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </Teleport>
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
/* ======================
   FLOATING EQ BUTTON
====================== */
.eq-fab {
  position: fixed;
  right: 18px;
  bottom: 10rem;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 15, 15, 0.78);
  backdrop-filter: blur(10px);
  color: #fff;
  display: grid;
  place-items: center;
  z-index: 9998;
  cursor: pointer;
  box-shadow: 0 18px 50px rgba(0,0,0,0.45);
  transition: transform 0.18s ease, background 0.18s ease, border 0.18s ease;
}
.eq-fab .mdi { font-size: 26px; }
.eq-fab:hover { transform: translateY(-2px); }
.eq-fab.on {
  border-color: rgba(0, 207, 208, 0.55);
  background: rgba(0, 207, 208, 0.16);
}

/* ======================
        EQ MODAL (FODÃO)
====================== */
.eq-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(1200px 600px at 50% 10%, rgba(0,207,208,0.12), transparent 55%),
              rgba(0,0,0,0.72);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 9999;
}

.eq-panel {
  width: min(1040px, 100%);
  max-height: calc(100vh - 24px);
  background: rgba(10,10,12,0.92);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 26px;
  overflow: hidden;
  outline: none;
  box-shadow: 0 40px 120px rgba(0,0,0,0.65);
  backdrop-filter: blur(10px);
}

/* header fixo + corpo scroll */
.eq-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: radial-gradient(900px 260px at 12% -40%, rgba(0,207,208,0.22), transparent 60%),
              rgba(10,10,12,0.96);
}

.eq-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.eq-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  font-weight: 950;
  letter-spacing: 0.10em;
  font-size: 11px;
}
.eq-badge .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6b7280;
  box-shadow: 0 0 0 7px rgba(255,255,255,0.03);
}
.eq-badge.on .dot {
  background: #00cfd0;
  box-shadow: 0 0 0 7px rgba(0,207,208,0.18);
}

.eq-close {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.15s ease, background 0.15s ease;
}
.eq-close:hover { transform: translateY(-1px); background: rgba(255,255,255,0.09); }
.eq-close .mdi { font-size: 20px; }

.eq-sub {
  margin: 10px 0 0;
  color: rgba(255,255,255,0.72);
  font-weight: 650;
  line-height: 1.5;
  font-size: 13px;
}

/* SCROLL */
.eq-scroll {
  max-height: calc(100vh - 160px);
  overflow: auto;
  padding: 16px 16px 0;
}
.eq-scroll::-webkit-scrollbar { width: 10px; }
.eq-scroll::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border-radius: 999px;
}
.eq-scroll::-webkit-scrollbar-track { background: transparent; }

.eq-footer-space { height: 18px; }

/* HERO layout */
.eq-hero{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items: start;
}

@media (max-width: 900px){
  .eq-hero{ grid-template-columns: 1fr; }
}

/* ======================
   VISUALIZER CIRCULAR
====================== */
.am-card{
  padding: 14px;
  border-radius: 20px;
  background:
    radial-gradient(900px 300px at 20% -60%, rgba(0,207,208,0.22), transparent 60%),
    rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
}

.am-ring{
  position: relative;
  width: min(360px, 100%);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 999px;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.07), rgba(0,0,0,0.60));
  box-shadow:
    0 30px 90px rgba(0,0,0,0.60),
    inset 0 0 0 2px rgba(255,255,255,0.10),
    inset 0 0 60px rgba(0,207,208,0.10);
}

.am-canvas{ width: 100%; height: 100%; }
.am-canvas canvas{
  width: 100% !important;
  height: 100% !important;
  display:block;
}

.am-center{
  position:absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  width: 44%;
  height: 44%;
  border-radius: 999px;
  display:grid;
  place-items:center;
  text-align:center;
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.18), rgba(0,0,0,0.86));
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: inset 0 0 28px rgba(0,0,0,0.62);
  pointer-events:none;
}

.am-center-dot{
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: rgba(107,114,128,0.9);
  box-shadow: 0 0 0 12px rgba(255,255,255,0.05);
  margin-bottom: 6px;
}
.am-center-dot.on{
  background: rgba(0,207,208,0.95);
  box-shadow: 0 0 0 12px rgba(0,207,208,0.12);
}

.am-center-title{
  margin:0;
  font-weight: 950;
  letter-spacing: .18em;
  font-size: 12px;
  opacity: .95;
}
.am-center-sub{
  margin:2px 0 0;
  font-weight: 850;
  font-size: 11px;
  opacity: .70;
}

.am-hint{
  margin-top: 12px;
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
}
.am-hint .mdi{ font-size: 18px; margin-top: 1px; }
.am-hint p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
   CONTROLE RÁPIDO (CARD)
====================== */
.eq-control-card{
  padding: 14px;
  border-radius: 20px;
  background:
    radial-gradient(800px 260px at 20% -60%, rgba(255,255,255,0.08), transparent 60%),
    rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
}

.eq-control-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap: 12px;
  margin-bottom: 12px;
}

.eq-control-title .t{
  margin:0;
  font-weight: 950;
  letter-spacing: -0.01em;
  font-size: 16px;
}
.eq-control-title .d{
  margin: 4px 0 0;
  color: rgba(255,255,255,0.65);
  font-weight: 650;
  font-size: 13px;
}

/* switch futurista */
.switch { position: relative; width: 52px; height: 30px; }
.switch input { display:none; }
.slider{
  position:absolute;
  inset:0;
  border-radius:999px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.14);
  transition: background .16s ease;
}
.slider::after{
  content:"";
  position:absolute;
  top:50%;
  left:4px;
  width: 22px;
  height: 22px;
  border-radius:999px;
  background:#fff;
  transform: translateY(-50%);
  transition: left .16s ease, background .16s ease;
  box-shadow: 0 10px 28px rgba(0,0,0,0.45);
}
.switch input:checked + .slider{
  background: rgba(0,207,208,0.34);
}
.switch input:checked + .slider::after{
  left: 26px;
  background: #00cfd0;
}

/* presets */
.eq-presets{
  display:flex;
  flex-wrap:wrap;
  gap: 10px;
  margin: 10px 0 12px;
}

.pill{
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
  cursor: pointer;
  display:inline-flex;
  align-items:center;
  gap: 8px;
  transition: transform .15s ease, background .15s ease, border-color .15s ease;
}
.pill:hover{ transform: translateY(-1px); background: rgba(255,255,255,0.09); }
.pill:active{ transform: translateY(0) scale(0.98); }
.pill.primary{
  border-color: rgba(0,207,208,0.34);
  background: rgba(0,207,208,0.12);
}

.eq-mini-note{
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px;
  border-radius: 16px;
  background: rgba(0,207,208,0.08);
  border: 1px solid rgba(0,207,208,0.18);
  color: rgba(255,255,255,0.82);
}
.eq-mini-note .mdi{ font-size: 18px; margin-top: 1px; }
.eq-mini-note p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
   BANDS
====================== */
.eq-bands{
  margin-top: 14px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.09);
}

.eq-bands-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 12px;
  flex-wrap:wrap;
  margin-bottom: 10px;
}

.eq-h3{
  margin:0;
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.01em;
}
.eq-p{
  margin: 6px 0 0;
  color: rgba(255,255,255,0.66);
  font-weight: 650;
  font-size: 13px;
  line-height: 1.45;
}

.eq-chip{
  display:inline-flex;
  align-items:center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.78);
  font-weight: 800;
  font-size: 12px;
}

/* grid ultra responsivo */
.eq-sliders{
  display:grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

@media (max-width: 920px){
  .eq-sliders{ grid-template-columns: repeat(3, minmax(0,1fr)); }
}
@media (max-width: 520px){
  .eq-sliders{ grid-template-columns: repeat(2, minmax(0,1fr)); }
  .eq-scroll{ padding: 14px 12px 0; }
}

.band{
  position: relative;
  border-radius: 18px;
  padding: 12px 10px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.10);
  overflow:hidden;
}
.band::before{
  content:"";
  position:absolute;
  inset:-50px -80px auto;
  height: 160px;
  background: radial-gradient(240px 90px at 18% 55%, rgba(0,207,208,0.16), transparent 60%);
  pointer-events:none;
}

.band-top{
  position: relative;
  z-index: 1;
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.hz{
  margin:0;
  font-weight: 950;
  font-size: 12px;
  color: rgba(255,255,255,0.92);
}
.db{
  margin:0;
  font-weight: 950;
  font-size: 12px;
  color: rgba(0,207,208,0.95);
}

.range-wrap{
  position: relative;
  z-index: 1;
}
.range{ width: 100%; }
.range-glow{
  --p: .5;
  position:absolute;
  inset: -6px -6px -10px -6px;
  border-radius: 16px;
  background: radial-gradient(220px 120px at 50% 50%, rgba(0,207,208,0.18), transparent 60%);
  opacity: calc(0.25 + var(--p) * 0.45);
  filter: blur(10px);
  pointer-events:none;
}

.band-hint{
  position: relative;
  z-index: 1;
  margin: 8px 0 0;
  font-size: 12px;
  opacity: 0.70;
  text-align:center;
  font-weight: 800;
}

/* info note */
.eq-note{
  margin-top: 8rem;
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
}
.eq-note .mdi{ font-size: 18px; margin-top: 2px; }
.eq-note p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
        MODAL ASSINATURA (igual seu)
====================== */
.sub-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999;
}

.sub-modal {
  width: min(980px, 100%);
  min-height: 360px;
  background: #fff;
  border-radius: 22px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 340px 1fr;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.45);
  position: relative;
  outline: none;
}

.sub-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: grid;
  place-items: center;
}
.sub-close .mdi { font-size: 20px; }

.sub-left {
  background: #00cfd0;
  display: grid;
  place-items: center;
  padding: 28px;
}

.sub-left-inner { text-align: center; color: #fff; }

.sub-icon {
  width: 86px;
  height: 86px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.18);
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
}
.sub-icon .mdi { font-size: 44px; }

.sub-left-title {
  font-size: 30px;
  line-height: 1.1;
  margin: 0 0 10px;
  font-weight: 850;
  letter-spacing: -0.02em;
}
.sub-left-sub { margin: 0; opacity: 0.95; font-weight: 600; }

.sub-right { padding: 34px 34px 26px; color: #111; }

.sub-title {
  margin: 0 0 10px;
  font-size: 30px;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.sub-desc {
  margin: 0 0 18px;
  color: #4b5563;
  font-weight: 600;
  line-height: 1.55;
}

.sub-steps { display: grid; gap: 14px; margin-bottom: 22px; }

.step {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  align-items: start;
}
.step .n {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #00cfd0;
  color: #fff;
  font-weight: 900;
  display: grid;
  place-items: center;
}
.step .t { margin: 0; font-weight: 850; color: #111; }
.step .d { margin: 2px 0 0; color: #6b7280; font-weight: 600; }

.sub-cta {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 999px;
  background: #00cfd0;
  color: #111;
  text-decoration: none;
  font-weight: 900;
  letter-spacing: 0.08em;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s, filter 0.15s;
}
.sub-cta:hover { transform: translateY(-1px); filter: brightness(0.98); }
.sub-cta .mdi { font-size: 22px; }

.sub-foot {
  margin: 14px 0 0;
  text-align: center;
  color: #9ca3af;
  font-weight: 650;
}

@media (max-width: 860px) {
  .sub-modal { grid-template-columns: 1fr; }
  .sub-left { padding: 22px; }
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.pop-enter-active,
.pop-leave-active { transition: transform 0.18s ease, opacity 0.18s ease; }
.pop-enter-from,
.pop-leave-to { transform: translateY(10px) scale(0.985); opacity: 0; }
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