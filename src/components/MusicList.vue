<template>
  <div class="music-page">
    <!-- Header -->
    <header class="header">
      <h1 class="title">🎶 Repertório Completo 🎶</h1>
      <p class="subtitle">Explore músicas, artistas e ritmos • Adicione à fila • Toque agora • Baixe</p>
    </header>

    <!-- Cantores -->
    <section class="chips">
      <h3>Cantores</h3>
      <div class="chip-grid">
        <button
          v-for="c in cantores"
          :key="c"
          class="chip"
          :class="{ active: filtros.cantor === c }"
          @click="filtros.cantor = filtros.cantor === c ? '' : c"
        >
          {{ c }}
        </button>
      </div>
    </section>

    <!-- Ritmos -->
    <section class="chips">
      <h3>Ritmos</h3>
      <div class="chip-grid">
        <button
          v-for="r in ritmos"
          :key="r"
          class="chip"
          :class="{ active: filtros.ritmo === r }"
          @click="filtros.ritmo = filtros.ritmo === r ? '' : r"
        >
          {{ r }}
        </button>
      </div>
    </section>

    <!-- Pesquisa -->
    <section class="search">
      <input
        v-model="filtros.busca"
        type="text"
        placeholder="🔍 Pesquisar músicas, cantores ou ritmos..."
      />
    </section>

    <!-- Selects -->
    <section class="filters">
      <div class="filter">
        <label>Cantores</label>
        <select v-model="filtros.cantor">
          <option value="">Todos</option>
          <option v-for="c in cantores" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="filter">
        <label>Ritmos</label>
        <select v-model="filtros.ritmo">
          <option value="">Todos</option>
          <option v-for="r in ritmos" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
    </section>

    <!-- Status -->
    <div v-if="loading" class="status">Carregando músicas...</div>
    <div v-if="error" class="status error">{{ error }}</div>

    <!-- Lista de músicas -->
    <div v-if="!loading && filtradas.length" class="grid">
      <div v-for="m in filtradas" :key="m.fileId || m.id" class="card">
        <img src="/LogoMusic.jpg" class="cover" />
        <div class="info">
          <h2 class="track-title">{{ m.title || m.fileName || "—" }}</h2>
          <p class="track-meta">
            <span>{{ m.cantor || "—" }}</span> • <span>{{ m.ritmo || "—" }}</span>
          </p>
        </div>
        <div class="actions">
          <button class="ghost" @click="enqueue(m)" title="Adicionar à fila">➕</button>
          <button class="primary" @click="playNow(m)" title="Tocar agora">▶</button>
          <button class="ghost" @click="download(m)" title="Baixar">⬇</button>
        </div>
      </div>
    </div>

    <div v-if="!loading && !filtradas.length" class="status">
      Nenhuma música encontrada.
    </div>

    <!-- Botão de voltar ao topo -->
    <button v-show="showScrollTop" class="scroll-top" @click="scrollToTop">
      ⬆
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { db } from "@/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { usePlayerStore } from "@/stores/usePlayerStore"

const musicas = ref([])
const loading = ref(true)
const error = ref("")
const player = usePlayerStore()
const showScrollTop = ref(false)

// Filtros
const filtros = ref({ cantor: "", ritmo: "", busca: "" })

const cantores = computed(() =>
  [...new Set(musicas.value.map(m => m.cantor).filter(Boolean))]
)
const ritmos = computed(() =>
  [...new Set(musicas.value.map(m => m.ritmo).filter(Boolean))]
)

const filtradas = computed(() => {
  return musicas.value.filter(m => {
    const busca = filtros.value.busca.toLowerCase()
    return (
      (!filtros.value.cantor || m.cantor === filtros.value.cantor) &&
      (!filtros.value.ritmo || m.ritmo === filtros.value.ritmo) &&
      (!busca ||
        (m.title && m.title.toLowerCase().includes(busca)) ||
        (m.cantor && m.cantor.toLowerCase().includes(busca)) ||
        (m.ritmo && m.ritmo.toLowerCase().includes(busca)))
    )
  })
})

async function fetchMusicas() {
  try {
    loading.value = true
    console.log("[MusicList] buscando músicas do Firestore…")
    const q = query(collection(db, "musicas"), orderBy("createdAt", "desc"))
    const qs = await getDocs(q)
    musicas.value = qs.docs.map(d => ({ id: d.id, ...d.data() }))
    console.log("[MusicList] total:", musicas.value.length, musicas.value)
  } catch (err) {
    console.error("[MusicList] erro ao buscar:", err)
    error.value = "Erro ao buscar músicas."
  } finally {
    loading.value = false
  }
}

function normalizeTrack(m) {
  const t = {
    title: m.title || m.fileName || "Sem título",
    cantor: m.cantor || "—",
    ritmo: m.ritmo || "—",
    downloadUrl: m.downloadUrl,
    fileName: m.fileName || (m.title ? `${m.title}.mp3` : "musica.mp3"),
    fileId: m.fileId || m.id,
  }
  if (!t.downloadUrl) console.warn("[MusicList] registro sem downloadUrl:", m)
  return t
}

function enqueue(m) {
  const t = normalizeTrack(m)
  console.log("[MusicList] enqueue:", t.title)
  player.addToQueue(t, { playNow: false })
}

function playNow(m) {
  const t = normalizeTrack(m)
  console.log("[MusicList] playNow:", t.title)
  player.addToQueue(t, { playNow: true })
}

function download(m) {
  const t = normalizeTrack(m)
  if (!t.downloadUrl) return
  console.log("[MusicList] download:", t.title, t.downloadUrl)

  const a = document.createElement("a")
  a.href = t.downloadUrl
  a.download = t.fileName
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// scroll-top
function handleScroll() {
  showScrollTop.value = window.scrollY > 200
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" })
}
onMounted(() => {
  fetchMusicas()
  window.addEventListener("scroll", handleScroll)
})
onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll)
})
</script>

<style scoped>
.music-page {
  width: 100%;
  padding: 24px 32px;
  background: #111;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 32px;
}
.title {
  font-size: 40px;
  font-weight: 900;
  background: linear-gradient(90deg, #1db954, #00c3ff, #1db954);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 4s infinite linear;
}
@keyframes shine {
  from {
    background-position: -200px;
  }
  to {
    background-position: 200px;
  }
}
.subtitle {
  color: #9aa0a6;
  font-size: 16px;
}

/* Chips */
.chips {
  margin-bottom: 24px;
}
.chips h3 {
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #ccc;
}
.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chip {
  padding: 10px 18px;
  border-radius: 20px;
  background: #202020;
  color: #eaeaea;
  border: 1px solid #2a2a2a;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.chip:hover {
  background: #2a2a2a;
}
.chip.active {
  background: #1db954;
  color: #0b0b0b;
}

/* Pesquisa */
.search {
  margin: 20px 0;
}
.search input {
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid #2a2a2a;
  background: #181818;
  color: #fff;
  font-size: 15px;
}

/* Selects */
.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}
.filter {
  flex: 1;
  min-width: 180px;
}
.filter label {
  display: block;
  margin-bottom: 6px;
  color: #9aa0a6;
  font-size: 14px;
}
.filter select {
  width: 100%;
  background: #181818;
  color: #fff;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 10px 14px;
}

/* Status */
.status {
  margin: 20px 0;
  color: #e0e0e0;
  text-align: center;
}
.status.error {
  color: #ff7676;
}

/* Grid de músicas */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 22px;
  margin-bottom: 5rem;
}

.card {
  background: #181818;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  border: 1px solid #242424;
  transition: all 0.25s ease;
}
.card:hover {
  background: #1d1d1d;
  border-color: #2a2a2a;
  transform: translateY(-4px);
}

.cover {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  object-fit: cover;
  margin-bottom: 12px;
}

.info {
  flex: 1;
}
.track-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 6px;
  color: #fff;
}
.track-meta {
  font-size: 14px;
  color: #9aa0a6;
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
}
button.primary,
button.ghost {
  flex: 1;
  height: 40px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
button.primary {
  background: #1db954;
  color: #0b0b0b;
}
button.primary:hover {
  filter: brightness(1.08);
}
button.ghost {
  background: #202020;
  color: #eaeaea;
  border-color: #2a2a2a;
}
button.ghost:hover {
  background: #2a2a2a;
  border-color: #333;
}

/* Mobile: cards horizontais */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .card {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }
  .cover {
    width: 80px;
    height: 80px;
    margin-bottom: 0;
  }
  .actions {
    flex-direction: column;
    gap: 6px;
    margin-top: 0;
  }
  button.primary,
  button.ghost {
    flex: none;
    width: 40px;
    height: 36px;
    padding: 0;
  }
}

/* Botão de voltar ao topo */
.scroll-top {
  position: fixed;
  bottom: 100px;
  left: 20px;
  background: #1db954;
  color: #0b0b0b;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  transition: all 0.2s;
  z-index: 1000;
}
.scroll-top:hover {
  filter: brightness(1.1);
}
</style>
