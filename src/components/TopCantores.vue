<template>
  <div class="top-cantores">
    <header class="header">
      <h2>🔥 Top 10 Cantores 🔥</h2>
      <p>Os cantores mais baixados da plataforma</p>
            <p class="indicador">Arraste para o lado</p>

    </header>

    <Swiper
      :slides-per-view="1"
      :space-between="1"
      :breakpoints="{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }"
      class="swiper"
    >
      <SwiperSlide v-for="(c, index) in topCantores" :key="c.id">
        <div class="card">
          <span class="rank">{{ index + 1 }}</span>

          <img src="/LogoMusic.jpg" class="cover" />

          <h3 class="nome">{{ c.nome }}</h3>
          <p class="meta">
            {{ c.downloads || 0 }} downloads • {{ countMusicas(c.nome) }} músicas
          </p>

          <button
            class="primary"
            :disabled="progress[c.nome] && progress[c.nome] < 100"
            @click="handleDownload(c.nome)"
          >
            ⬇
            {{ progress[c.nome] && progress[c.nome] < 100
              ? progress[c.nome] + "%"
              : "Baixar tudo" }}
          </button>

          <v-progress-linear
            v-if="progress[c.nome] !== undefined"
            :model-value="progress[c.nome]"
            height="5"
            rounded
          />
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue"
import { db } from "@/firebase"
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore"
import { Swiper, SwiperSlide } from "swiper/vue"
import "swiper/css"
import JSZip from "jszip"
import { useToast } from "vue-toast-notification"
import { useUserStore } from "@/stores/userStore"

const toast = useToast()
const userStore = useUserStore()

const topCantores = ref([])
const musicas = ref([])
const progress = reactive({})

/* 🔥 BUSCAR TOP 10 */
async function fetchTopCantores() {
  const q = query(
    collection(db, "cantores"),
    orderBy("downloads", "desc"),
    limit(10)
  )

  const snap = await getDocs(q)
  topCantores.value = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }))
}

/* 🎵 Buscar músicas */
async function fetchMusicas() {
  const snap = await getDocs(collection(db, "musicas"))
  musicas.value = snap.docs.map(d => d.data())
}

function countMusicas(nome) {
  return musicas.value.filter(m => m.cantor === nome).length
}

/* ⬇️ Download */
async function handleDownload(cantor) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Ative a assinatura para baixar 🎶")
    return
  }

  await downloadAll(cantor)
}

async function downloadAll(cantor) {
  const tracks = musicas.value.filter(
    m => m.cantor === cantor && m.downloadUrl
  )

  if (!tracks.length) {
    toast.warning("Nenhuma música disponível")
    return
  }

  const zip = new JSZip()
  progress[cantor] = 0

  for (let i = 0; i < tracks.length; i++) {
    const res = await fetch(tracks[i].downloadUrl)
    const blob = await res.blob()
    zip.file(tracks[i].fileName || `musica-${i}.mp3`, blob)
    progress[cantor] = Math.round(((i + 1) / tracks.length) * 100)
  }

  const content = await zip.generateAsync({ type: "blob" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(content)
  a.download = `${cantor}.zip`
  a.click()
  URL.revokeObjectURL(a.href)

  toast.success(`Download de ${cantor} concluído`)
  setTimeout(() => delete progress[cantor], 2000)
}

onMounted(() => {
  fetchTopCantores()
  fetchMusicas()
})
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

.top-cantores {
  width: 100%;
  padding: 16px 0;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
}

.header {
    display: flex;
  padding: 0 16px;
  margin-bottom: 16px;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}

.header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
}

.header p {
  font-size: 14px;
  color: #6b7280;
}

/* ===== Swiper ===== */

.swiper-wrapper-fix {
  width: 100%;
  overflow: hidden;
}

.swiper-fix {
  width: 100%;
  padding-bottom: 8px;
}

.swiper-slide {
  display: flex;
  justify-content: center;
  height: auto;
}

/* ===== Card ===== */

.card {
  width: 100%;
  max-width: 260px;
  height: 360px; /* 🔒 ALTURA FIXA */
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  background: linear-gradient(180deg, #ffffff, #f9fafb);
  border-radius: 18px;
  padding: 16px;
  box-sizing: border-box;

  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* ===== Ranking ===== */

.rank {
    display: flex;
    align-items: center;
    justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  padding: 4px 10px;
  border-radius: 999px;
}

/* ===== Cover ===== */

.cover {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 14px;
  margin: 12px 0;
}

/* ===== Texto ===== */

.nome {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.meta {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

/* ===== Botão ===== */

.primary {
  width: 100%;
  height: 42px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.indicador {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #777;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
}
.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35);
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== Progress ===== */

.v-progress-linear {
  margin-top: 8px;
  border-radius: 999px;
}


</style>
