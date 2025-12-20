<template>
  <div class="top-cantores">
    <header class="header">
      <h2>🔥 Top 10 Músicas 🔥</h2>
      <p>As músicas mais ouvidas da plataforma</p>
      <p class="indicador">Arraste para o lado</p>
    </header>

    <Swiper
      :slides-per-view="1"
      :space-between="12"
      :breakpoints="{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }"
    >
      <SwiperSlide
        v-for="(m, index) in topMusicas"
        :key="m.id"
      >
        <div class="card">
          <span class="rank">{{ index + 1 }}</span>

          <img
            :src="m.coverUrl || '/LogoMusic.jpg'"
            class="cover"
          />

          <h3 class="nome">{{ m.title }}</h3>

          <p class="meta">
            {{ m.cantor }} 
          </p>
          <p class="metas">
          {{ m.playCount || 0 }} plays
          </p>

          <button
            class="primary"
            :disabled="progress[m.id] && progress[m.id] < 100"
            @click="handleDownload(m)"
          >
            ⬇
            {{
              progress[m.id] && progress[m.id] < 100
                ? progress[m.id] + "%"
                : "Baixar"
            }}
          </button>

          <v-progress-linear
            v-if="progress[m.id] !== undefined"
            :model-value="progress[m.id]"
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
  getDocs,
  doc,
  updateDoc,
  increment
} from "firebase/firestore"
import { Swiper, SwiperSlide } from "swiper/vue"
import "swiper/css"
import { useToast } from "vue-toast-notification"
import { useUserStore } from "@/stores/userStore"

const toast = useToast()
const userStore = useUserStore()

const topMusicas = ref([])
const progress = reactive({})

/* 🔥 TOP 10 MÚSICAS */
async function fetchTopMusicas() {
  const q = query(
    collection(db, "musicas"),
    orderBy("playCount", "desc"),
    limit(10)
  )

  const snap = await getDocs(q)

  topMusicas.value = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }))
}

/* ⬇️ DOWNLOAD INDIVIDUAL */
async function handleDownload(music) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Ative a assinatura para baixar 🎶")
    return
  }

  if (!music.downloadUrl) {
    toast.warning("Arquivo indisponível")
    return
  }

  progress[music.id] = 0

  try {
    const res = await fetch(music.downloadUrl)
    const blob = await res.blob()

    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = music.fileName || `${music.title}.mp3`
    a.click()
    URL.revokeObjectURL(a.href)

    progress[music.id] = 100

    // incrementa downloadCount
    await updateDoc(doc(db, "musicas", music.id), {
      downloadCount: increment(1)
    })

    toast.success(`Download concluído: ${music.title}`)
  } catch (err) {
    toast.error("Erro ao baixar música")
  }

  setTimeout(() => delete progress[music.id], 1500)
}

onMounted(fetchTopMusicas)
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
}
.metas {
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
