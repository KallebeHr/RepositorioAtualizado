<template>
  <section class="music-start-root">
    <div class="music-start-container">
      <header class="music-header">
        <h1 v-if="!userStore.loadingUser">Olá, {{ userStore.user.name }}</h1>
        <h1 v-else>Olá...</h1>

        <span class="subtitle">As 24 MÚSICAS MAIS TOCADAS PARA VOCÊ COMEÇAR</span>
        <p class="indicador">Arraste para o lado</p> <i class="mdi mdi-Chevron-Right"></i> 
      </header>

      <Swiper
        class="music-swiper"
        :slides-per-view="1"
        :space-between="1"
        :breakpoints="{
          768: { slidesPerView: 2 },
          1200: { slidesPerView: 3 }
        }"
        :modules="[Pagination]"
  :pagination="{ clickable: true }"
      >
      <SwiperSlide v-for="(page, index) in pages" :key="index">
          <ul class="music-list">
            <li
              v-for="m in page"
              :key="m.id"
              class="music-row"
              @click="handleCardTap(m)"
              :modules="[Navigation]"
  navigation

            >
              <!-- CAPA -->
              <div class="left">
                <div class="cover-wrapper">
                  <img :src="m.cover || '/LogoMusic.jpg'" class="cover" />
                  <span class="mdi mdi-play play-icon"></span>
                </div>
              </div>

              <!-- INFO -->
              <div class="center">
                <p class="title">{{ m.title }}</p>
                <p class="artist">{{ m.artist }}</p>
              </div>

              <!-- AÇÕES (SÓ DESKTOP) -->
              <div class="right">
                <button
                  class="icon-btn"
                  :class="{ active: isFavorite(m.id) }"
                  @click.stop="toggleFavorite(m)"
                >
                  <span class="mdi mdi-heart"></span>
                </button>

                <button class="icon-btn" @click.stop="downloadMusic(m)">
                  <span class="mdi mdi-download"></span>
                </button>

                <button class="icon-btn" @click.stop="addToQueue(m)">
                  <span class="mdi mdi-playlist-plus"></span>
                </button>
              </div>
            </li>
          </ul>
        </SwiperSlide>
      </Swiper>
    </div>
  </section>
</template>

<script setup>
  import { Pagination, Navigation  } from "swiper/modules"
import "swiper/css/pagination"
import "swiper/css/navigation"
import { ref, onMounted } from "vue"
import { db  } from "@/firebase"
import {
  collection,
  getDocs,
  query,
  limit,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  orderBy
} from "firebase/firestore"

import { Swiper, SwiperSlide } from "swiper/vue"
import "swiper/css"

import { useUserStore } from "@/stores/userStore"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { useToast } from "vue-toast-notification"

const userStore = useUserStore()
const player = usePlayerStore()
const toast = useToast()

const musicas = ref([])
const pages = ref([])

/* ======================
   GUARD DE ASSINATURA
====================== */
function requireSubscription() {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Assinatura necessária, clique aqui para ativar")
    return false
  }
  return true
}

/* FETCH */
async function fetchMusicas() {
  const q = query(
    collection(db, "musicas"),
    orderBy("playCount", "desc"), // 🔥 mais tocadas primeiro
    limit(24)
  )

  const snap = await getDocs(q)

  musicas.value = snap.docs.map(d => ({
    id: d.id,
    title: d.data().title,
    artist: d.data().cantor,
    cover: d.data().coverUrl,
    downloadUrl: d.data().downloadUrl,
    fileName: `${d.data().title}.mp3`,
    playCount: d.data().playCount || 0
  }))

  paginate()
}


/* PAGINAÇÃO */
function paginate() {
  const size = 8
  pages.value = []
  for (let i = 0; i < musicas.value.length; i += size) {
    pages.value.push(musicas.value.slice(i, i + size))
  }
}

/* ======================
        PLAYER
====================== */
function handleCardTap(m) {
  if (!requireSubscription()) return

  // Desktop
  if (window.innerWidth > 768) {
    playMusic(m)
    return
  }

  // Mobile
  player.addToQueue(m, { playNow: true })
  player.isOpen = true
}

function playMusic(m) {
  if (!requireSubscription()) return

  player.addToQueue(m, { playNow: true })

  updateDoc(doc(db, "musicas", m.id), {
    playCount: increment(1)
  })
}

function addToQueue(m) {
  if (!requireSubscription()) return
  player.addToQueue(m, { playNow: false })
}

/* ======================
        DOWNLOAD
====================== */
async function downloadMusic(m) {
  if (!requireSubscription()) return

  const res = await fetch(m.downloadUrl)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = m.fileName
  a.click()
  URL.revokeObjectURL(url)

  await updateDoc(doc(db, "musicas", m.id), {
    downloadCount: increment(1)
  })
}

/* ======================
        FAVORITOS
====================== */
function isFavorite(id) {
  return userStore.user?.favorites?.includes(id)
}

async function toggleFavorite(m) {
  if (!requireSubscription()) return

  const refUser = doc(db, "users", userStore.user.uid)

  // 🔒 garante que o array existe
  if (!Array.isArray(userStore.user.favorites)) {
    userStore.user.favorites = []
  }

  if (isFavorite(m.id)) {
    await updateDoc(refUser, {
      favorites: arrayRemove(m.id)
    })

    userStore.user.favorites =
      userStore.user.favorites.filter(x => x !== m.id)

  } else {
    await updateDoc(refUser, {
      favorites: arrayUnion(m.id)
    })

    userStore.user.favorites.push(m.id)
  }
}


onMounted(fetchMusicas)
</script>


<style scoped>
.music-start-root {
  width: 100%;
  background: #111;
}

.music-start-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
}

/* HEADER */
.music-header {
  margin-bottom: 24px;
}

.music-header h1 {
  font-size: 1rem;
  font-weight: 800;
}

.subtitle {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: #94a3b8;
  font-weight: 600;
}

.indicador {
  margin-top: 12px;
  font-size: 0.85rem;
  color: #777;
  text-align: center;
}

/* LISTA */
.music-list {
  width: 100%;
  max-width: 360px;
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* CARD */
.music-row {
  position: relative;
  display: flex;
  align-items: center;
  height: 72px;
  padding: 0 12px;
  border-radius: 12px;
  background: #0f0f0f;
  cursor: pointer;
  transition: background 0.2s;
}

.music-row:hover {
  background: #1a1a1a;
}

/* LEFT */
.cover-wrapper {
  width: 52px;
  height: 52px;
  position: relative;
}

.cover {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
}

.play-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 8px;
  opacity: 0;
}

.music-row:hover .play-icon {
  opacity: 1;
}

/* CENTER */
.center {
  flex: 1;
  min-width: 0;
  margin-left: 12px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.artist {
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* AÇÕES (DESKTOP ONLY) */
.right {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 6px;
  opacity: 0;
  pointer-events: none;
}

@media (hover: hover) and (pointer: fine) {
  .music-row:hover .right {
    opacity: 1;
    pointer-events: auto;
  }
}

/* BOTÕES */
.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: #aaa;
  cursor: pointer;
}
@keyframes swipe-hint {
  0% { transform: translateX(0); }
  50% { transform: translateX(-10px); }
  100% { transform: translateX(0); }
}

.music-swiper {
  animation: swipe-hint 1.5s ease-in-out 2;
}

.icon-btn:hover {
  color: #fff;
}

.icon-btn.active {
  color: #ff4d6d;
}

/* MOBILE */
@media (max-width: 640px) {
  .music-start-container {
    padding: 20px;
  }

  .right {
    display: none;
  }
}
</style>
