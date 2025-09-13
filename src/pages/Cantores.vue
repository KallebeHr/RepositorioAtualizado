<template>
  <div class="cantores-page">
    <header class="header">
      <h1 class="title">🎤 Nossos Cantores 🎤</h1>
      <p class="subtitle">Clique no cantor para baixar todas as músicas em ZIP</p>
    </header>

    <section class="search">
      <input
        v-model="busca"
        type="text"
        placeholder="🔍 Pesquisar cantores..."
      />
    </section>

    <div v-if="loading" class="status">Carregando cantores...</div>
    <div v-if="error" class="status error">{{ error }}</div>

    <div v-if="!loading && filtrados.length" class="grid">
      <div v-for="c in filtrados" :key="c" class="card">
        <div class="cover-container">
          <img
            src="/LogoMusic.jpg"
            class="cover"
            alt="Foto do cantor"
          />
        </div>
        <div class="info">
          <h2 class="cantor-name">{{ c }}</h2>
          <p class="track-count">{{ countMusicas(c) }} músicas</p>
        </div>
        <div class="actions">
          <button
            class="primary"
            :disabled="progress[c] && progress[c] < 100"
            @click="handleDownload(c)"
          >
            ⬇ {{ progress[c] && progress[c] < 100 ? `${progress[c]}%` : 'Baixar tudo' }}
          </button>
        </div>

        <v-progress-linear
          v-if="progress[c] !== undefined"
          :model-value="progress[c]"
          color="blue-darken-3"
          height="6"
          rounded
          striped
          class="progress-bar"
        ></v-progress-linear>
      </div>
    </div>

    <div v-if="!loading && !filtrados.length" class="status">
      Nenhum cantor encontrado.
    </div>

    <button v-show="showScrollTop" class="scroll-top" @click="scrollToTop">
      ⬆
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, reactive } from "vue"
import { db } from "@/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { useToast } from "vue-toast-notification"
import { useUserStore } from "@/stores/userStore"

const loading = ref(true)
const error = ref("")
const showScrollTop = ref(false)
const cantores = ref([])
const musicas = ref([])
const busca = ref("")
const toast = useToast()
const userStore = useUserStore()

const progress = reactive({})

// Buscar músicas do Firestore
async function fetchMusicas() {
  try {
    loading.value = true
    const q = query(collection(db, "musicas"), orderBy("createdAt", "desc"))
    const qs = await getDocs(q)
    musicas.value = qs.docs.map(d => ({ id: d.id, ...d.data() }))
    cantores.value = [...new Set(musicas.value.map(m => m.cantor).filter(Boolean))]
  } catch (err) {
    console.error("[Cantores] erro ao buscar:", err)
    error.value = "Erro ao buscar cantores."
  } finally {
    loading.value = false
  }
}

function countMusicas(cantor) {
  return musicas.value.filter(m => m.cantor === cantor).length
}

// Função intermediária para checar assinatura antes do download
function handleDownload(cantor) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Você precisa ativar a assinatura para baixar músicas 🎶")
    return
  }
  downloadAll(cantor)
}

// Download ZIP com progresso
async function downloadAll(cantor) {
  try {
    const tracks = musicas.value.filter(m => m.cantor === cantor && m.downloadUrl)
    if (!tracks.length) {
      toast.warning("Nenhuma música disponível para download")
      return
    }

    const JSZip = (await import("jszip")).default
    const zip = new JSZip()
    progress[cantor] = 0

    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i]
      const res = await fetch(t.downloadUrl)
      const blob = await res.blob()
      zip.file(t.fileName || `${t.title || "musica"}.mp3`, blob)
      progress[cantor] = Math.round(((i + 1) / tracks.length) * 100)
    }

    const content = await zip.generateAsync({ type: "blob" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(content)
    a.download = `${cantor}-musicas.zip`
    a.click()
    URL.revokeObjectURL(a.href)

    toast.success(`ZIP de ${cantor} baixado!`)
    progress[cantor] = 100
    setTimeout(() => delete progress[cantor], 2000)
  } catch (err) {
    console.error("[Cantores] erro no download:", err)
    toast.error("Falha ao baixar ZIP")
    delete progress[cantor]
  }
}

// Scroll-top
function handleScroll() { showScrollTop.value = window.scrollY > 200 }
function scrollToTop() { window.scrollTo({ top: 0, behavior: "smooth" }) }

const filtrados = computed(() => {
  const term = busca.value.toLowerCase()
  return cantores.value.filter(c => c.toLowerCase().includes(term))
})

function getRandomCover(cantor) {
  const idx = cantor.length % 5 + 1
  return `/cantores/${idx}.jpg`
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

.cantores-page { width: 100%; padding: 24px 32px;     background-color: #121212;
; color: #fff; font-family: Inter, system-ui, sans-serif; }
.header { text-align: center; margin-bottom: 32px; }
.title { font-size: 40px; font-weight: 900; background: linear-gradient(90deg, #1db954, #00c3ff, #1db954); -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shine 4s infinite linear; }
@keyframes shine { from { background-position: -200px; } to { background-position: 200px; } }
.subtitle { color: #9aa0a6; font-size: 16px; }
.search { margin: 20px 0; }
.search input { width: 100%; padding: 14px 18px; border-radius: 14px; border: 1px solid #2a2a2a; background: #181818; color: #fff; font-size: 15px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 22px; margin-bottom: 5rem; }
.card { background: #181818; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; align-items: center; border: 1px solid #242424; transition: all 0.25s ease; }
.card:hover { background: #1d1d1d; border-color: #2a2a2a; transform: translateY(-4px); }
.cover-container { width: 100%; height: 180px; overflow: hidden; border-radius: 12px; margin-bottom: 12px; }
.cover { width: 100%; height: 100%; object-fit: cover; }
.info { text-align: center; }
.cantor-name { font-size: 18px; font-weight: 700; margin: 0 0 6px; color: #fff; }
.track-count { font-size: 14px; color: #9aa0a6; }
.actions { width: 100%; margin-top: 12px; }
button.primary { width: 100%; height: 40px; border-radius: 8px; border: none; background: #1db954; color: #0b0b0b; cursor: pointer; font-weight: 600; transition: all 0.2s; }
button.primary:disabled { opacity: 0.7; cursor: not-allowed; }
button.primary:hover:not(:disabled) { filter: brightness(1.08); }
.progress-bar { margin-top: 8px; width: 100%; }
.status { margin: 20px 0; color: #e0e0e0; text-align: center; }
.status.error { color: #ff7676; }
.scroll-top { position: fixed; bottom: 100px; left: 20px; background: #1db954; color: #0b0b0b; border: none; border-radius: 50%; width: 48px; height: 48px; font-size: 20px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.4); transition: all 0.2s; z-index: 1000; }
.scroll-top:hover { filter: brightness(1.1); }
@media (max-width: 768px) { .grid { grid-template-columns: 1fr; } .cover-container { height: 140px; } }
</style>
