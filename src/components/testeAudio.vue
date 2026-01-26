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

    <!-- BOTÃO FLUTUANTE (EQUALIZADOR) -->
    <button
      class="eq-fab"
      :class="{ on: eqEnabled }"
      @click="toggleEqUI"
      aria-label="Abrir equalizador"
      title="Equalizador"
    >
      <span class="mdi mdi-tune-vertical"></span>
    </button>

    <!-- UI DO EQUALIZADOR -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="eqUIOpen"
          class="eq-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Equalizador"
          @click.self="eqUIOpen = false"
        >
          <transition name="pop">
            <div class="eq-panel" tabindex="-1" ref="eqPanelRef" @keydown.esc="eqUIOpen = false">
              <header class="eq-header">
                <div class="eq-title-row">
                  <div class="eq-badge" :class="{ on: eqEnabled }">
                    <span class="dot"></span>
                    <span>{{ eqEnabled ? "Equalizador ON" : "Equalizador OFF" }}</span>
                  </div>

                  <button class="eq-close" @click="eqUIOpen = false" aria-label="Fechar">
                    <span class="mdi mdi-close"></span>
                  </button>
                </div>

                <p class="eq-sub">
                  Ajuste o som do player em tempo real (Web Audio API + Howler).
                </p>
              </header>

              <section class="eq-body">
                <div class="eq-row">
                  <div class="eq-switch">
                    <label class="switch">
                      <input type="checkbox" v-model="eqEnabled" @change="applyEqEnabled" />
                      <span class="slider"></span>
                    </label>
                    <div class="eq-switch-text">
                      <p class="t">Ativar equalizador</p>
                      <p class="d">Liga/desliga sem perder o áudio.</p>
                    </div>
                  </div>

                  <div class="eq-actions">
                    <button class="eq-btn" @click="resetEq" type="button">
                      <span class="mdi mdi-refresh"></span>
                      Reset
                    </button>

                    <button class="eq-btn primary" @click="applyPreset('bass')" type="button">
                      <span class="mdi mdi-waveform"></span>
                      Bass+
                    </button>

                    <button class="eq-btn primary" @click="applyPreset('vocal')" type="button">
                      <span class="mdi mdi-microphone"></span>
                      Voz
                    </button>

                    <button class="eq-btn primary" @click="applyPreset('bright')" type="button">
                      <span class="mdi mdi-brightness-5"></span>
                      Brilho
                    </button>
                  </div>
                </div>

                <div class="eq-sliders">
                  <div class="band" v-for="b in bands" :key="b.key">
                    <div class="band-top">
                      <p class="hz">{{ b.label }}</p>
                      <p class="db">{{ formatDb(b.gain) }}</p>
                    </div>

                    <input
                      class="range"
                      type="range"
                      :min="-12"
                      :max="12"
                      :step="0.5"
                      v-model.number="b.gain"
                      @input="onBandChange"
                    />

                    <p class="band-hint">dB</p>
                  </div>
                </div>

                <div class="eq-note">
                  <span class="mdi mdi-information-outline"></span>
                  <p>
                    Em alguns navegadores, o áudio só pode ser processado após uma interação.
                    Se não aplicar de primeira, dê play e mexa em um slider.
                  </p>
                </div>
              </section>
            </div>
          </transition>
        </div>
      </transition>
    </Teleport>

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
import { ref, onMounted, nextTick, computed, watch } from "vue"
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
  const q = query(collection(db, "musicas"), orderBy("playCount", "desc"), limit(24))
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
}

function playMusic(m) {
  if (!requireSubscription()) return

  player.addToQueue(m, { playNow: true })

  updateDoc(doc(db, "musicas", m.id), { playCount: increment(1) })

  // tenta conectar o EQ ao áudio do Howler
  ensureEqConnection()
}

function addToQueue(m) {
  if (!requireSubscription()) return
  player.addToQueue(m, { playNow: false })
  ensureEqConnection()
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

/* =========================================================
   WEB AUDIO API — EQUALIZADOR (FUNCIONAL COM HOWLER html5)
   ✅ Conecta no HTMLAudioElement interno do Howler:
      player.sound._sounds[0]._node
========================================================= */

/** UI */
const eqUIOpen = ref(false)
const eqPanelRef = ref(null)

/** Estado do EQ */
const eqEnabled = ref(true)

/** 6 bandas */
const bands = ref([
  { key: "60", label: "60Hz", freq: 60, gain: 0 },
  { key: "170", label: "170Hz", freq: 170, gain: 0 },
  { key: "350", label: "350Hz", freq: 350, gain: 0 },
  { key: "1k", label: "1kHz", freq: 1000, gain: 0 },
  { key: "3.5k", label: "3.5kHz", freq: 3500, gain: 0 },
  { key: "10k", label: "10kHz", freq: 10000, gain: 0 }
])

/** WebAudio internals */
let audioCtx = null
let mediaEl = null
let sourceNode = null
let eqNodes = []
let inputNode = null
let outputNode = null

function toggleEqUI() {
  eqUIOpen.value = !eqUIOpen.value
  if (eqUIOpen.value) nextTick(() => eqPanelRef.value?.focus?.())

  // gesto do user -> bom momento pra liberar AudioContext e conectar
  ensureEqConnection()
}

function formatDb(v) {
  const n = Number(v || 0)
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`
}

function createContextIfNeeded() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {})
  }
}

/** ✅ Pega o <audio> interno do Howler (html5: true) */
function findAudioElement() {
  const howl = player?.sound
  const node = howl?._sounds?.[0]?._node

  if (node && typeof node.play === "function") {
    // ajuda em cenários cross-origin (se o host permitir)
    try {
      node.crossOrigin = "anonymous"
    } catch {}
    return node
  }

  // fallback (se existir algum <audio> real no DOM)
  return document.querySelector("audio") || null
}

function buildEqGraph() {
  eqNodes = bands.value.map(b => {
    const f = audioCtx.createBiquadFilter()
    f.type = "peaking"
    f.frequency.value = b.freq
    f.Q.value = 1.0
    f.gain.value = b.gain
    return f
  })

  inputNode = audioCtx.createGain()
  outputNode = audioCtx.createGain()

  inputNode.connect(eqNodes[0])
  for (let i = 0; i < eqNodes.length - 1; i++) {
    eqNodes[i].connect(eqNodes[i + 1])
  }
  eqNodes[eqNodes.length - 1].connect(outputNode)
  outputNode.connect(audioCtx.destination)
}

function connectMediaElement(el) {
  if (!el) return false
  if (mediaEl === el && sourceNode && audioCtx) return true

  createContextIfNeeded()

  // limpa conexões antigas
  try { sourceNode?.disconnect() } catch {}
  try { inputNode?.disconnect() } catch {}
  try { outputNode?.disconnect() } catch {}
  try { eqNodes?.forEach(n => n.disconnect()) } catch {}

  mediaEl = el

  // ✅ Segurança: se falhar (CORS / regras do browser), não quebra o app
  try {
    sourceNode = audioCtx.createMediaElementSource(mediaEl)
  } catch (err) {
    console.error("[EQ] Falha ao capturar áudio do Howler:", err)
    return false
  }

  buildEqGraph()
  sourceNode.connect(inputNode)
  applyEqEnabled()
  return true
}

function bypassEq() {
  if (!audioCtx || !sourceNode) return
  try { inputNode?.disconnect() } catch {}
  try { eqNodes?.forEach(n => n.disconnect()) } catch {}
  try { outputNode?.disconnect() } catch {}
  try { sourceNode?.disconnect() } catch {}
  sourceNode.connect(audioCtx.destination)
}

function enableEq() {
  if (!audioCtx || !sourceNode) return
  try { sourceNode?.disconnect() } catch {}
  try { inputNode?.disconnect() } catch {}
  try { eqNodes?.forEach(n => n.disconnect()) } catch {}
  try { outputNode?.disconnect() } catch {}

  buildEqGraph()
  sourceNode.connect(inputNode)
}

function applyEqEnabled() {
  ensureEqConnection()
  if (!audioCtx || !sourceNode) return
  if (eqEnabled.value) enableEq()
  else bypassEq()
}

function onBandChange() {
  if (!audioCtx || !eqNodes.length) ensureEqConnection()
  for (let i = 0; i < bands.value.length; i++) {
    const g = Number(bands.value[i].gain || 0)
    if (eqNodes[i]) eqNodes[i].gain.value = g
  }
}

function resetEq() {
  bands.value.forEach(b => (b.gain = 0))
  onBandChange()
}

function applyPreset(name) {
  const set = vals => {
    const keys = ["60", "170", "350", "1k", "3.5k", "10k"]
    keys.forEach((k, idx) => {
      const band = bands.value.find(b => b.key === k)
      if (band) band.gain = vals[idx]
    })
    onBandChange()
  }

  if (name === "bass") set([6, 4, 1, -1, -1, 0])
  else if (name === "vocal") set([-2, -1, 2, 4, 3, 1])
  else if (name === "bright") set([0, -1, -1, 1, 3, 5])
}

function ensureEqConnection() {
  const el = findAudioElement()
  if (!el) return false
  return connectMediaElement(el)
}

/** ✅ Reconecta automaticamente toda vez que trocar a música (novo Howl) */
watch(
  () => player?.sound,
  () => {
    ensureEqConnection()
  }
)

/* ======================
          LIFECYCLE
====================== */
onMounted(() => {
  fetchMusicas()
  // tenta conectar caso já tenha algo carregado
  ensureEqConnection()
})
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
   FLOATING EQ BUTTON
====================== */
.eq-fab {
  position: fixed;
  right: 18px;
  bottom: 18px;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 15, 15, 0.78);
  backdrop-filter: blur(10px);
  color: #fff;
  display: grid;
  place-items: center;
  z-index: 9998;
  cursor: pointer;
  box-shadow: 0 18px 50px rgba(0,0,0,0.45);
  transition: transform 0.18s ease, background 0.18s ease, border 0.18s ease;
}
.eq-fab .mdi { font-size: 26px; }
.eq-fab:hover { transform: translateY(-2px); }
.eq-fab.on {
  border-color: rgba(0, 207, 208, 0.5);
  background: rgba(0, 207, 208, 0.16);
}

/* ======================
        EQ MODAL
====================== */
.eq-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999;
}

.eq-panel {
  width: min(980px, 100%);
  background: #0b0b0b;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 30px 90px rgba(0,0,0,0.55);
  outline: none;
}

.eq-header {
  padding: 20px 20px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: radial-gradient(800px 220px at 10% -30%, rgba(0, 207, 208, 0.25), transparent 60%);
}

.eq-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.eq-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  font-weight: 850;
  letter-spacing: 0.02em;
}
.eq-badge .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #777;
  box-shadow: 0 0 0 6px rgba(255,255,255,0.04);
}
.eq-badge.on .dot {
  background: #00cfd0;
  box-shadow: 0 0 0 6px rgba(0,207,208,0.18);
}

.eq-close {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.06);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.15s ease, background 0.15s ease;
}
.eq-close:hover { transform: translateY(-1px); background: rgba(255,255,255,0.09); }
.eq-close .mdi { font-size: 20px; }

.eq-sub {
  margin: 10px 0 0;
  color: rgba(255,255,255,0.70);
  font-weight: 650;
  line-height: 1.5;
}

.eq-body {
  padding: 18px 20px 20px;
}

.eq-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.eq-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
}

.eq-switch-text .t {
  margin: 0;
  font-weight: 900;
}
.eq-switch-text .d {
  margin: 3px 0 0;
  color: rgba(255,255,255,0.65);
  font-weight: 650;
  font-size: 12px;
}

/* switch */
.switch {
  position: relative;
  width: 48px;
  height: 28px;
}
.switch input { display: none; }
.slider {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.12);
  transition: background 0.15s ease;
}
.slider::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #fff;
  transform: translateY(-50%);
  transition: left 0.15s ease;
}
.switch input:checked + .slider {
  background: rgba(0,207,208,0.35);
}
.switch input:checked + .slider::after {
  left: 24px;
  background: #00cfd0;
}

.eq-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.eq-btn {
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.06);
  color: #fff;
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 850;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.15s ease, background 0.15s ease;
}
.eq-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.09); }
.eq-btn.primary {
  border-color: rgba(0,207,208,0.30);
  background: rgba(0,207,208,0.12);
}

.eq-sliders {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.band {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 12px 10px;
}

.band-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.hz {
  margin: 0;
  font-weight: 900;
  font-size: 12px;
  color: rgba(255,255,255,0.90);
}
.db {
  margin: 0;
  font-weight: 900;
  font-size: 12px;
  color: rgba(0,207,208,0.95);
}

.range {
  width: 100%;
}
.band-hint {
  margin: 8px 0 0;
  font-size: 12px;
  opacity: 0.65;
  text-align: center;
  font-weight: 700;
}

.eq-note {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.75);
}
.eq-note .mdi { font-size: 18px; margin-top: 2px; }
.eq-note p { margin: 0; font-weight: 650; line-height: 1.45; }

/* Responsivo EQ */
@media (max-width: 860px) {
  .eq-sliders { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 520px) {
  .eq-sliders { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* ======================
        MODAL ASSINATURA
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

.sub-icon .mdi { font-size: 44px; }

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

.sub-cta .mdi { font-size: 22px; }

.sub-foot {
  margin: 14px 0 0;
  text-align: center;
  color: #9ca3af;
  font-weight: 650;
}

/* RESPONSIVO MODAL */
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
</style>
