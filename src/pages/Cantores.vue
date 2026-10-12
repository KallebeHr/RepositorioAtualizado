<template>
  <div class="cantores-page">
    <header class="header">
      <h1 class="title">🎤 Nossos Cantores 🎤</h1>
      <p class="subtitle">Ouça por cantor, explore as pastas e baixe suas músicas.</p>
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
        <FolderSummary :tracks="musicas.filter(m=>m.cantor===c)"/>
        <div class="actions">
<button @click="follow(c)">{{ followed(c)?'Seguindo':'Seguir cantor' }}</button>
          <button @click="router.push({path:'/Pastas',query:{cantor:c}})">Ouvir e ver pastas</button>
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
import {useLibraryStore} from '@/stores/useLibraryStore'
import {useDownloadStore} from '@/stores/useDownloadStore'
import {artistKey} from '@/utils/music-library.mjs'
import FolderSummary from '@/components/FolderSummary.vue'
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { useRouter } from "vue-router"
import { db } from "@/firebase"
import { useToast } from "vue-toast-notification"
import { useUserStore } from "@/stores/userStore"
import { doc, setDoc, updateDoc, increment, serverTimestamp,collection, query, orderBy, getDocs, where  } from "firebase/firestore"


const loading = ref(true)
const error = ref("")
const showScrollTop = ref(false)
const cantores = ref([])
const musicas = ref([])
const busca = ref("")
const router = useRouter()
const toast = useToast()
const userStore = useUserStore()

const downloads=useDownloadStore(),library=useLibraryStore()
const progress = computed(()=>Object.fromEntries([...downloads.jobs].reverse().filter(j=>j.mode==='zip').map(j=>[j.label.replace(/-musicas$/,''),j.status==='running'||j.status==='queued'?Math.min(99,j.progress||1):100])))
const followed=name=>library.following.some(n=>artistKey(n)===artistKey(name))
async function follow(name){try{await library.follow(name)}catch(e){toast.error(e.message)}}

// Buscar músicas do Firestore
async function fetchMusicas() {
  try {
    loading.value = true
    const q = query(collection(db, "musicasV2"), orderBy("createdAt", "desc"))
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
async function incrementDownloadCantor(cantor) {
  console.log("🔥 [DOWNLOAD] Cantor recebido:", cantor)

  try {
    const colRef = collection(db, "cantoresV2")

    console.log("🔎 [DOWNLOAD] Buscando cantor no Firestore...")
    const q = query(colRef, where("nome", "==", cantor))
    const snap = await getDocs(q)

    if (!snap.empty) {
      // 👉 cantor existe
      const docRef = snap.docs[0].ref

      console.log("📄 [DOWNLOAD] Documento encontrado:", docRef.id)

      await updateDoc(docRef, {
        downloads: increment(1)
        
      })

      console.log("✅ [DOWNLOAD] Downloads incrementado com sucesso!")
    } else {
      // 👉 cantor NÃO existe
      console.warn("⚠️ [DOWNLOAD] Cantor não encontrado, criando novo documento")

      const newDoc = await addDoc(colRef, {
        nome: cantor,
        downloads: 1,
        createdAt: serverTimestamp()
      })

      console.log("🆕 [DOWNLOAD] Novo cantor criado:", newDoc.id)
    }
  } catch (err) {
    console.error("🚨 [DOWNLOAD] ERRO ao contar download:", err)
  }
}

function countMusicas(cantor) {
  return musicas.value.filter(m => m.cantor === cantor).length
}

// Função intermediária para checar assinatura antes do download
function handleDownload(cantor) {
  //  toast.warning("Desativa por enquanto 🎶");

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

    await downloads.enqueue(tracks,'zip',cantor+'-musicas')
    await incrementDownloadCantor(cantor)
    toast.success('Pasta adicionada à central de downloads. Você pode navegar.')
  } catch (err) {
    console.error("[Cantores] erro no download:", err)
    toast.error("Falha ao baixar ZIP")


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
    height: 98vh;

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
