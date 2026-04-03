<template>
  <div class="page">
    <!-- BOTÃO DE BUSCA -->
    <header class="top-bar">
      <button class="btn-search" @click="openModal">
        <i class="mdi mdi-magnify"></i>
        Buscar estilos, cantores ou músicas
      </button>
    </header>

    <!-- MODAL -->
    <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <header class="modal-header">
          <h2>Buscar música</h2>
          <button class="close" @click="closeModal">
            <i class="mdi mdi-close"></i>
          </button>
        </header>

        <!-- INPUT -->
        <input
          ref="inputRef"
          v-model="queryText"
          @input="searchMusicas"
          type="text"
          class="search-input"
          placeholder="Digite um estilo, cantor ou música..."
        />

        <!-- RESULTADOS -->
        <div v-if="musicas.length" class="results">
          <div
            v-for="m in musicas"
            :key="m.id"
            class="music-card"
            @click="play(m)"
          >
            <img :src="m.coverUrl || '/LogoMusic.jpg'" class="cover" />

            <div class="info">
              <h3 class="title">{{ m.title }}</h3>
              <p class="artist">{{ m.cantor }}</p>
            </div>

            <div class="actions">
              <button @click.stop="play(m)">
                <i class="mdi mdi-play"></i>
              </button>
              <button @click.stop="addQueue(m)">
                <i class="mdi mdi-playlist-plus"></i>
              </button>
              <button @click.stop="download(m)">
                <i class="mdi mdi-download"></i>
              </button>
            </div>
          </div>
        </div>

        <p v-else class="empty">Nenhuma música encontrada</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue"
import { db } from "@/firebase"
import { collection, getDocs, doc, updateDoc, increment } from "firebase/firestore"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { useUserStore } from "@/stores/userStore"
import { useToast } from "vue-toast-notification"

const player = usePlayerStore()
const userStore = useUserStore()
const toast = useToast()

const isOpen = ref(false)
const queryText = ref("")
const musicas = ref([])
const inputRef = ref(null)

/* MODAL */
function openModal() {
  isOpen.value = true
  nextTick(() => inputRef.value?.focus())
}

function closeModal() {
  isOpen.value = false
  queryText.value = ""
  musicas.value = []
}

/* BUSCA DIRETA NO FIREBASE */
async function searchMusicas() {
  const qText = queryText.value.trim().toLowerCase()
  if (!qText) {
    musicas.value = []
    return
  }

  const snap = await getDocs(collection(db, "musicas"))
  const allMusicas = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  musicas.value = allMusicas.filter(m => {
    const title = m.title?.toLowerCase() || ""
    const cantor = m.cantor?.toLowerCase() || ""
    const tipo = Array.isArray(m.tipo) ? m.tipo.join(" ").toLowerCase() : ""
    return title.includes(qText) || cantor.includes(qText) || tipo.includes(qText)
  })
}

/* AÇÕES */
function play(m) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Ative sua assinatura 🎶")
    return
  }

  player.addToQueue(m, { playNow: true })
  updateDoc(doc(db, "musicas", m.id), { playCount: increment(1) })
}

function addQueue(m) {
  player.addToQueue(m, { playNow: false })
  toast.success("Adicionada à fila")
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
.page {
  padding: 20px;
  color: black;
}

.btn-search {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: #000;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal {
  background: #fff;
  width: 100%;
  max-width: 480px;
  border-radius: 14px;
  padding: 16px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.search-input {
  color: black;
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  margin: 16px 0;
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.music-card {
  background: #f9fafb;
  border-radius: 14px;
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 280px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.music-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.cover {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
}

.info {
  text-align: center;
}

.title {
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
}

.artist {
  font-size: 13px;
  color: #6b7280;
}

.actions {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-top: 12px;
}

.actions button {
  background: #000;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.empty {
  text-align: center;
  opacity: 0.6;
  padding: 20px;
}
</style>