<template>
  <div class="artist-page">
    <header class="header">
      <h1 class="title">🎤 Nossos Cantores 🎤</h1>
      <p class="subtitle">Explore artistas e baixe todas as músicas de cada cantor</p>
    </header>

    <!-- Grid de cantores -->
    <div v-if="loading" class="status">Carregando cantores...</div>
    <div v-if="error" class="status error">{{ error }}</div>

    <div v-if="!loading && artistas.length" class="grid">
      <div 
        v-for="a in artistas" 
        :key="a.nome" 
        class="card"
        @click="selecionarCantor(a)"
      >
        <img src="/LogoMusic.jpg" class="cover" />
        <div class="info">
          <h2 class="artist-name">{{ a.nome }}</h2>
          <p class="artist-meta">{{ a.musicas.length }} músicas</p>
        </div>
        <div class="actions">
          <button class="primary" @click.stop="baixarTodas(a)">⬇ Baixar todas</button>
        </div>
      </div>
    </div>

    <!-- Modal do cantor -->
    <div v-if="cantorSelecionado" class="modal">
      <div class="modal-content">
        <h2>{{ cantorSelecionado.nome }}</h2>
        <p>{{ cantorSelecionado.musicas.length }} músicas encontradas</p>

        <ul class="track-list">
          <li v-for="m in cantorSelecionado.musicas" :key="m.fileId || m.id">
            {{ m.title || m.fileName || "—" }}
            <button class="ghost" @click="download(m)">⬇</button>
          </li>
        </ul>

        <button class="close" @click="cantorSelecionado = null">Fechar</button>
      </div>
    </div>

    <!-- Barra de progresso -->
    <div v-if="progress.show" class="progress-container">
      <div class="progress-bar" :style="{ width: progress.percent + '%' }"></div>
      <span class="progress-text">Baixando... {{ progress.percent }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { db } from "@/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { useToast } from "vue-toast-notification";
const toast = useToast();

const musicas = ref([])
const loading = ref(true)
const error = ref("")
const cantorSelecionado = ref(null)

const progress = ref({ show: false, percent: 0 })

// Agrupa músicas por cantor
const artistas = computed(() => {
  const grupos = {}
  musicas.value.forEach(m => {
    if (!m.cantor) return
    if (!grupos[m.cantor]) grupos[m.cantor] = []
    grupos[m.cantor].push(m)
  })
  return Object.keys(grupos).map(nome => ({
    nome,
    musicas: grupos[nome]
  }))
})

async function fetchMusicas() {
  try {
    loading.value = true
    const q = query(collection(db, "musicas"), orderBy("createdAt", "desc"))
    const qs = await getDocs(q)
    musicas.value = qs.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error("[Cantores] erro ao buscar:", err)
    error.value = "Erro ao buscar músicas."
  } finally {
    loading.value = false
  }
}

function selecionarCantor(artista) {
  cantorSelecionado.value = artista
}

async function download(m) {
   toast.warning("Desativa por enquanto 🎶");

  // if (!m.downloadUrl) return
  // try {
  //   const response = await fetch(m.downloadUrl)
  //   if (!response.ok) throw new Error("Falha ao baixar arquivo")

  //   const blob = await response.blob()
  //   const url = window.URL.createObjectURL(blob)

  //   const a = document.createElement("a")
  //   a.href = url
  //   a.download = m.fileName || `${m.title || "musica"}.mp3`
  //   document.body.appendChild(a)
  //   a.click()
  //   a.remove()

  //   window.URL.revokeObjectURL(url)
  // } catch (err) {
  //   console.error("[Cantores] erro no download:", err)
  // }
}

async function baixarTodas(artista) {
   toast.warning("Desativa por enquanto 🎶");
  // if (!artista.musicas.length) return

  // const zip = new JSZip()
  // progress.value = { show: true, percent: 0 }

  // let count = 0
  // for (const m of artista.musicas) {
  //   try {
  //     const response = await fetch(m.downloadUrl)
  //     const blob = await response.blob()
  //     const nomeArquivo = m.fileName || `${m.title || "musica"}.mp3`
  //     zip.file(nomeArquivo, blob)

  //     count++
  //     progress.value.percent = Math.round((count / artista.musicas.length) * 100)
  //   } catch (err) {
  //     console.error(`[Cantores] erro baixando ${m.title}:`, err)
  //   }
  // }

  // // Gera o ZIP
  // const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
  //   progress.value.percent = Math.round(metadata.percent)
  // })

  // saveAs(content, `${artista.nome}-musicas.zip`)

  // // Reset progress
  // setTimeout(() => {
  //   progress.value = { show: false, percent: 0 }
  // }, 1500)
}

onMounted(fetchMusicas)
</script>

<style scoped>
.artist-page {
  width: 100%;
  padding: 24px 32px;
  background: #111;
    height: 98vh;

  color: #fff;
  font-family: Inter, system-ui, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}
.title {
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(90deg, #ff416c, #ff4b2b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle {
  color: #9aa0a6;
  font-size: 16px;
}

.status {
  margin: 20px 0;
  text-align: center;
  color: #e0e0e0;
}
.status.error {
  color: #ff7676;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 22px;
}

.card {
  background: #181818;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid #242424;
  cursor: pointer;
  transition: all 0.25s ease;
}
.card:hover {
  background: #1d1d1d;
  border-color: #2a2a2a;
  transform: translateY(-4px);
}
.cover {
  width: 100%;
  height: 180px;
  border-radius: 12px;
  object-fit: cover;
  margin-bottom: 12px;
}
.artist-name {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}
.artist-meta {
  font-size: 14px;
  color: #9aa0a6;
}
.actions {
  margin-top: 12px;
  width: 100%;
}
button.primary {
  width: 100%;
  background: #1db954;
  color: #0b0b0b;
  border: none;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  font-weight: 600;
}
button.primary:hover {
  filter: brightness(1.1);
}
button.ghost {
  background: #202020;
  color: #eaeaea;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  padding: 4px 10px;
  margin-left: 10px;
  cursor: pointer;
}
button.ghost:hover {
  background: #2a2a2a;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: #181818;
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}
.track-list {
  margin: 20px 0;
  list-style: none;
  padding: 0;
}
.track-list li {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 15px;
}
button.close {
  margin-top: 10px;
  background: #ff4b2b;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
}
button.close:hover {
  filter: brightness(1.1);
}

/* Barra de progresso */
.progress-container {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  background: #202020;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  text-align: center;
}
.progress-bar {
  height: 10px;
  background: #1db954;
  border-radius: 8px;
  transition: width 0.3s ease;
}
.progress-text {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  color: #ccc;
}
</style>
