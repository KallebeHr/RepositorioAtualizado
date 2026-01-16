<template>
  <section class="music-start-root">
    <div class="music-start-container">
      <header class="music-header">
        <h1 v-if="!userStore.loadingUser">Olá, {{ userStore.user.name }}</h1>
        <h1 v-else>Olá...</h1>

        <span class="subtitle">AS 24 MÚSICAS MAIS TOCADAS PARA VOCÊ COMEÇAR</span>

        <div class="hint-row">
          <p class="indicador">Arraste para o lado</p>
          <i class="mdi mdi-chevron-right"></i>
        </div>
      </header>

      <Swiper
        class="music-swiper"
        :slides-per-view="1"
        :space-between="12"
        :breakpoints="{
          768: { slidesPerView: 2 },
          1200: { slidesPerView: 3 }
        }"
        :modules="[Pagination, Navigation]"
        :pagination="{ clickable: true }"
        navigation
      >
        <SwiperSlide v-for="(page, index) in pages" :key="index">
          <ul class="music-list">
            <li
              v-for="m in page"
              :key="m.id"
              class="music-row"
              @click="handleCardTap(m)"
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
                  aria-label="Favoritar"
                >
                  <span class="mdi mdi-heart"></span>
                </button>

                <button class="icon-btn" @click.stop="downloadMusic(m)" aria-label="Baixar">
                  <span class="mdi mdi-download"></span>
                </button>

                <button class="icon-btn" @click.stop="addToQueue(m)" aria-label="Adicionar à fila">
                  <span class="mdi mdi-playlist-plus"></span>
                </button>
              </div>
            </li>
          </ul>
        </SwiperSlide>
      </Swiper>
    </div>

    <!-- MODAL ASSINATURA -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="showSubModal"
          class="sub-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Assinatura necessária"
          @click.self="closeSubModal"
        >
          <transition name="pop">
            <div class="sub-modal" @keydown.esc="closeSubModal" tabindex="-1" ref="modalRef">
              <!-- CLOSE -->
              <button class="sub-close" @click="closeSubModal" aria-label="Fechar">
                <span class="mdi mdi-close"></span>
              </button>

              <!-- LEFT BRAND -->
              <aside class="sub-left">
                <div class="sub-left-inner">
                  <div class="sub-icon">
                    <span class="mdi mdi-book-open-page-variant"></span>
                  </div>
                  <h2 class="sub-left-title">Acesso Premium</h2>
                  <p class="sub-left-sub">
                    Desbloqueie player, downloads e fila ilimitada.
                  </p>
                </div>
              </aside>

              <!-- RIGHT CONTENT -->
              <main class="sub-right">
                <h3 class="sub-title">Como funciona?</h3>
                <p class="sub-desc">
                  Para tocar músicas, baixar em pastas ou musicas e adicionar na fila, sua conta precisa estar com a assinatura ativa.
                  É rapidinho:
                </p>

                <div class="sub-steps">
                  <div class="step">
                    <div class="n">1</div>
                    <div class="txt">
                      <p class="t">Ative seu acesso</p>
                      <p class="d">Confirme seu plano em poucos cliques.</p>
                    </div>
                  </div>

                  <div class="step">
                    <div class="n">2</div>
                    <div class="txt">
                      <p class="t">Liberação imediata</p>
                      <p class="d">O player e downloads são desbloqueados na hora.</p>
                    </div>
                  </div>

                  <div class="step">
                    <div class="n">3</div>
                    <div class="txt">
                      <p class="t">Downloads Liberados!</p>
                      <p class="d">São 16gb organizados em pastas, para celular ou penDrive.</p>
                    </div>
                  </div>
                </div>

                <a class="sub-cta" :href="ctaLink" target="_blank" rel="noopener">
                  <span class="mdi mdi-whatsapp"></span>
                  SOLICITAR AGORA
                </a>

                <p class="sub-foot">Fale diretamente com nossa equipe</p>
              </main>
            </div>
          </transition>
        </div>
      </transition>
    </Teleport>
  </section>
</template>

<script setup>
import { Pagination, Navigation } from "swiper/modules"
import "swiper/css/pagination"
import "swiper/css/navigation"
import { ref, onMounted, nextTick, computed } from "vue"
import { db } from "@/firebase"
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
import "vue-toast-notification/dist/theme-sugar.css"

const userStore = useUserStore()
const player = usePlayerStore()
const toast = useToast()

const musicas = ref([])
const pages = ref([])

/* ======================
   MODAL ASSINATURA
====================== */
const showSubModal = ref(false)
const modalRef = ref(null)

const ctaLink = computed(() => {

  return `https://wa.me/5586995102595?text=${encodeURIComponent(
    "Quero ativar meu acesso do site, para ouvir e baixar sem limites."
  )}`
})

function openSubModal() {
  showSubModal.value = true
  nextTick(() => {
    // foco no modal para ESC funcionar bem
    modalRef.value?.focus?.()
  })
}

function closeSubModal() {
  showSubModal.value = false
}

/* ======================
   GUARD DE ASSINATURA
   (toast clicável abre o modal)
====================== */
let lastToastAt = 0

function requireSubscription() {
  if (!userStore.hasActiveSubscription) {
    // evita spam de toast se o user clicar muito rápido
    const now = Date.now()
    if (now - lastToastAt > 1200) {
      lastToastAt = now
      toast.open({
        message: "Acesso restrito. Clique aqui para ativar sua assinatura.",
        type: "warning",
        position: "top-right",
        duration: 3500,
        dismissible: true,
        // ✅ quando clicar no toast, abre o modal no estilo do seu card
        onClick: () => openSubModal()
      })
    } else {
      // se já spammou toast, abre modal direto
      openSubModal()
    }
    return false
  }
  return true
}

/* ======================
          FETCH
====================== */
async function fetchMusicas() {
  const q = query(
    collection(db, "musicas"),
    orderBy("playCount", "desc"),
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

/* ======================
        PAGINAÇÃO
====================== */
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

  if (!Array.isArray(userStore.user.favorites)) {
    userStore.user.favorites = []
  }

  if (isFavorite(m.id)) {
    await updateDoc(refUser, { favorites: arrayRemove(m.id) })
    userStore.user.favorites = userStore.user.favorites.filter(x => x !== m.id)
  } else {
    await updateDoc(refUser, { favorites: arrayUnion(m.id) })
    userStore.user.favorites.push(m.id)
  }
}

onMounted(fetchMusicas)
</script>

<style scoped>
/* ======================
        LAYOUT
====================== */
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
  font-weight: 700;
}

.hint-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

.indicador {
  font-size: 0.85rem;
  color: #777;
  text-align: center;
}

.hint-row .mdi {
  font-size: 22px;
  opacity: 0.8;
}

/* ======================
        LISTA
====================== */
.music-list {
  width: 100%;
  max-width: 380px;
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
  height: 76px;
  padding: 0 12px;
  border-radius: 14px;
  background: #0f0f0f;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.music-row:hover {
  background: #171717;
  transform: translateY(-1px);
}

/* LEFT */
.cover-wrapper {
  width: 54px;
  height: 54px;
  position: relative;
}

.cover {
  width: 54px;
  height: 54px;
  border-radius: 10px;
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
  border-radius: 10px;
  opacity: 0;
  transition: opacity 0.2s;
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
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  transition: opacity 0.2s;
}

@media (hover: hover) and (pointer: fine) {
  .music-row:hover .right {
    opacity: 1;
    pointer-events: auto;
  }
}

/* BOTÕES */
.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: #aaa;
  cursor: pointer;
  transition: transform 0.15s, color 0.15s, background 0.15s;
}

.icon-btn:hover {
  color: #fff;
  background: rgba(0, 0, 0, 0.65);
  transform: translateY(-1px);
}

.icon-btn.active {
  color: #ff4d6d;
}

/* SWIPER HINT */
@keyframes swipe-hint {
  0% { transform: translateX(0); }
  50% { transform: translateX(-10px); }
  100% { transform: translateX(0); }
}
.music-swiper {
  animation: swipe-hint 1.5s ease-in-out 2;
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

/* ======================
        MODAL
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
.sub-close .mdi {
  font-size: 20px;
}

/* LEFT */
.sub-left {
  background: #00cfd0;
  display: grid;
  place-items: center;
  padding: 28px;
}

.sub-left-inner {
  text-align: center;
  color: #fff;
}

.sub-icon {
  width: 86px;
  height: 86px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.18);
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
}

.sub-icon .mdi {
  font-size: 44px;
}

.sub-left-title {
  font-size: 30px;
  line-height: 1.1;
  margin: 0 0 10px;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.sub-left-sub {
  margin: 0;
  opacity: 0.95;
  font-weight: 600;
}

/* RIGHT */
.sub-right {
  padding: 34px 34px 26px;
  color: #111;
}

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

.sub-steps {
  display: grid;
  gap: 14px;
  margin-bottom: 22px;
}

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

.step .t {
  margin: 0;
  font-weight: 850;
  color: #111;
}

.step .d {
  margin: 2px 0 0;
  color: #6b7280;
  font-weight: 600;
}

/* CTA */
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

.sub-cta:hover {
  transform: translateY(-1px);
  filter: brightness(0.98);
}

.sub-cta .mdi {
  font-size: 22px;
}

.sub-foot {
  margin: 14px 0 0;
  text-align: center;
  color: #9ca3af;
  font-weight: 650;
}

/* RESPONSIVO MODAL */
@media (max-width: 860px) {
  .sub-modal {
    grid-template-columns: 1fr;
  }
  .sub-left {
    padding: 22px;
  }
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pop-enter-active,
.pop-leave-active {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.pop-enter-from,
.pop-leave-to {
  transform: translateY(10px) scale(0.985);
  opacity: 0;
}
</style>
