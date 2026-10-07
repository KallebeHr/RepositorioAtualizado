<!--
MESA DE SOM — visual moderno e compacto no celular.
Como usar: substitua o conteúdo do componente original por este arquivo,
mantendo o nome e a pasta atuais para preservar o import de MusicPlayer.vue.
Imagens dos controles incorporadas: não é preciso copiar arquivos de imagem.
Knobs: arraste para cima/baixo; setas alteram 0,5 dB; duplo clique zera.
O fader controla o volume geral do player; sempre vertical à direita.
O grave continua no knob de 60 Hz, sem outro fader de grave.
Processamento de áudio e funções do catálogo permanecem iguais ao original.
-->
<template>
  <section class="music-start-root">
    <div class="music-start-container">
      <header class="music-header">
        <h1 v-if="!userStore.loadingUser">Olá, {{ userStore.user?.name || "visitante" }}</h1>
        <h1 v-else>Olá...</h1>
          <div class="subti">
            <span class="subtitle">AS 56 MÚSICAS MAIS TOCADAS PARA VOCÊ COMEÇAR</span>  
<button class="Documents-btn">
  <span class="folderContainer">
    <svg
      class="fileBack"
      width="146"
      height="113"
      viewBox="0 0 146 113"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 4C0 1.79086 1.79086 0 4 0H50.3802C51.8285 0 53.2056 0.627965 54.1553 1.72142L64.3303 13.4371C65.2799 14.5306 66.657 15.1585 68.1053 15.1585H141.509C143.718 15.1585 145.509 16.9494 145.509 19.1585V109C145.509 111.209 143.718 113 141.509 113H3.99999C1.79085 113 0 111.209 0 109V4Z"
        fill="url(#paint0_linear_117_4)"
      ></path>
      <defs>
        <linearGradient
          id="paint0_linear_117_4"
          x1="0"
          y1="0"
          x2="72.93"
          y2="95.4804"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#8F88C2"></stop>
          <stop offset="1" stop-color="#5C52A2"></stop>
        </linearGradient>
      </defs>
    </svg>
    <svg
      class="filePage"
      width="88"
      height="99"
      viewBox="0 0 88 99"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="88" height="99" fill="url(#paint0_linear_117_6)"></rect>
      <defs>
        <linearGradient
          id="paint0_linear_117_6"
          x1="0"
          y1="0"
          x2="81"
          y2="160.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="white"></stop>
          <stop offset="1" stop-color="#686868"></stop>
        </linearGradient>
      </defs>
    </svg>

    <svg
      class="fileFront"
      width="160"
      height="79"
      viewBox="0 0 160 79"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.29306 12.2478C0.133905 9.38186 2.41499 6.97059 5.28537 6.97059H30.419H58.1902C59.5751 6.97059 60.9288 6.55982 62.0802 5.79025L68.977 1.18034C70.1283 0.410771 71.482 0 72.8669 0H77H155.462C157.87 0 159.733 2.1129 159.43 4.50232L150.443 75.5023C150.19 77.5013 148.489 79 146.474 79H7.78403C5.66106 79 3.9079 77.3415 3.79019 75.2218L0.29306 12.2478Z"
        fill="url(#paint0_linear_117_5)"
      ></path>
      <defs>
        <linearGradient
          id="paint0_linear_117_5"
          x1="38.7619"
          y1="8.71323"
          x2="66.9106"
          y2="82.8317"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#C3BBFF"></stop>
          <stop offset="1" stop-color="#51469A"></stop>
        </linearGradient>
      </defs>
    </svg>
  </span>
  <p class="text"><RouterLink to="/Pastas" class="texte">Clique aqui para ver todas as Pastas</RouterLink></p>
</button>

          </div>

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

                <button class="icon-btn offline-action" @click.stop="saveLocal(m)" :disabled="savingOffline===m.id" :aria-label="'Salvar offline '+m.title"><span class="mdi mdi-cloud-download-outline"/><span>{{ savingOffline===m.id?'Salvando…':'Salvar offline' }}</span></button>

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
                  <p class="sub-left-sub">Desbloqueie player, downloads e fila ilimitada.</p>
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

import { ref, onMounted, nextTick, computed, watch, onBeforeUnmount } from "vue"
import AudioMotionAnalyzer from "audiomotion-analyzer"

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
import { downloadTrack, saveTrackOffline } from "@/services/downloads"

const userStore = useUserStore()
const player = usePlayerStore()
const toast = useToast()

const musicas = ref([])
const pages = ref([])
const savingOffline = ref('')

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
  nextTick(() => modalRef.value?.focus?.())
}

function closeSubModal() {
  showSubModal.value = false
}

/* ======================
   GUARD DE ASSINATURA
====================== */
let lastToastAt = 0

function requireSubscription() {
  if (!userStore.hasActiveSubscription) {
    const now = Date.now()
    if (now - lastToastAt > 1200) {
      lastToastAt = now
      toast.open({
        message: "Acesso restrito. Clique aqui para ativar sua assinatura.",
        type: "warning",
        position: "top-right",
        duration: 3500,
        dismissible: true,
        onClick: () => openSubModal()
      })
    } else {
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
  const q = query(collection(db, "musicas"), orderBy("playCount", "desc"), limit(56))
  const snap = await getDocs(q)

  musicas.value = snap.docs.map(d => {
    const data = d.data()
    return { ...data, id: d.id, collectionName: 'musicas', artist: data.cantor,
      cover: data.coverUrl, fileName: data.fileName || `${data.title}.mp3`, playCount: data.playCount || 0 }
  })

  paginate()
}

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

  playMusic(m)
}

function playMusic(m) {
  if (!requireSubscription()) return

  player.addToQueue(m, { playNow: true })
  updateDoc(doc(db, "musicas", m.id), { playCount: increment(1) }).catch(() => {})
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

  try {
    await downloadTrack(userStore.user.uid, m)
    await updateDoc(doc(db, "musicas", m.id), { downloadCount: increment(1) }).catch(() => {})
  } catch (error) {
    toast.open({ message: error.message || 'Não foi possível baixar a música.', type: 'error', position: 'top-right', duration: 6000 })
  }
}

async function saveLocal(m) {
  if (!requireSubscription() || savingOffline.value) return
  savingOffline.value = m.id
  try { await saveTrackOffline(userStore.user.uid, m); toast.success('Música salva neste aparelho. Abra Ouvir offline para escutar sem internet.') }
  catch (error) { toast.error(error.message || 'Não foi possível salvar a música.') }
  finally { savingOffline.value = '' }
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
} else {
    await updateDoc(refUser, { favorites: arrayUnion(m.id) })
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
.music-header { margin-bottom: 24px; }
.music-header h1 { font-size: 1rem; font-weight: 800; }
.subti{
  display: flex;
  flex-direction: column;
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

.indicador { font-size: 0.85rem; color: #777; text-align: center; }
.hint-row .mdi { font-size: 22px; opacity: 0.8; }

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

.music-row:hover { background: #171717; transform: translateY(-1px); }

.cover-wrapper { width: 54px; height: 54px; position: relative; }
.cover { width: 54px; height: 54px; border-radius: 10px; object-fit: cover; }

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
.music-row:hover .play-icon { opacity: 1; }

.center { flex: 1; min-width: 0; margin-left: 12px; }
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
  .music-row:hover .right { opacity: 1; pointer-events: auto; }
}

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
.icon-btn.active { color: #ff4d6d; }

@keyframes swipe-hint {
  0% { transform: translateX(0); }
  50% { transform: translateX(-10px); }
  100% { transform: translateX(0); }
}
.music-swiper { animation: swipe-hint 1.5s ease-in-out 2; }

@media (max-width: 640px) {
  .music-start-container { padding: 20px; }
  .right { display: none; }
}

/* From Uiverse.io by vinodjangid07 */ 
.Documents-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: fit-content;
  height: 45px;
  border: none;
  padding: 0px 15px;
  border-radius: 5px;
  background-color: rgb(49, 49, 83);
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s;
}
.folderContainer {
  width: 40px;
  height: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}
.fileBack {
  z-index: 1;
  width: 80%;
  height: auto;
}
.filePage {
  width: 50%;
  height: auto;
  position: absolute;
  z-index: 2;
  transition: all 0.3s ease-out;
}
.fileFront {
  width: 85%;
  height: auto;
  position: absolute;
  z-index: 3;
  opacity: 0.95;
  transform-origin: bottom;
  transition: all 0.3s ease-out;
}
.text {
  color: white;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.texte{
  text-decoration: none;

}
.Documents-btn:hover .filePage {
  transform: translateY(-5px);
}
.Documents-btn:hover {
  background-color: rgb(58, 58, 94);
}
.Documents-btn:active {
  transform: scale(0.95);
}
.Documents-btn:hover .fileFront {
  transform: rotateX(30deg);
}


/* MESA CONTEMPORÂNEA — desktop amplo, celular compacto. */
.eq-fab {
  position: fixed; right: 18px; bottom: 10rem; z-index: 9998;
  width: 54px; height: 58px; display: grid; place-content: center; gap: 2px;
  border: 1px solid #394553; border-radius: 16px; background: #1a2431;
  box-shadow: 0 8px 22px #0007; color: #d7e9fa; cursor: pointer;
}
.eq-fab .mdi { font-size: 23px; line-height: 1; }
.eq-fab-label { font: 700 10px/1 system-ui, sans-serif; letter-spacing: .08em; }
.eq-fab.on { border-color: #4b94c7; color: #a7d8ff; }
.eq-fab:focus-visible { outline: 3px solid #8fc3ff; outline-offset: 3px; }
.eq-overlay { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; padding: 16px; background: #050b12d9; backdrop-filter: blur(9px); overscroll-behavior: contain; }
.eq-panel {
  --eq-accent: #94d3ff;
  display: flex; flex-direction: column; width: min(960px, 100%); max-height: calc(100dvh - 32px);
  box-sizing: border-box; color: #e9eef5; background: #171d25;
  border: 1px solid #3b4654; border-radius: 24px; overflow: hidden; outline: none;
  box-shadow: 0 28px 90px #0009, inset 0 1px 0 #53607154;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.eq-panel *, .eq-panel *::before, .eq-panel *::after { box-sizing: border-box; }
.eq-panel button, .eq-panel input { font: inherit; }
.eq-panel button { cursor: pointer; }
.eq-header { flex: none; display: flex; justify-content: space-between; align-items: center; padding: 24px 28px 20px; border-bottom: 1px solid #303a47; background: #1b222c; }
.eq-header { position: relative; gap: 12px; }
.eq-header-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.eq-options-toggle { width: 44px; height: 44px; display: grid; place-items: center; border: 1px solid #3d4b5c; border-radius: 12px; background: #26303d; color: #ccd6e2; }
.eq-options-toggle .mdi { font-size: 22px; }
.eq-options-toggle.active { color: #c3e7ff; background: #214866; border-color: #4c87b2; }
.eq-advanced { position: absolute; z-index: 3; top: calc(100% + 10px); right: 28px; width: 380px; max-width: calc(100% - 56px); max-height: calc(100dvh - 240px); overflow-y: auto; padding: 18px; border: 1px solid #4c6077; border-radius: 16px; background: #202c3a; box-shadow: 0 16px 40px #000b; outline: none; }
.eq-advanced h3 { margin: 0; color: #e9eef5; font-size: 17px; line-height: 1.3; }
.eq-advanced-description { margin: 5px 0 14px; color: #a9bbce; font-size: 11px; line-height: 1.4; }
.eq-fine-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 8px; }
.eq-fine-grid label > span { display: block; margin-bottom: 5px; color: #b5c8dc; font-size: 10px; }
.eq-fine-input { position: relative; }
.eq-fine-input input { width: 100%; min-height: 40px; padding: 6px 24px 6px 7px; color: #d9edff; background: #101c2a; border: 1px solid #455c74; border-radius: 8px; font-size: 13px; }
.eq-fine-input > span { position: absolute; right: 6px; top: 14px; color: #93a8be; font-size: 9px; pointer-events: none; }
.eq-fine-input input:focus-visible { outline: 2px solid #91c3ff; outline-offset: 2px; }
.eq-personal-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.eq-advanced button { min-height: 40px; padding: 7px 8px; border: 1px solid #506882; border-radius: 8px; background: #2b4056; color: #d5eaff; font-size: 11px; }
.eq-advanced button:disabled { opacity: .45; cursor: default; }
.eq-compare { width: 100%; margin-top: 9px; }
.eq-compare[aria-pressed="true"] { background: #214866; border-color: #6ba4ce; }
.eq-options-status { margin: 11px 0 0; color: #a9bfd4; font-size: 10px; line-height: 1.5; }
.eq-model { margin: 0 0 6px; color: #8e9dac; font-size: 10px; font-weight: 700; letter-spacing: .15em; }
.eq-model span { margin-left: 10px; color: #88bddf; letter-spacing: .03em; }
.eq-brand h2 { margin: 0; font-size: 27px; font-weight: 650; line-height: 1.15; letter-spacing: -.025em; }
.eq-description { margin: 6px 0 0; color: #a9b5c4; font-size: 12px; }
.eq-close { flex: 0 0 44px; width: 44px; height: 44px; display: grid; place-items: center; background: #26303d; border: 1px solid #3d4b5c; border-radius: 12px; color: #ccd6e2; }
.eq-close .mdi { font-size: 22px; }
.eq-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 22px 28px 18px; scrollbar-width: thin; scrollbar-color: #506072 #171d25; overscroll-behavior: contain; }
.eq-signal-section { display: grid; grid-template-columns: minmax(0, 1fr) 86px; gap: 14px; align-items: stretch; }
.eq-display { position: relative; min-width: 0; height: 124px; padding: 12px 16px 9px; background: #0d141d; border: 1px solid #354354; border-radius: 14px; box-shadow: inset 0 2px 8px #0005; }
.eq-display-caption { display: flex; align-items: center; justify-content: space-between; gap: 7px; font-size: 9px; line-height: 1; letter-spacing: .08em; color: #a0b2c5; }
.eq-display-caption strong { font-size: 9px; font-weight: 650; color: #b0bbc8; }
.eq-display-caption strong.active { color: #98ddc6; }
.am-canvas { height: 72px; width: 100%; margin: 9px 0 5px; overflow: hidden; }
.am-canvas :deep(canvas) { display: block; width: 100% !important; height: 100% !important; }
.eq-no-signal { position: absolute; top: 50%; left: 10px; right: 10px; transform: translateY(-50%); text-align: center; color: #7f93aa; font-size: 12px; }
.eq-display-scale { display: flex; justify-content: space-between; gap: 3px; font: 9px/1 ui-monospace, 'SFMono-Regular', Consolas, monospace; color: #869bb3; }
.eq-power { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 11px; min-width: 0; border: 1px solid #3c4b60; border-radius: 14px; background: #263343; color: #c5d3e3; box-shadow: inset 0 1px 0 #7189a233, 0 3px 7px #0003; }
.eq-power.on { background: #203e54; border-color: #437599; color: #b3e0ff; }
.eq-power .mdi { font-size: 30px; line-height: 1; }
.eq-power span:last-child { font-size: 9px; font-weight: 700; letter-spacing: .035em; }
.eq-rack-heading { display: flex; justify-content: space-between; gap: 12px; padding: 21px 0 12px; color: #aab8c8; font-size: 10px; font-weight: 600; letter-spacing: .08em; }
.eq-rack-heading > span:first-child { display: flex; align-items: center; gap: 12px; }
.eq-profile-name { color: #94d3ff; letter-spacing: 0; font-weight: 500; }
.eq-mixer-body { display: grid; grid-template-columns: minmax(0, 1fr) 102px; gap: 15px; }
.eq-knob-rack { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); padding: 14px 4px 13px; border: 1px solid #344151; border-radius: 16px; background: #121921; box-shadow: inset 0 1px 0 #4b5a682e; }
.eq-channel { display: flex; flex-direction: column; align-items: center; min-width: 0; padding: 2px 6px; border-right: 1px solid #344050; }
.eq-channel:last-child { border-right: 0; }
.eq-channel-label { min-height: 36px; text-align: center; }
.eq-channel-label strong { display: block; color: #e1e9f2; font-size: 11px; font-weight: 550; line-height: 1.3; }
.eq-channel-label > span { display: block; margin-top: 3px; color: #8ba6c1; font-size: 11px; font-weight: 450; }
.eq-knob-scale { display: flex; justify-content: space-between; width: 84px; margin: 6px 0 0; font: 8px/1.2 ui-monospace, Consolas, monospace; color: #8da0b5; }
.eq-knob-control { width: 90px; height: 90px; display: grid; place-items: center; border-radius: 50%; cursor: ns-resize; touch-action: none; user-select: none; -webkit-user-select: none; }
.eq-knob-control img { display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; filter: drop-shadow(0 5px 4px #0009); will-change: transform; }
.eq-knob-control:focus-visible { outline: 2px solid #91c3ff; outline-offset: 0; }
.eq-gain { display: block; margin-top: 5px; color: #c6d2df; font: 550 14px/1.2 ui-monospace, 'SFMono-Regular', Consolas, monospace; font-variant-numeric: tabular-nums; }
.eq-gain.adjusted { color: #99d4ff; }
.eq-gain span, .eq-fader-value span { font-size: 9px; font-weight: 400; color: #9caec3; }
.eq-fader-strip { display: flex; flex-direction: column; align-items: center; min-width: 0; padding: 13px 8px 11px; border: 1px solid #405166; border-radius: 14px; background: #24303d; box-shadow: inset 0 1px 0 #6a7d9145; }
.eq-fader-label { text-align: center; }
.eq-fader-label strong { display: block; font-size: 10px; font-weight: 650; letter-spacing: .06em; color: #d4e2f0; }
.eq-fader-label > span { display: block; margin-top: 3px; font-size: 10px; color: #a4b7cd; }
.eq-fader-assembly { display: flex; flex: 1; width: 100%; justify-content: center; align-items: stretch; gap: 3px; padding: 9px 0 8px; }
.eq-fader-scale { display: flex; flex-direction: column; justify-content: space-between; width: 22px; flex: 0 0 22px; padding: 14px 0; color: #a7b8cb; font: 8px/1 ui-monospace, Consolas, monospace; text-align: right; }
.eq-fader { display: block; appearance: none; -webkit-appearance: none; writing-mode: vertical-lr; direction: rtl; align-self: stretch; width: 42px; min-height: 104px; height: auto; margin: 0; background: transparent; cursor: ns-resize; touch-action: none; }
.eq-fader::-webkit-slider-runnable-track { width: 5px; height: 100%; background: #0b1018; border: 1px solid #3a4b60; border-radius: 3px; box-shadow: inset 1px 1px 2px #0008; }
.eq-fader::-moz-range-track { width: 5px; height: 100%; background: #0b1018; border: 1px solid #3a4b60; border-radius: 3px; }
.eq-fader::-webkit-slider-thumb { appearance: none; -webkit-appearance: none; width: 48px; height: 36px; margin-left: -22px; border: none; border-radius: 0; background: var(--eq-fader-skin) center / 60px 60px no-repeat; filter: drop-shadow(0 3px 2px #0008); }
.eq-fader::-moz-range-thumb { width: 48px; height: 36px; border: none; border-radius: 0; background: var(--eq-fader-skin) center / 60px 60px no-repeat; }
.eq-fader:focus-visible { outline: 2px solid #9dd8ff; outline-offset: 2px; border-radius: 4px; }
.eq-fader-value { width: 100%; padding: 5px 0; color: #c6e6ff; background: #152332; border-radius: 6px; font: 550 12px/1 ui-monospace, Consolas, monospace; font-variant-numeric: tabular-nums; text-align: center; }
.eq-fader-note { padding-top: 6px; color: #91a6bc; font-size: 7px; letter-spacing: .03em; }
.eq-presets { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 18px; }
.eq-presets button { display: flex; align-items: center; justify-content: center; gap: 5px; min-width: 100px; min-height: 40px; padding: 8px 18px; border: 1px solid #435268; border-radius: 10px; background: #253140; color: #cfdcec; font-size: 12px; font-weight: 550; }
.eq-presets button.active { background: #214866; border-color: #4c87b2; color: #c3e7ff; }
.eq-presets .mdi { font-size: 17px; }
.eq-presets button:active, .eq-close:active, .eq-power:active { transform: translateY(1px); }
.eq-panel button:focus-visible { outline: 2px solid #91c3ff; outline-offset: 3px; }
.eq-help { margin: 11px 0 15px; color: #96a8bd; font-size: 11px; line-height: 1.4; text-align: center; }
.eq-player { position: relative; }
.eq-player:empty { display: none; }
.eq-footer { display: flex; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 1px solid #344150; color: #8fa2b9; font-size: 8px; font-weight: 500; letter-spacing: .045em; line-height: 1.5; }
.eq-footer span:last-child { color: #91b8d6; text-align: right; }
.eq-fade-enter-active, .eq-fade-leave-active { transition: opacity .16s ease; }
.eq-fade-enter-from, .eq-fade-leave-to { opacity: 0; }
@media (min-width: 601px) and (max-width: 899px) {
  .eq-panel { width: min(710px, 100%); }
  .eq-knob-rack { grid-template-columns: repeat(3, minmax(0, 1fr)); row-gap: 17px; }
  .eq-channel:nth-child(3) { border-right: 0; }
}
@media (max-width: 600px) {
  .eq-overlay { padding: 10px; }
  .eq-panel { width: min(480px, 100%); max-height: calc(100dvh - 20px); border-radius: 20px; }
  .eq-header { padding: 14px 16px 12px; }
  .eq-model { margin-bottom: 4px; font-size: 9px; }
  .eq-brand h2 { font-size: 22px; }
  .eq-description { display: none; }
  .eq-close { width: 42px; height: 42px; flex-basis: 42px; border-radius: 11px; }
  .eq-options-toggle { width: 42px; height: 42px; border-radius: 11px; }
  .eq-advanced { left: 10px; right: 10px; width: auto; max-width: none; max-height: calc(100dvh - 160px); padding: 14px; border-radius: 12px; }
  .eq-scroll { padding: 14px 14px 12px; }
  .eq-signal-section { grid-template-columns: minmax(0, 1fr) 62px; gap: 9px; }
  .eq-display { height: 75px; padding: 9px 10px 7px; border-radius: 10px; }
  .eq-display-caption { font-size: 8px; }
  .eq-display-caption strong { font-size: 8px; }
  .am-canvas { height: 32px; margin-top: 7px; margin-bottom: 6px; }
  .eq-display-scale { font-size: 8px; }
  .eq-no-signal { top: 40px; font-size: 9px; }
  .eq-power { gap: 5px; border-radius: 11px; }
  .eq-power .mdi { font-size: 26px; }
  .eq-power span:last-child { font-size: 8px; }
  .eq-rack-heading { padding: 14px 0 9px; font-size: 9px; }
  .eq-rack-heading > span:first-child { gap: 8px; }
  .eq-mixer-body { grid-template-columns: minmax(0, 1fr) 72px; gap: 10px; }
  .eq-knob-rack { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 0; row-gap: 14px; padding: 12px 3px; border-radius: 13px; }
  .eq-channel { padding: 0 2px; }
  .eq-channel:nth-child(3) { border-right: 1px solid #344050; }
  .eq-channel:nth-child(even) { border-right: 0; }
  .eq-channel-label { min-height: 29px; }
  .eq-channel-label strong { font-size: 10px; }
  .eq-channel-label > span { font-size: 10px; margin-top: 2px; }
  .eq-knob-scale { width: 68px; margin-top: 3px; font-size: 7px; }
  .eq-knob-control { width: 72px; height: 72px; }
  .eq-gain { margin-top: 1px; font-size: 12px; }
  .eq-gain span { font-size: 8px; }
  .eq-fader-strip { padding: 12px 6px 10px; border-radius: 11px; }
  .eq-fader-label { text-align: center; }
  .eq-fader-label strong { font-size: 9px; }
  .eq-fader-label > span { font-size: 9px; }
  .eq-fader-assembly { position: relative; flex: 1; min-width: 0; min-height: 0; padding: 0; margin: 8px 0; }
  .eq-fader-scale { position: absolute; inset: 0 auto 0 0; width: 16px; padding: 14px 0; font-size: 7px; }
  .eq-fader-note { display: none; }
  .eq-fader { position: absolute; top: 0; right: 0; width: 38px; height: 100%; min-height: 0; }
  .eq-fader::-webkit-slider-thumb { width: 42px; height: 32px; margin-left: -19px; background-size: 54px 54px; }
  .eq-fader::-moz-range-thumb { width: 42px; height: 32px; background-size: 54px 54px; }
  .eq-fader-value { padding: 8px 0; font-size: 11px; }
  .eq-presets { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: 13px; }
  .eq-presets button { min-width: 0; min-height: 40px; padding: 6px 3px; font-size: 11px; border-radius: 9px; }
  .eq-help { display: none; }
  .eq-footer { margin-top: 12px; padding-top: 9px; font-size: 7px; letter-spacing: .015em; }
}
@media (max-width: 359px) {
  .eq-overlay { padding: 7px; }
  .eq-panel { max-height: calc(100dvh - 14px); }
  .eq-header { padding: 12px; }
  .eq-scroll { padding: 12px 10px 10px; }
  .eq-knob-control { width: 64px; height: 64px; }
  .eq-knob-scale { width: 59px; }
  .eq-knob-rack { row-gap: 11px; padding: 10px 2px; }
  .eq-channel-label strong { font-size: 9px; }
  .eq-no-signal { font-size: 8px; }
  .eq-mixer-body { grid-template-columns: minmax(0, 1fr) 64px; gap: 8px; }
  .eq-fader-strip { padding-left: 4px; padding-right: 4px; }
}
@media (max-height: 660px) and (max-width: 600px) {
  .eq-header { padding-top: 10px; padding-bottom: 10px; }
  .eq-scroll { padding-top: 10px; padding-bottom: 9px; }
  .eq-display { height: 64px; padding-top: 8px; }
  .am-canvas { height: 24px; margin-top: 5px; margin-bottom: 5px; }
  .eq-no-signal { top: 34px; }
  .eq-rack-heading { padding-top: 11px; padding-bottom: 7px; }
  .eq-knob-control { width: 58px; height: 58px; }
  .eq-knob-scale { width: 58px; }
  .eq-knob-rack { row-gap: 10px; padding-top: 9px; padding-bottom: 9px; }
  .eq-channel-label { min-height: 26px; }
  .eq-channel-label > span { line-height: 1.2; }
  .eq-footer { display: none; }
  .eq-presets { margin-top: 10px; }
}
@media (max-height: 600px) and (max-width: 600px) {
  .eq-scroll { padding-top: 8px; padding-bottom: 6px; }
  .eq-display { height: 58px; }
  .eq-no-signal { top: 30px; }
  .am-canvas { height: 20px; }
  .eq-rack-heading { padding-top: 8px; padding-bottom: 6px; }
  .eq-knob-control { width: 52px; height: 52px; }
  .eq-knob-scale { width: 50px; }
  .eq-channel-label { min-height: 23px; }
  .eq-channel-label strong, .eq-channel-label > span { line-height: 1.1; }
  .eq-knob-rack { row-gap: 8px; padding-top: 8px; padding-bottom: 8px; }
}
@media (max-height: 540px) and (min-width: 601px) {
  .eq-overlay { padding: 8px; }
  .eq-panel { width: min(960px, 100%); max-height: calc(100dvh - 16px); border-radius: 17px; }
  .eq-header { padding: 10px 18px; }
  .eq-model { margin-bottom: 3px; font-size: 8px; }
  .eq-brand h2 { font-size: 20px; }
  .eq-description, .eq-help, .eq-footer { display: none; }
  .eq-close { width: 36px; height: 36px; flex-basis: 36px; }
  .eq-options-toggle { width: 36px; height: 36px; }
  .eq-advanced { max-height: calc(100dvh - 105px); }
  .eq-scroll { padding: 10px 18px; }
  .eq-display { height: 63px; padding: 7px 10px; }
  .am-canvas { height: 25px; margin: 5px 0; }
  .eq-display-caption, .eq-display-caption strong { font-size: 8px; }
  .eq-display-scale { font-size: 7px; }
  .eq-no-signal { font-size: 10px; }
  .eq-signal-section { grid-template-columns: minmax(0, 1fr) 68px; }
  .eq-power { gap: 4px; }
  .eq-rack-heading { padding: 8px 0; font-size: 9px; }
  .eq-mixer-body { grid-template-columns: minmax(0, 1fr) 85px; gap: 10px; }
  .eq-knob-rack { grid-template-columns: repeat(6, minmax(0, 1fr)); row-gap: 0; padding: 7px 2px; }
  .eq-channel { padding: 0 2px; }
  .eq-channel:nth-child(3) { border-right: 1px solid #344050; }
  .eq-channel-label { min-height: 27px; }
  .eq-channel-label strong, .eq-channel-label > span { font-size: 9px; }
  .eq-knob-control { width: 60px; height: 60px; }
  .eq-knob-scale { width: 57px; margin-top: 2px; font-size: 7px; }
  .eq-gain { font-size: 11px; margin-top: 2px; }
  .eq-fader-strip { padding: 8px 4px; }
  .eq-fader-label strong, .eq-fader-label > span { font-size: 8px; }
  .eq-fader-assembly { padding: 3px 0; }
  .eq-fader { height: 64px; min-height: 54px; }
  .eq-fader-scale { font-size: 7px; padding: 11px 0; }
  .eq-fader-note { display: none; }
  .eq-presets { margin-top: 9px; }
  .eq-presets button { min-height: 34px; font-size: 10px; padding-top: 5px; padding-bottom: 5px; }
}
@media (prefers-reduced-motion: reduce) {
  .eq-fade-enter-active, .eq-fade-leave-active { transition: none; }
}

/* ======================
        MODAL ASSINATURA (igual seu)
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
.sub-close .mdi { font-size: 20px; }

.sub-left {
  background: #00cfd0;
  display: grid;
  place-items: center;
  padding: 28px;
}

.sub-left-inner { text-align: center; color: #fff; }

.sub-icon {
  width: 86px;
  height: 86px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.18);
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
}
.sub-icon .mdi { font-size: 44px; }

.sub-left-title {
  font-size: 30px;
  line-height: 1.1;
  margin: 0 0 10px;
  font-weight: 850;
  letter-spacing: -0.02em;
}
.sub-left-sub { margin: 0; opacity: 0.95; font-weight: 600; }

.sub-right { padding: 34px 34px 26px; color: #111; }

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

.sub-steps { display: grid; gap: 14px; margin-bottom: 22px; }

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
.step .t { margin: 0; font-weight: 850; color: #111; }
.step .d { margin: 2px 0 0; color: #6b7280; font-weight: 600; }

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
.sub-cta:hover { transform: translateY(-1px); filter: brightness(0.98); }
.sub-cta .mdi { font-size: 22px; }

.sub-foot {
  margin: 14px 0 0;
  text-align: center;
  color: #9ca3af;
  font-weight: 650;
}

@media (max-width: 860px) {
  .sub-modal { grid-template-columns: 1fr; }
  .sub-left { padding: 22px; }
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.pop-enter-active,
.pop-leave-active { transition: transform 0.18s ease, opacity 0.18s ease; }
.pop-enter-from,
.pop-leave-to { transform: translateY(10px) scale(0.985); opacity: 0; }
/* Ações explícitas, disponíveis também em telas de toque. */
.music-row{height:auto;min-height:112px;padding:12px;flex-wrap:wrap}.right{position:static;transform:none;flex-basis:100%;justify-content:flex-end;margin-top:8px;opacity:1;pointer-events:auto}.icon-btn{min-width:40px;min-height:40px}.offline-action{display:flex;align-items:center;justify-content:center;gap:5px;width:auto;padding:0 10px;border-radius:10px;background:#193a26;color:#bcf2cf;font-size:11px}.offline-action:disabled{opacity:.6}@media(max-width:640px){.right{display:flex}.music-list{max-width:100%}}
</style>
