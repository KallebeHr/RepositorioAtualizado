<template>
  <div class="repertorio-page">
    <header class="header">
      <h1 class="title">🎶 Repertório 🎶</h1>
      <p class="subtitle">Clique no botão para baixar todas as músicas em ZIP</p>
    </header>

    <div v-if="loading" class="status">Carregando músicas...</div>
    <div v-if="error" class="status error">{{ error }}</div>

    <div v-if="!loading && musicas.length" class="card-repertorio">
      <div class="info">
        <h2>Repertório Outubro</h2>
        <p>{{ musicas.length }} músicas disponíveis</p>
      </div>

      <div class="actions">
        <button
          class="primary"
          :disabled="progress > 0 && progress < 100"
          @click="handleDownloadAll"
        >
          ⬇ {{ progress > 0 && progress < 100 ? `${progress}%` : 'Baixar tudo' }}
        </button>
      </div>

      <v-progress-linear
        v-if="progress !== null"
        :model-value="progress"
        color="blue-darken-3"
        height="6"
        rounded
        striped
        class="progress-bar"
      ></v-progress-linear>
    </div>

    <div v-if="!loading && !musicas.length" class="status">
      Nenhuma música disponível.
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { db } from "@/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { useUserStore } from "@/stores/userStore"
import { useToast } from "vue-toast-notification"

const loading = ref(true)
const error = ref("")
const musicas = ref([])
const progress = ref(null)
const showScrollTop = ref(false)

const toast = useToast()
const userStore = useUserStore()

// Buscar músicas
async function fetchMusicas() {
  try {
    loading.value = true
    const q = query(collection(db, "musicas"), orderBy("createdAt", "desc"))
    const qs = await getDocs(q)
    musicas.value = qs.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error("[Repertorio] erro ao buscar:", err)
    error.value = "Erro ao buscar músicas."
  } finally {
    loading.value = false
  }
}

// Normaliza track
function normalizeTrack(m) {
  return {
    title: m.title || m.fileName || "Sem título",
    cantor: m.cantor || "—",
    estilos: m.estilos || "—",
    downloadUrl: m.downloadUrl,
    fileName: m.fileName || (m.title ? `${m.title}.mp3` : "musica.mp3"),
    fileId: m.id
  }
}

async function handleDownloadAll() {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Você precisa ativar a assinatura para baixar músicas 🎶")
    return
  }

  try {
    let counter = 3

    const interval = setInterval(() => {
      toast.info(`Obrigado por comprar nosso repertório, você será redirecionado em ${counter}...`)
      counter--

      if (counter < 0) {
        clearInterval(interval)
        window.location.href = "https://www.mediafire.com/folder/tfb99z6tatwja/OUTUBRO"
      }
    }, 1000)

  } catch (err) {
    console.error("[Repertorio] erro ao iniciar o redirecionamento:", err)
    toast.error("Erro ao redirecionar para a página de download")
    progress.value = null
  }
}


// Scroll-top
function handleScroll() { showScrollTop.value = window.scrollY > 200 }
function scrollToTop() { window.scrollTo({ top: 0, behavior: "smooth" }) }

onMounted(() => {
  fetchMusicas()
  window.addEventListener("scroll", handleScroll)
})
onBeforeUnmount(() => window.removeEventListener("scroll", handleScroll))
</script>

<style scoped>
.repertorio-page {
  width: 100%;
  padding: 24px 32px;
    background-color: #121212;
    height: 98vh;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header { text-align: center; margin-bottom: 32px; }
.title {
  font-size: 40px;
  font-weight: 900;
  background: linear-gradient(90deg, #1db954, #00c3ff, #1db954);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 4s infinite linear;
}
@keyframes shine { from { background-position: -200px; } to { background-position: 200px; } }
.subtitle { color: #9aa0a6; font-size: 16px; text-align: center; margin-bottom: 24px; }

/* Card Repertorio */
.card-repertorio {
  background: linear-gradient(135deg, #1db954, #00c3ff);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  width: 100%;
  max-width: 420px;
  color: #fff;
  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
  transition: all 0.3s ease;
}
.card-repertorio:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
}
.card-repertorio h2 { font-size: 26px; font-weight: 700; margin-bottom: 8px; }
.card-repertorio p { font-size: 16px; margin-bottom: 16px; }

.actions { margin-bottom: 12px; }
button.primary {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: #0b0b0b;
  color: #1db954;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
button.primary:disabled { opacity: 0.7; cursor: not-allowed; }
button.primary:hover:not(:disabled) {
  color: #fff;
  background: #1db954;
}
button.primary::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: rgba(255,255,255,0.1);
  transform: skewX(-20deg);
  transition: all 0.5s ease;
}
button.primary:hover::after {
  left: 100%;
}

.progress-bar { margin-top: 12px; width: 100%; border-radius: 10px; }

.status { margin: 20px 0; color: #e0e0e0; text-align: center; }
.status.error { color: #ff7676; }


@media (max-width: 768px) {
  .card-repertorio { padding: 24px; }
  button.primary { height: 44px; font-size: 15px; }
}
</style>
