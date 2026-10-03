<!--
MESA DE SOM — atualização visual do componente enviado.
Como usar: substitua o conteúdo do seu componente original por este arquivo,
mantendo o nome e a pasta atuais para preservar o import de MusicPlayer.vue.
As texturas e os controles estão incorporados; não há imagens externas novas.
Knobs: arraste para cima/baixo; setas alteram 0,5 dB; duplo clique zera.
O fader lateral controla a mesma banda de grave (60 Hz).
Processamento de áudio, catálogo, assinaturas, downloads e favoritos preservados.
A prévia verifica a interface; a integração de áudio usa seu código existente.
-->
<template>
  <section class="music-start-root">
    <div class="music-start-container">
      <header class="music-header">
        <h1 v-if="!userStore.loadingUser">Olá, {{ userStore.user.name }}</h1>
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
  <p class="text"><a href="/Pastas" class="texte">Clique aqui para ver todas as Pastas</a></p>
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

                <button class="icon-btn" @click.stop="addToQueue(m)" aria-label="Adicionar à fila">
                  <span class="mdi mdi-playlist-plus"></span>
                </button>
              </div>
            </li>
          </ul>
        </SwiperSlide>
      </Swiper>
    </div>

    <!-- EQUALIZADOR: ACABAMENTO DE MESA DE SOM -->
    <button
      class="eq-fab"
      :class="{ on: eqEnabled }"
      @click="toggleEqUI"
      aria-label="Abrir equalizador"
      :aria-expanded="eqUIOpen"
      title="Mesa de som"
      type="button"
    >
      <span class="mdi mdi-tune-vertical" aria-hidden="true"></span>
      <span class="eq-fab-label">EQ</span>
    </button>

    <Teleport to="body">
      <transition name="eq-fade">
        <div
          v-if="eqUIOpen"
          class="eq-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eq-console-title"
          @click.self="eqUIOpen = false"
          @keydown.esc="eqUIOpen = false"
          @keydown.tab="trapEqFocus"
        >
          <div class="eq-panel" tabindex="-1" ref="eqPanelRef" :style="eqSkin">
            <header class="eq-header">
              <div class="eq-brand">
                <p class="eq-model">REPERTÓRIO <span>EQ / 06</span></p>
                <h2 id="eq-console-title">Mesa de som</h2>
              </div>
              <button class="eq-close" @click="eqUIOpen = false" aria-label="Fechar equalizador" type="button">
                <span class="mdi mdi-close" aria-hidden="true"></span>
              </button>
            </header>

            <div class="eq-scroll">
              <section class="eq-signal-section" aria-label="Análise do sinal">
                <div class="eq-display">
                  <div class="eq-display-caption">
                    <span>ANÁLISE DO SINAL</span>
                    <strong :class="{ active: eqEnabled }">{{ eqEnabled ? 'EQ ON' : 'BYPASS' }}</strong>
                  </div>
                  <div class="am-canvas" ref="amEl" aria-hidden="true"></div>
                  <span v-if="!player.sound" class="eq-no-signal">SEM SINAL · SELECIONE UMA MÚSICA</span>
                  <div class="eq-display-scale" aria-hidden="true">
                    <span>60</span><span>170</span><span>350</span><span>1k</span><span>3.5k</span><span>10k Hz</span>
                  </div>
                </div>
                <button
                  class="eq-power"
                  :class="{ on: eqEnabled }"
                  :aria-pressed="eqEnabled"
                  :aria-label="eqEnabled ? 'Desativar equalizador' : 'Ativar equalizador'"
                  @click="eqEnabled = !eqEnabled; applyEqEnabled()"
                  type="button"
                >
                  <span class="mdi mdi-power" aria-hidden="true"></span>
                  <span>{{ eqEnabled ? 'LIGADO' : 'DESLIGADO' }}</span>
                </button>
              </section>

              <div class="eq-rack-heading"><span>EQUALIZAÇÃO</span><span>−12 / +12 dB</span></div>
              <div class="eq-mixer-body">
                <section class="eq-knob-rack" aria-label="Bandas do equalizador">
                  <div class="eq-channel" v-for="(b, index) in bands" :key="b.key">
                    <div class="eq-channel-label">
                      <strong>{{ b.label }}</strong>
                      <span>{{ b.freq >= 1000 ? `${b.freq / 1000} kHz` : `${b.freq} Hz` }}</span>
                    </div>
                    <div class="eq-knob-scale" aria-hidden="true"><span>−12</span><span>0</span><span>+12</span></div>
                    <div
                      class="eq-knob-control"
                      role="slider"
                      tabindex="0"
                      :aria-label="`${b.label}, ${b.freq} hertz`"
                      aria-valuemin="-12"
                      aria-valuemax="12"
                      :aria-valuenow="b.gain"
                      :aria-valuetext="`${formatDb(b.gain)} decibéis`"
                      aria-orientation="vertical"
                      :title="`${b.label}: ${formatDb(b.gain)} dB. Arraste para cima ou para baixo; duplo clique para zerar.`"
                      @pointerdown.prevent="startKnobDrag($event, index)"
                      @keydown="onKnobKey($event, index)"
                      @dblclick="setKnobValue(index, 0)"
                    >
                      <img :src="eqKnobImage" alt="" draggable="false" :style="{ transform: `rotate(${Number(b.gain) * 11.25}deg)` }" />
                    </div>
                    <output class="eq-gain" :class="{ adjusted: Number(b.gain) !== 0 }">{{ formatDb(b.gain) }} <span>dB</span></output>
                  </div>
                </section>

                <aside class="eq-fader-strip" aria-label="Ajuste rápido de graves">
                  <div class="eq-fader-label"><strong>GRAVE</strong><span>60 Hz</span></div>
                  <div class="eq-fader-assembly">
                    <div class="eq-fader-scale" aria-hidden="true"><span>+12</span><span>+6</span><span>0</span><span>−6</span><span>−12</span></div>
                    <input
                      class="eq-fader"
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      v-model.number="bands[0].gain"
                      @input="onBandChange"
                      aria-label="Ajuste rápido de grave, 60 hertz"
                      :aria-valuetext="`${formatDb(bands[0].gain)} decibéis`"
                    />
                  </div>
                  <output class="eq-fader-value">{{ formatDb(bands[0].gain) }} <span>dB</span></output>
                  <span class="eq-fader-note">AJUSTE RÁPIDO</span>
                </aside>
              </div>

              <nav class="eq-presets" aria-label="Predefinições do equalizador">
                <button type="button" @click="resetEq"><span class="mdi mdi-refresh" aria-hidden="true"></span> Zerar</button>
                <button type="button" @click="applyPreset('bass')">Grave +</button>
                <button type="button" @click="applyPreset('vocal')">Voz</button>
                <button type="button" @click="applyPreset('bright')">Brilho</button>
              </nav>
              <p class="eq-help">Arraste os knobs para cima ou para baixo.</p>

              <div class="eq-player"><MusicPlayer /></div>
              <footer class="eq-footer"><span>6 BANDAS · CONTROLE DE ÁUDIO</span><span>{{ eqEnabled ? 'PROCESSAMENTO ATIVO' : 'SOM ORIGINAL' }}</span></footer>
            </div>
          </div>
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
import MusicPlayer from "./MusicPlayer.vue"

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
  const q = query(collection(db, "musicas"), orderBy("playCount", "desc"), limit(56))
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

  ensureEqConnection()
  // se modal aberto, garante visual atual
  refreshVisualizer()
}

function addToQueue(m) {
  if (!requireSubscription()) return
  player.addToQueue(m, { playNow: false })
  ensureEqConnection()
  refreshVisualizer()
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
   UI DO EQUALIZADOR
========================================================= */
const eqUIOpen = ref(false)
const eqPanelRef = ref(null)
const eqEnabled = ref(true)

/* Bandas */
const bands = ref([
  { key: "60", label: "Grave", freq: 60, gain: 0 },
  { key: "170", label: "Médio-grave", freq: 170, gain: 0 },
  { key: "350", label: "Médio", freq: 350, gain: 0 },
  { key: "1k", label: "Voz", freq: 1000, gain: 0 },
  { key: "3.5k", label: "Voz-agudo", freq: 3500, gain: 0 },
  { key: "10k", label: "Agudo", freq: 10000, gain: 0 }
])

/* =========================================================
   WEB AUDIO API — EQ + PREAMP (mais estável)
   - sourceNode -> preampNode -> (EQ ou bypass)
   - visualizer lê do preampNode (sem duplicar áudio)
========================================================= */
let audioCtx = null
let mediaEl = null
let sourceNode = null

let preampNode = null
let inputNode = null
let outputNode = null
let eqNodes = []

function toggleEqUI() {
  eqUIOpen.value = !eqUIOpen.value
  if (eqUIOpen.value) nextTick(() => eqPanelRef.value?.focus?.())

  // gesto do usuário -> bom momento pra liberar AudioContext
  ensureEqConnection()
  refreshVisualizer()
}
function formatDb(v) {
  const n = Number(v || 0)
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`
}
function createContextIfNeeded() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {})
}
function findAudioElement() {
  const howl = player?.sound
  const node = howl?._sounds?.[0]?._node
  if (node && typeof node.play === "function") {
    try { node.crossOrigin = "anonymous" } catch {}
    return node
  }
  return document.querySelector("audio") || null
}
function buildEqGraph() {
  if (!audioCtx) return
  preampNode = audioCtx.createGain()
  preampNode.gain.value = 1

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

  // cadeia EQ
  inputNode.connect(eqNodes[0])
  for (let i = 0; i < eqNodes.length - 1; i++) {
    eqNodes[i].connect(eqNodes[i + 1])
  }
  eqNodes[eqNodes.length - 1].connect(outputNode)
}

function disconnectAll() {
  try { sourceNode?.disconnect() } catch {}
  try { preampNode?.disconnect() } catch {}
  try { inputNode?.disconnect() } catch {}
  try { outputNode?.disconnect() } catch {}
  try { eqNodes?.forEach(n => n.disconnect()) } catch {}
}

function connectMediaElement(el) {
  if (!el) return false
  if (mediaEl === el && sourceNode && audioCtx) return true

  createContextIfNeeded()

  // derruba tudo e o visualizador (troca de música muda o nó do howler)
  disconnectAll()
  destroyAudioMotion()

  mediaEl = el

  try {
    sourceNode = audioCtx.createMediaElementSource(mediaEl)
  } catch (err) {
    console.error("[EQ] Falha ao capturar áudio do Howler:", err)
    return false
  }

  buildEqGraph()
  applyEqEnabled() // conecta para o destino conforme ON/OFF

  // visual quando tiver modal
  refreshVisualizer()
  return true
}

function applyEqEnabled() {
  ensureEqConnection()
  if (!audioCtx || !sourceNode || !preampNode) return

  disconnectAll()
  // reconstrói o grafo (garante tudo conectado corretamente)
  buildEqGraph()

  if (eqEnabled.value) {
    // source -> preamp -> input -> filtros -> output -> destination
    sourceNode.connect(preampNode)
    preampNode.connect(inputNode)
    outputNode.connect(audioCtx.destination)
  } else {
    // bypass: source -> preamp -> destination
    sourceNode.connect(preampNode)
    preampNode.connect(audioCtx.destination)
  }

  // atualiza o visual (ele lê do preampNode)
  refreshVisualizer()
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

/* =========================================================
   audiomotion-analyzer — VISUAL CIRCULAR FUTURISTA
========================================================= */
const amEl = ref(null)
let audioMotion = null
let resizeTimer = null

function initAudioMotion() {
  // só cria se: modal aberto + container montado + grafo pronto
  if (!eqUIOpen.value) return false
  if (!amEl.value || !audioCtx || !preampNode) return false
  if (audioMotion) return true

  try {
    audioMotion = new AudioMotionAnalyzer(amEl.value, {
      source: preampNode,        // lê do preamp (sempre existe, ON ou OFF)
      connectSpeakers: false,    // não duplica áudio
      start: true,

      radial: false,
      mode: 6,
      roundBars: true,
      showPeaks: true,
      showScale: false,

      overlay: true,
      showBgColor: true,
      bgAlpha: 0.16,

      fftSize: 8192,
      smoothing: 0.75,
      barSpace: 0.25,

      gradient: "classic"
    })

    // força resize no próximo frame (Teleport/layout)
    requestAnimationFrame(() => {
      try { audioMotion?.resize?.() } catch {}
    })

    return true
  } catch (err) {
    console.error("[AudioMotion] Falha ao iniciar:", err)
    destroyAudioMotion()
    return false
  }
}

function destroyAudioMotion() {
  try { audioMotion?.destroy?.() } catch {}
  audioMotion = null
}

function refreshVisualizer() {
  // cria/atualiza com segurança (Teleport às vezes precisa de 2 frames)
  nextTick(() => {
    requestAnimationFrame(() => {
      initAudioMotion()
      try { audioMotion?.resize?.() } catch {}
    })
  })
}

/* Troca música (howler troca o _node) */
watch(
  () => player?.sound,
  () => {
    ensureEqConnection()
    destroyAudioMotion()
    refreshVisualizer()
  }
)

/* Abre/fecha modal: cria / destrói (economia de CPU) */
watch(
  () => eqUIOpen.value,
  (open) => {
    if (!open) {
      destroyAudioMotion()
      return
    }
    ensureEqConnection()
    refreshVisualizer()
  }
)

/* Resize: deixa ultra responsivo */
function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    try { audioMotion?.resize?.() } catch {}
  }, 80)
}

/* ======================
          LIFECYCLE
====================== */
onMounted(() => {
  fetchMusicas()
  ensureEqConnection()
  window.addEventListener("resize", onResize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize)
  destroyAudioMotion()
  disconnectAll()
})

// Texturas incorporadas: não é necessário copiar imagens para public/.
const eqKnobImage = 'data:image/webp;base64,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'
const eqSkin = {'--eq-panel-skin': 'url("data:image/webp;base64,UklGRi6LAABXRUJQVlA4ICKLAABwEAKdASoAAgACPj0ejEUiIaEQSczQIAPEtKlEgCqZ40/XdgKkP7P//9Ef/e///q+ZZ/m4p/7392P+j6u/0z/d9GF/N80nzn/h/np8M/57/rPWL//+cH+n///p2/f21G0Ot/EQCx/tNgfzz+3cojM26DHl8AY0H9u/Yn1A/mf9y/YPri/3f0Avyj+0+wH+tPqJ7rmgnOVME//6xL/22GPccJid+1/cHwN/av2X/5/v/SN+4++B2n5l/2r+W/+v+t7zv/jvh/zv/n0Hf8P/5+tf/12Yvxf/jiYvsf//+8nsf+j/5z//c/H++8Zz51/vP3f9zr/Xet///eFR//fZq/yX/+68oAb993aewtgF6Nq+JgG8hPae2xo+7YBH7oWmFG8dFfNOn4Mtir8Ryr6Nu/9i3ghu+61Ye3eIVETqAXqRU7VxsUUgS5V13Bz2uNZkXuE6O9/CsfAPSmXQU9pQUf2RTV8fnv/mytW40eMA9ck1Uay6kMTL9MGfq+gztqrMi6NF7OT2G/Q3AQBZHhOEdp/a05y7YU02t6Mw9V52s1M6KD5yERVvQbpwFiWBBFd3H4U2ByMbAohIOI1Znlxw5vWnZnwJ1q7v+VwPP+I27wD8fTdwTxgHpUlJBwbKANd75DEC+winZ9MauJpumfTQ1RNBhz7fwnt+MrgyNKoSxfifAfN2f3y5maE7jCO8+/cHnsAHtHTeVv8hbMb/3tEmqTBc662T3sZyLdUh+AeZhQFxEAwSpw+xMYX64TSDtcJHenA/izxVan5kUhHqjzGYdBdMBND48oi74FpGhEB3/MLzsj06/Kxfp77BMah2deraVraebfmW8rJl1xBhe5Eh93Gci9CxUnuVoluPdF0Kyk3qO2GPCBcnV8jHmlq9xroD/iMRNJLz3utijluwE3ZFxVJlXzSIsRYha7q0HYBc+SavAjct/FZ8mg49vv1mEvEhGYDgOS7KF55QVlV5QaC3PZXdy+Z3+UmCf9l7nOXqVOjRdMp9OeImts34zZ5eE6WMPWoBeE+nf/iwfnDvUHRTfYeIp7DHKmOZwRFRhE+0vRwSbVTizGLcU16niKz1YT5Yqd23fOaiz0ZM5ywYT8E2xiZri23m06eeJeUvW+bWI+xhV9hc8s78OtiqwMyJZgVo/yu25OHpMfvz2CDhTrNiv6aFQtnnfyAcLHkICMJvFDeMaVNuEbh6yKrvhf4CIehsgai3dtxLhLSpWfVZoceFFQieSp7wuCiahxpz01wvc041QLaRFlzh9CGVFtTxfagJmWgX67ezKWWZ52OfLNnBMLs5Ye6jIhJgstOSR+3R6U7gSg2dGyg6+Q06Pv1emdMdPPyyw60del/go/bhopOmbB54pCDY5340VNPy3D2ueS56cOHO4GMysPacrF5fyPbvO5r6joDAgIpAKnxtWNfZbuvzf9T/3Bv6MDL+BIDVxV663HrxYU1lT7YMqVnQJWqHQNGKEG2Qu180jgBaYhGiXA08PQhd8sBATOwrEfUPqonz7J0I2LBYYgAjmUCEQKVztt1gZlH204A9RnH0aRQsYOUkxAlNC7dKGD3xT97U+/7UQMSpxNaqwqjRGxNiTtTQaYh0s6YisMH17i/qs8646JvX//J3ixydO2L9tXRUR34uweQLD0ThMiJjC5IeRN04ODpvyq5QFYrIHkxl2dHMY9uBNxeZO7N00i4upSBGN5mMzEXwhum2t1e2Fy7DjPUq2JomsfEbtzUgxfI91y6vmG1JnFtF+8MjYNxfsMAbmzdpWgXNBAEeSy987w1MqcUPDyYZBsyQuJSbdWTUsen0pQ5lu6XdK1O0vsW1SaPwHo1zsKpMVCRxA+n0DGPpMxwQ5dumGCvA6gqOMU2Hsz9qKSXOcYCz1s4CzYOXLwPKJPh71N8KGJ3K0tHzze8NHTJ9xep0eE2cXs8OcJg4u2MAMtAOQa3VMpibMfOuUFhZF9VPN01y+w9pgWQwKo2QuJZNUAGvzxb/hf7DS8RI+PDz8CKVySqT3qXAF8bWStVeDht8wxq8mcHTbNE9Nw8QCah4wGREZHN/yfIFqseIiN+4d3GDBNM956Fkf8vfuwaFyKUIpxANOgvQxVckq9zJIXxNDEgd1ZtBqHH4hvuoDlC+wUQU8hlGqVgCLuRU4xUXTldPofq4+7bJe64iE/XHbtzL5H77noUTZjr1RegDo08h1K1EklWaOy2K9FTYU/S3pfxrmEBRh2IrMkkuBG87vqVosgs0ePSA+AyQWVVMANcubwcOWbag2Ak97XnrIGHy/BrQi+1vYggRY0PK9iv2lczdsRKEhkBvaqafPMgh60uMW/RBlEVxINf5p7SNFlkkx2cHRYo9QqskgQhwa5ysAcKf6mjq0fSE5C3VrQ8vaNxQ5AC1MaeiwCza5uTpw16fcJAWi4smoCTSRraOxlKb2VohRhLcb/JOIAk6paQcgLIQN4xAja8w7XAK8o8ourO6nEHcNQMQzzn6u52Zmb8Un3y6ah2vs/mhjetw6zsypJA6VUQt1J2Pb23szgdcgL7IxMhNdMq36u6K+M1dWHCLyB3v0WOtW+MoFv3tAKslPy9aFDnNuiwUnIhb1kSMGxSVkt3xzHiyFXFcaEbKjqx9yJIOv/7q+a/aseB3DtKlrRFAGGvhhxr0N08K7qzs3REz1WMhMZhO/0UjN/ReRPtZ9eaYXn/lbPdGV7PHeq+U0u6J0Gg3WRkcqBviJCh4lRKAjjLG8J5M1iJgd9OG8R7CL8cijy0larPqIQgem+cpYp1RRrjeAwXp6f8WsEWp/M6qQD+jGCa7+/lE5IIfoDgXar/61+tQfrmXm0UMWfO8rPA/E77hB5niR5w9IBlzCDp25MPhRLoGfgIxlgkUYL10axXOxT9+VqWm5tpNSXDd2kTcfzWimkhWmDGSTLy4DB+cwNochY+uARuw6dvuMbznWAB28uNWmopIcv7uBKQtf8ftoTMqyrE6CfjQgqJ3L6Jmr3QbFJ4PJvPY/RjL3ZpXBCfONBitHJCQg8Sm+Nax3lbCHt7DLb2CxrfPBpquaSNlg94ELnBW/30fwkjCyui873Dq63OTONCtY3KWjd+cWRT+DERuAY9GG9LrcOPeO586y4CQI8+nceLTvgxv9bUOts0XCfP1bX4WiEYAXd70tY8A7dRmjAgEurN7F3xQYajUU/h8nkj3ylKhKWy4E3bURC+VjY2iaQF0gJCvcJNSY+6mmHQ9apt1l6j9ubgXQNWZL5xvqZQxh1C4VYn127W7Uv77NWR/6NOpWJUc03G4GPF2ypC4XLrGbd/Ss9n5Y/SdItwtlquEf6lwozwHJWr3ajz4i6Si4xJESWjoXSbpuJDcZeWikxmp6dAsV/xxoFmcRQFaO3i5bcyJHKDUxAWmsg+kgU02u9uWlUqoTKHqoLaEmRHeJTsSmljnI2uxpGrbiwpU8fjF6WL/mML9Edd5cU6hYieG7DTdjbklNbBnTIqj3UFn/dybGqH6vsmjQXHyCPypJAzqBCCvPsLq0+IENeadZTBGRy2wl/6y/pl9m9HRXxMRSvssjR3owhTT17pk4heklzyOKUArp+ycWzkfnDpoI2orQ0Rdf3VOCIz0cvPTTSOacSKGz4+s9UzAnwvPcNOSYkXLPefCzd2RFl/74yuQaKDF4PsrEZ7NEMxveH87scDKAb4U9syMT2DkhTzFVO9jsOTZpUX6s48eyVVmzmIDpqsaMfZLpZksLsBnp9BJMrhWcic33y+9xvW3R/T2jdK2UdvAINAZlYpxmA/eB09AxEhyLVAy0ykabxW4gtDp357C8yxQFq6e2Ds3oFmuapD5ecjUOIGy9/YY03XBgO5AN2vVd0nwty/BhA4IGY8oZqd7INcC6XZoqCHctyeU4sGwu36M75zdbPKIKJYUozjcUD250OZZRTbCvHyEpNRSCY1Pyl/+m70S1KL6pf0Xtuw4GKuQYNNFZBf5UvdI4en91WJszpu3IotHpvh0kDhyYoX0VwCY4ZuMy9duRNDIR57u8yE3FFsalRkNIsHB2LlPluAYBt29PrOgFqV4RXKEclitsQ7Qc1PMcqEti3qWDLiGikTHPfBoKMU7OLGZKXsi99OfeSTIYocehqrHyzf2P38I8B+q5Z80GcnP9HhbJlVbuKdZrnAxo4WRpFLOjxGEKHA6ouFTU9qFXvrR/ZhCPutDELdkqXp+F2BJAqN3o2tfTLC1o8pKTEJeTGLC8Cb46hsGRNtIH6yuFWF0nQEmEudx7808P5u7Cj3bPTKsUWgpOWJrVn0lEoKkP4D2SZaQ0DgesRFj2pa+lE7BUapBNk5/hA90VxCGdsxyYdcxzxxxL5CULcuCyOpiNO8P1vQ8Ayir05P2rAh9hFCecBQ3f2ybDD786UmiU6EgbzXgoSJJHooTPoxROVgaAQkc8tbTbcaa69w0bj2d8TELO9FBtmxCjzJTBNr18rcz2GFvRzIKbtD9Fy6JXl9jCZ0btrj9jJS83b1Rul5l4lnmQ9rHvzqQhkgnebgpFzOfm2gCdOhDLUUW5qITe+YPYLt/PaKCvn6GTix5z5R+TmRh5UHFV0WFvQhtxeXG6bktRZKl9Z7cq7fa6A4QNruYgZVk+gyP/D1j6n1KSKzSaI/oZOoqwAAI6Eb22RoSX/VS4Qk5umMuRTFo9ZUS0f9VH3RFJDSXT1rDsAZhnT3y9jdukJWzZMsLiQT5sfaKXJjEkl5Ui4qQEkl3IF1632cgu5JTDuhUpNioBS3N/GgZcFKpE62L6wxw+leBAkA8q5WCP1I6SWFHev+UDvjPGIj3DEm9JSL6hupKePb/yWEH5fUUh186efv6K8hjvbpbTkvtw+j7USmzpvpT2cvuD6IqCucV+/UIscJY9CP4uZExRRI5hcQJhnD0Wl2V4EmdLEgsswlFaLPD9RKftZAMiEeQJVCyJ/PW40KLiAHAbEHxwzWkYVx7lTUSZGsMrMcksTfUycv6u/PaHsoFDtENbak3cuexA0Po/UqaGHQsrrkc89x6NdwOyQ/VhN4un+kxAZOvLJPWlROerKEFsWSaM7fSTaNLoCUgfYZWidvjsZtYKCBJXKbdljV3gF19SUG/Mt5OzW0RLz8BZMXy1KxI3fbzPZJJzvtWq30uJKECqiiw/3gB9HmXXMGmzhUGduo8wmatbHlNdJMIlohuVTfptbFhKqMr8iO9t936IrSiq4EWhwfzKFsD+FV1iWMm7RYcRNVHyHa4kCm5+FhBzQ/STmqc49Glyup+vqeIYd5t7VKURTvcMlu30paVbiE6htxXHFx3OSbUYNitRoNqC5r2tvslZVb1fQGSich9Yg41P/90DRuZAveturGx5PRFIOOeTp+LyujHTZm5LqpH0nGfK9lJpp2/1FZWWi6iPnsB9Y/iM5ixZcTwLZlS4kU7/9IKYXq/aM+8N47Kb/XpVgw55PmHP7zidwbVEkGsu4wdLTYzU/eJczqxcNMMyuN2hMV+eiJAyk58ebDjjN4Kont8/KlyAu9qZ8Camjix9ZBPTigUSEnbHMg0zRn8emZVp8Ox2wu7JKxnP0xPnuMY1urKyzR3vErErORi+o1JXhrOUI7i0M1oRUcKShL/oTQEyG3rsYuxSoCr7FWAF46WJZ/AdajthmehODGiyXVbB3DWYALTdcDT1QAA/vqn9i2ndcrHFVhdRpzuspHz/cohWLNtOO6kWRviuj+VWnyIeCfVzcZbm0cgFCjWD5/pe7hvUhckmruW70oC9Jpr43dVuzgyBQUtTdvM+SSk0VmIkf/zF5t5tOsVatcOyePgJoOdvdhsPG8QywuCNuCwV8GGrg/YfcXWHS6GQ2m3eTZQsOG6odDOFwKpETTD8AB9Oi+eCAckqzExI/MP7+7lqKSBXBaYxLb5k6DtsHck54jRVZKhJxQZdd415C3ht/NfVQg8s+Goe9algRFmkmqclvtqx4OdelrTfD44f1DgIRrlPKYgy+hOEqtmRxeGRQ4fL584ZGE3ko84y4L+X9bM+bPnja7DUWoYCTvKEfSIbVv9lAJTLmKaGsqxjyowNddPCW2Okrxoopqhl0bbuqSXUKwY9TLOahY5WQkWcXb8gcR+ejtqjG5WYNghVSi9XdnIN9HkuBKzLFsa2OUCFUG1VliddkohwitXYAvL3gKbRZZqtdkQDeFD1o6vlxHB8hGNVzcP+9yVAcxaH8pQJG1SSxDm67dQ0blY60juFRD2NHLQ2MMYNfuOP8u5KwQFcogGL3s/wLywwctxxnDj1H4TnMlwiY/WHg9plGz2034xA/oJBGYZ9TCJDZHS81XYGeHxiXxTvhzAh+VFTQg4l3eob2isCzYVqgGvyfxAeQXzx+tK+pd5J8sYrJvvQ1H0mZf5kLuKIHNe6xIwk7LUvJnYaiyrxZBUVzLcBL0Xjzh91B4DaTq24IiwCL3CTpLBT9GBBZAw1DhmuAs1GrbiF0LiPfdBFwTS4CQdeY9pj8fe19+5SVUJepCeZgtaofs8WoxTw5uLTHEAtw+bnwDc67FCxlMbTtHX54f/vfpLkP3FX9JwbNGCXIRD+NYdZ9FU6/mS72NAU5Zj8qCHiOSQKTIqTDA8WFuh7FmlrWbhzfYOms4wVpcNtvG74ZbGviAZFaI6P3i7E0W0ya3kcyTV1R3InXcNhjSiM01pclAkiTOzKI5qxy6p4sRzZ3B+cMnmHHn0FJGPYhXS1EqnFOX8HVrtV0WSfECuq9Sdy8k1XQGyRoVpJkg+rp/fFcmod52rTWgbAy4XnO2fkeHF5r+rjr3tWnRWDt2nbn1gMO+21rpi2uPYLH5JYN630czzow/1HWdRHuHttJH1Lu6yadTYhLJC16vNIRWmoZQdPnq6uxwazi+oyoRw2GcJWzLEhpv9Zok1obaf8G+FwHTHK66FE7E9UjEtLeiBMkFpo3j3P0BuT8Io4TK8eqwO2tZ9flPynkd2QvS+K2QK112dybO0KpminwGnDITGDiz9aMuy1ZkI3YVwmy5JfLaAMVqO9+h0/VPvx338oeh0TZrqI/U8aMyfk+pK3uScvp3hxipOqWUclrEWJN//kWMGDHE3E/UPoDqVjDcwRSoG6Rg/bq8u48BvUSaahAlhC3eomH/69pxB1jHdcm3OcBBmRU7awwP2+jYnIaNw5NyXLnm4BNaaLQtbtSRt2J28vcX7y3daE/WTKF7YLQyQOESMrRMlPHAoTmtszQpSKJJQRTpp70GJz5rsbhCP66SSE6p4KgoPR6Ys7JRMjMGYlPxuvzEpxsnVRdenfctKPYsWAw8vqk69wsZB0Vjxxf3ywtfpEib19FIdydYqSlHv6KAszJ1dobfzHXHV9hslavNeAS8G2xiD0l69+Qc/vCWy//FZd/gph1wbW87gYjEAp3oUkOc25UCygSR+lBC7RCURW3xgORHEbBuRmTV3qNf4T/HrAvky2DcZrEq+gem0j687E2aPkIBPLW74e3uKVufFpfqQd9jgblU1IxzxVCRODrQ27KmJUJs55eRUVwFdfK0qfiFcOYSxqSqS/RqLIKEo8mNWxl88fTIVDbKw4ZcHudwE6ynZOnzpkfadiy/lxe0ejx71FRHSXUtpa8gMywirfDeDph9r1uywHo9YQnjbEGATG+rLpmM6XyWcoaKqGyn5foM99HXksGpelBVEMNgK8lX/SbMt35yhm5nSZW/Mz7M5vmhPKodsYZRbBFy8pSH3Z1Eo9BUwtNkpPXjRAeXp+/D+fW3JFk2IZ6Y7JGco9kMDdmZ+C+CD2gBo/gSaQKXdu0TR+IwfoyvoZSFpxltCBnpjP7Gh0kKSsFRsjBNDW4KnnVgpSM2aJtTrTdzoywUkAazTnZWuiS4CxhlzsLQiS2ruaazcOWE4qX8WdMxdW0Gl2ti8ylijQPZhhgNXBzkw5/i50Zdw35yZHJv29s6C6uYofskfgPQfM35aXFo+8VWiTAYTy4Ml8NOGiPO6+8tn3n4vTPnFcqRIzURdMZmKpyAvddtTQrdIHB4TaIe4VnygOKQbDgN3TvpX9frxZ3DNkcczDiKjvXFovvpn0hltK2CAt76iNneGlk+Xycnfa/B87Z6mVYIrV5RwybrhV7mff0igVbbB4oFMFMbix2UMdagHSuYLkKeYkl1J6REpKyICW1mk9ve1R3AgmDM3ixVU3yM5DOo6x4kJLaEJsGnDzGzGJ66UmuxuCyJqu0f9dd9xKHqFe4fLo2oIzU9U5+ZZM9UvfoPyNeyjkLqK0ALZ51uWN3kOd3kkIv1Apd0q+dxZkj4G4M9tGuekUam7TrUXA34qQZJgpX4xQC7qr0Y+EDBx82FqiCce9nzoCRv2R9CtinPI/LU4TkHxpgnEimhthzXHsZA9k43jK+b6WZ5+bKOx8KgbU/wi9HKetffSbXuwWQPgPc9+3PyxoNcQwlw00GGGuj1bFgCWRzMB6F81+3WO7qAbG98o681/EGUyKDSf0z84CkH9I0gq/VhA1zrNPguSRXZLdw+3cctOlzc8UpUUeID2R0KxErjnaAqebifI6brVgA23GdhlbDVzmAQN4KxnvDUKX2QM5/4z4Avjn6Jc/anDw7PDWjAQ/UeI1HTEsJYYdZE9Z4Oz8Wl8UrK8nYlVacDL+U7hBr4lcO2Orommqv79GbwmLQUkoMLrbvp9UP38pAXHT1mprhoqf7vGkaXObKywTA95oHtbli1d8vTNiBrm2C46h/p2HNVws0PZlB/9Qtu6SZRDn1/TQPe0j6x7LTA4H9yQHktkrf9xxF1fnpvTxhlSYweTaR1z76nbtao5jDg0fxN03+sIYLaUs4gv+iw6taP4//yd2JxmFJgJuMYgDS6Af68+Xi7ZN8rNvg9cN3bx0j+1/ZaF50uDRAoD0TRBY+x7LLvfUNznNNHFf1QEwEqfITLAGVBSn4P0OyLPLDRBu9xFV+sPTya26V+64WPhYWi5Cba9IsEsJbM4eShG8XxOSG0/nyzD215TRh9LajaXoapvQG+4bHmPqcjxpw7AVNWUoqzNWcdPKXWzmhTZZSZ1upWOtKnpBvFTiRFqlseCB4pvWheR64btgrXL4NEhgjsMRlxpOvWgziOGuiVR6+Pgb2hTz2uszbYs7h9j5oQswaAC05XJwZ6+5yIsGpDQrI58kmqPlohFxXEu9Gp2SlGm3C7Gp/6DmIAouR02LOcoThr+P4/EApLLqpWhVYDf0/yEm28UrwezmYMsgXo9HovybTxh/UxeCS4DYeaQtm5mKIgZuHWNBqEq4sV54jD3LfotNKEC7f6Usq7XAl2IVJnve7KXxpm8VzOOiktu380P0bAgPdm2HtrHfHWHRY8w4ISQrAEae8pyn3bKph/j4UdlpQ2U3QB9kUkHwd0eRs/ETq9DWrsmZczrMs58SCyZWSNuDMejsMzfXyLNTw3s8WUHpQbd/K9NwH5vnhGulQmTyyViINItn6+PP1TJLRR0OMcQBssi/WwRpWU1Nb4Eej40559AlT3/ttnS+gxDkTQWgQc4w2QJ8aE85spgXbX5kBH6qaYcw1wyU8BZHeGyTigkJt4+EsK1yOojdNfyNLNCa6ttQ2VQm/SGTaX3fJ455p19PjYB5nZfHqKA1MGxF3Pcd4AwFOQ6rxTMOWH7cCjudW5daqPPOO5rkkXXDHNVy3CxcueLfYY1+q4CSzY+IuuOECXz7s1cKue6Ws8UzM7BDgtWNH+AFP8jd8vXETMn9kG2p1T2ZMaTD8wwiPYUG3pfHjN2LwOIsCJtkj6MaY8TyB01/olWisJYXrt44ykTLkCyRPloJm1jUFZR5ixvhi1u+3NkXxTbyqSYFIrmU9maCCPpTFkJ7tDwR4SF31V9sYD+rQYvLeo64dt8rNdNrLn/Sy8HuqYYzKDulElexqBntbuVGMTnH++k5Znhu8bAXSUNNtfN/PlvPOJjzQ8tiHaQXnqPzfEtRgb/uJ2RcCAOE/pGTlPUQpAG37DDNW+GEPpkase5zIqPruK1bxG1xSY1G2kI6s31O9YKUkcgn5S0EwP9QU0p0XMZrj160WoHxFMk9M9Vfcbokl3FimREBDKLpzRs0FhKOh2vIbNIaHL9gFiI7FpNT+8GVeGkqJ3FNJchcfXIPh6P2Pz7CsRTtuRErvnYNpNupV4wdSmZd8fpuTi1qdtUvmJimnxwzt8uTdoCbDjJVVCr8rgIx8jAP4Q2nLwvg+qPUFDlMa8boAGWIV3NtPeC/6z1L/PKg/PcKuRTONTqVRGrY7PlPhIsdsmK2JWdwiGwvFv0Na9A7j+qA58DALUtUf09S6nbFl5NOeMpnX74Q1Y5YtrcRyZinWeqDX/fpvehHyyLnSadziDCJ/Udz1+RJzpjy1FisB4Y25zn4hEB2uDdjmTI9lxIL7n5zD4JCbAtT3E9FHWT9loe8k38Ddmxp4SFKTWoxY+bg5HpjxRr1nt/usu2zu+tC5O3y25ZoFDV73vo6m3h14Rr5HEvSzrFV5GopkUIfFgfPoF0q5t2VVnehce/BwasfguS7CfuE1u5d3rXoN2nOtl2vspNyqqJ8gotzQN7iTQET3s0cf7wtpsYJfOzQfWeq0y8S/LcYD1h8MbxS4w/wmrp119HlzVTwOnzdFomTxqJM5ZT5uD5sdNwfvZB53eQd+DB1mDF4rlcPhYivf/UFEZ0t+5hWa38uNYaGwiytg1M8MTeBoOTta8OQBu5A53zmopHUeyYVW6aRZDPIV85NvghfSBXO53e2RUFS3BVGx5CaxW5Y4Y/9dNGThkyzR+xz0OKLqa4VXf4KPIDHzw71k0xmYdWRMNJkXsNvYh9VBc09AK9dQBceYcka0HC7RslbJLUIMxgCmKJP4PIsvsAQ9Ne2ms2a/O/TTrTvVfjQ3nMVOqR7utRNMeUjlDn5H3Q7BFV3OvCZ9kLuKkNI3uTUCvttUvqg/n5dJd7eZkHqLeZ+Qz9CSP15m0tUiVz3JB9cGL2g2Z1Ilnj2NejTJlgXch3N5EBKemFkuOyrFSMsWpzL37vhQOCSDIYGg8jLjb9TOx18oKdsnpAhYuJyW5CQAJ+6xx0cX9bZHJebJzEj013svZ5Udjj1Ph1vOK2d3lfTDhwRpL67bV4LHvRE8IX7NYwCKs7jJHmtbMM39n7XDfx8GgUkrl/XKwKvI+Nf2DPcVWnnLSG7WEmFi6QG49P3VHzaJPFIOGki11NwHiZ/AsglGslN/yX3h3x13RqQ7s/X6eYLj7PRnAfZxzSFQyyljj66+GIBSJMrQF8jRkf8ehVlqGNjzdkLgvgAEyQ/4JQExAy3I3p/YkcHZTcLW70EhdHv4SG+Zevp36EfSDRnc/O43Ef3FShLcjRXwul6+W7N3P1XnL2Sk5IwgRZL+njrkfhCC5MgTAo6XefcP4yDMd9Vz6an6fzjykAWVj2+V618xTW8CIzKGLvcTlqnUWuzVCciUQlQ5KxJTJ8lLzpMcUzjHqJmpkqa2V3hr9S/bB54lXeQ/9FFyz5mifrU/lAjDXnIOxnx7DA5qItmwJN5oZ7Q9yLlId0Lv/NmWu+7buRAJvh38lKmfyPtHLWcpvngb/1I3yBuLPFzZb9YU5Mh5Q50c6ujdujF6aPRi83CVnHLVTUYzfMUCNHpTD/Btg995Va7+JqxLs5Yr7PAwXGUmwwKd7FLv1+krW5ai2LzSuCweZG8BgHuyVDwBr928hK5YuEYoOktS2PDa4XkAc+rKG67oKsfu3Ias3MfwSkI9nTdRuOrBJ4cZrsNk3KxYaL2wZiHaGmXQ7e+bB96V2KeMZOeB6u1II8zjVA2x8O3R3KJkhBpWyqJ+NZ2RlfFHBco6vMWrp2t5GLYBSwLtYAiV07ISxoANA66dNmBFuRqw5eP/cKYDKpzteD13nFs1dJBJnVP0QH2shVFJ7cuqvB1b1xjyhG+XjtPhz3Pa4h1CfPwH8/eVSogTROBxmxwUr9TDTPKQ71VE+zAD3u+/34m/02g5A78AubMoULqXASFXbgFPr80S5zjUdYxWFvQsjWfumz/gbzyO5q5ZoVIet3WgvykdGhah+hemFaxROXCnmFWtmvbO39PTsT4JMJY8Y6titziXzdhN7Ema0fY3HCs8hlXhfDH/HQGHOeG+qaBQ1fKzJJESFYpEcggdBRJI3tU/9Hl43qtRKaEIgz4F5JNirnFSppJUtHdFi7l4vELwX01PcrWzD9fmrW08v3d/cBZTKi5wH+LIVl1e2exJIzZMzbnBA+eQmj6UxSHeVHYtZro0b1mqlS8mVFOfm8hjNqeegAKHG33eSFIHFX/LW+I8j1e4aGmwQ1e99BV+fD4qRr62VkE+uU5EHYNy8UE0SMs4PDNlRL+6Z4axJijtK2HUuQzuLkb1EKqloMOEdV7244dvUNAtU2wQhgLBAHV741yJXITXk0+HdD6qKPEPnbWQay/ZKkfchYn7brMTdVukG6T30evtJrp8K2Nu9ANwWBgIGLNJZiaAAYcmWxnNgxoqJpQMWg6sUGb5waL0AgHrF1n7jwqmp/uUlfuXmwkDkXmfN7ciSSTbdzZFmG2QOB7m20s/O1J8TBSVPYcAl8Dw/VuZuXZ81jnQlPaQW0qaOuHEhINzliU499oqG5N5Yh6m2110hIXsbyHUYXO7ypCPuOIOzdOH4/GFhr+OpgEBtC/Bu+fl8sUYlXR9k1nXWr7fjqJkp8c4+Ep3YO5klZ8qCzB72OoeGY5mHAlm6j1tB936Ozn7C+zJKT4gynLan+7BUL+ld0dshidCzNFzqTcYvtbmJoMsWcMIyPcZd2aROCbmJWnoNSEfbkpXX63CKAz884oXdlFKAP8jkOH5TxWDL7pNMzZgxV0iItkdv5Z2OnXtVqzxH+cVcVnEa3YHZMNVsxsuz/bcKKqqcFyuUT6tqjgtAGq/mEmhrhI+Td4N7xx/OsgC6ku28G9ISDPaqhT8ZQXQBX7r9MuhLZw6AkgnuUxivw0qyPTr3Cq3z3i+OnhItk5RuJI1qFEXD0FQ0s+8ZpoUQj+itx+uuQJ635Uwu/7DmMMKcuATIHHlwTCXt/gMNK6TKlujbNwhVva33bQaLEklGexZ7xUofaTApgGsgfsK6kV8AyfX+R6dFQYcAot6jT8sDT47A+GxWtnzei1Ls+bw3KvZpxe8nRCk386YjKDwkf//jmrFkbctdEG/PJ6gk91Ny22+CLk81KdyE94wIL2xm3JcyalsULl/IwvI+Z2/uSHkp9On/08Oz9dzsGt44PC8hgNK46AybxaxW4VSXY44j2fGL+MbjBFseQgznHBve5JPjk66op34k7cuXDfapB3X3UH81su/FWkHv0ugY19o26KdLhdq4yhF72mzKjwSPauCEWYnAMlT6HKHiuuEy5cLWkuQkVghgc+JCAAGJnpvbKpUS6yWYtKWmBYVpSxXoKufCyjjXKEO5o6IMFiz9+xqEoYXcA+2WAskQaRJeawkdLkm9zcqiW21fei+Bnk0XL4+OqJgcRvLbE2fssi9tD0ColjP4RGC6Y/xxZpLTw4632y6cnb6uAJVKiQ3D2b4a0nyoAfjsgEOCj9Ck44RJBFXJIgy42WshQH7lKCRVW3YHaWO+Yt37skKm26KKgX+j+G7N2CIfeA1buWxmcwDkzHrWRfi4j0lsWxXI/9aG2DP9etXROGXaE1uZ47mb9fIwBpES7nAr9OmmnB/efXhXn2J0663rjd/bh0RVUx12lisdsVzMLjfFuIYcTF+T+BgHg7C1jhCLvL6PU3s+acOHBz0iAr4VUj2iHlJEpPFYDxngUaAgNS+4JVbnJSN0XDJaldDMrzscdViKjhS50SM19IjeN99EKQUY4oOOSw+mpoR5JMeoMjsfgKaB9qH6A6DWZqPAr0bOSjwhIVKK5O0UMFAkLXkP6vVxl6n1UETb/3CWCrpxiSMOcy1NxisMvtp+9qornnZO1EscJlzz0O76jotW+s98sJJ6fnWMNdlkrCxbnbV4GZC4w1cBsFPy3BxpHcejz64bk9JD8Y1yRL7dWsTGlMkmyzOdIC1Sy7EJhcrhWEHmNydOEIVPX07DS5J0xP7JmMEoXF0ABxSSW/xbOMiEhiC72Tc6TLAII2a63yn5xIJttWpz19WV0bAjYuIwJDpXWw/uwp1QAsdpgwQO/bENY/TU+d6K4OtZpm1LWNkOrvQW7drxSMP+ZA72+Cwh+Qo9MBrSzxJLwzVqdIWYDmAzh3d4ZZq8E1wAcNncx3pkamLwNyeluh73vVQOccEuxlOo7XwPQ6mA0sn0rqQOpT/nyEDyCVLaLsMXJWie3Ffu6gp2CatCcFga4OGw+CKoE05XEEtdro0l5b5t6SLXLC42e0zQwo2XbpBRVJnYX6NGYzvp3lffXqKFSOfhVaXpfM7ec05ISuR+OzO3H3AVYzBn2VNCOcFBiRBeMrc//uB1bW7ryaOwPRmTMyVFPHSGaw/W6vLie0m8HX+C49StuniwctO1+AWsVleVxOcv8305jTpkNFBJPot7PIOcQXv+tC9mAlPTj5bscrX8qMzdWeA2qBEbFeNZY8P+VSAtyZPViOGRXSRKCROJagfchiD9apiHBEwILYyjj39gdx5P/DiXITUmu2t9R7HhRqRxsnnfFhg19y0/DAF+0Yad9+k5phVP8e0DIVj5ZrfchrYvRhEqXJD7XUT8HCxwwkzSG78LTvdjj3FguSTGMAdq5Wdgjjye1iBtkkXSarEUjhtmgHUKXmqI3nGyigoNjoVZ8VqKp3bRGsOFs/+q+Do2eeU+gNiMihd6iMMBwpIMJC87XjlGgoUXSNZ6UTw1VD6sMt7/L/Zox/igzhFzOSy1ZhZbNcg818Z1GXa0GlusqrBeNgzpowiMfSpPBZjCCeaolOTNsBbVuAFHCnh4GaIfz0NtOsPVSw0KAkPhfJ4AAwYgYSkCEMMMZYhYw+f059L2zKdwuUVM9k+Pv/bC7huyTaSV8rvGQ9oIYOJHFAkOXqqCTw9u5jeylv20D+IGSQLha+13e1WA5nsHMpd9QEnWw7jvyxj94wAeLyTz17rpLZaoy4VMgIqT0Q0DzPWh53g1AddP5ppU23GAHiyUiidagWWoiwfE78wOxM+NoYMYO7KQph5aoi6IweOCFM6EOGG1fQwRebIzaFCrv7GEmdjAiERuz47fQMo5MqL2VM2v6t/UiuAHZDYXioX3UUtnoZAQRPP+BZR3JfglHYTuqpsVfhODdWtO2cmddgZU/z5h2bHzJx9Hhx1wQtiWNxgkQEdJYWlYxfFLXNhe5TQMwvjVDM5yrZl+wDSMTUTxV8umXRGSp4on0vKdX6eA9u7+x4O+pXfu8+P6UvJDmpARXHD8xyh7BqXIO7M+hiXgnE4kmu930ZO9lCUVYkFfyp67cxCZVXH/XFnbLxzUHm68TG8qwJ4XkRojDhmCprG2IzkPRQ7nAyhSa6uh49gT9JIUnNEAbiYXy3mfwkitsgFIu5h5jooXC+d81KKZqQjrbIRXdZ2jIlRQjPtulcrr2d48tCHhw7+XQ3dsSNyVjqi1ctoWdPVuFVrf7FNHCEftqvZkBNLWxbzXtsqiIxLvF7R/99Yt9CroByevj+r0xBLqumf1/HJ5XcBQORP3HwHmmXQJEELZBT3DBf5PTTnYCfxwqNY8cYUx+J3mixSmaSWtBbEQ8Tge8kO4QeSJGbS/BP4O6SEONnsDZPyLpiQMPHn/F+o8N63I1qKvYwQgboJwLHY3Ua6CNAIE9M1Wb0JmI5CkBF/ppZ37y7Tyv0Z+MNlfMr4UMJ03vgoiL829XAGA3Lq34AHzJvBhPvIIJWA3wFFS7MUwYS4qYJHdxT1X0j35YFdOY7O+mADQeahUE/oXADqYhWKl2c/Szr4b0bref1wS3IE1sQITcnwbRg2cZDSU/1+UlcLmoOncQXKsk9VWbELtzL4TQfAMvD93UHGHAru8HymOLkfuKs+R7N2h1Jmwv9tZoh/l4PrnOZmERJ1zUU66KiHawIY6kFqhFFeEHiK4NNw5Syg+r5RKpIuiO+GaqXtB/VhrnKIOCp+AN5Mo7Tm6Wn632VUwXTtK/8i3zPM8aRlwkzGTNg9T5ts8BFMIn+624uBDYFFyT5/4FYSdmzOrKeOXfcW7+diBhsr1uYf+TvHKtzE9/V9uqercGOMssMIuUtrGNqw0SQwxGG0jAGKQ0rJxDjQC0IPcmbqNN5u3XiDwmy++wfrbomrFgUKrxBmBdOOvXS5x0W5m3GgSGDq4op85MJEKt4lLyJb2MQizi+9ykUOwGhzE3N8pPU2Ns55bj/0DYBGjmbYsDV2vx4mx0v7GyNIny/mhID81BAiMVJ1YyzHMC3N43P6FwMgJr4CKVGDzQJjg/mGuLZ1ljEdgOrbtQl6M/nnA7OQs5zeQqXekfqnJ192d5VcSQ72rq+6QcNOA4t7thrxsF46FO0QR/a0mYUEjJiPgB3/DqXzoiWSEBzyBlt2zT7/B/K1lF1iFL0spY1lXgnUZ5/pRa0HO8r8OSR4vKAv44UD+9HvmZmSdsliWSCFFVLpSVkb1RWXGBgaRdEDjCquV2RtkkVHUHgDo7dhZyUJxWw6iJ9v0ENLKcqKTH0sRImT03no5CgJIkL2Ht3xMRJGubMHl9EJdUszHkvmMnPdGuWNEd/fJzLX2Kx0TB2q/gARIeSq6q6V+SMpagn+D8nqDZE3BgiTsjd9b8FCug05oTHFdmpwOWDsB/IkaXGYLTMSQzFO4MA34UmdYdSp+mEz7Jy6+52cbYCUzXPLtQ+V0hcMMdenTr1RwQJS/7qF2YxgtlQIrbX13b5RxYs+SlaCZvkDiAwXbpKwJDLV8YbHEYd/MvLKsMXJzRjGefLqVfDU1ES0WQYOudctSaZOeonPCTaY6ZA+vqUs42jOY6kiUx83Fo3KpsBVXfqlFJyh4FyTWMpMDtVTzUAhLN0ZUbDH6+q2pRYG4YjgHnsjOubHUg9GSHF9Z2zciVLI7/rC1lqk/nuD3+t3FFpBt7JyHnM/Qu06rtib2XUtZ2BfnMiIrAxPLHeXvhlmPUSzW4n4LjTNsTepxZr7uohGLii7YJ76/CDbktVgBA1XTsA+/kxCE+vSqf5s9YM+ajL8UvRaD8xzSJ1/m6URqomJewJ+BpJXWkKM73K5zJaI5P1xjGcf9iS3bDBosD26owV+/xJxbjKA64qFZFH8aHMmzMFMM4J1fP+CuXJF4PMBZPtIknx2/HD/zffuznx6HupgPK+KPzw83LNdT69ZrxlYJqi8HFTpcQsXxtHtQ/XEJ6+J6egDSs8I8NfpAypLSI/9zLrvLm6OatsLpZ7XTUIVrZ7Kd6M7frmM1bfKzzXTLyJqHxgx52tRyr/cpEDCFFoPLHDC8AnWWDNqg2uwM44oxbnd6IIVkrJK4JwDY2VmyFMiDOlnjqu1kdEocsR6TnR9pbPk8UArPySiJlPc6ixVp6jRTEG2Z3KMlnuKJ1ENLuFILHyZ9p8wLs+RCIxLda8nj7MW0E3N7uSdth3GN3H2pNgk+HDBMOtNF8HMBchkUFWynSE55uNBA3eHPXYUpMmA8KUty3DU28ZwOZYEsPpoqx5QuRvKtvFliU1DH+5zKwuj27PvkPPVvUZOmoPyDTQ7bp1WlGf+N87bikrzf2cT+SupULAN0CmYy4Wgqc8c7zBpKdYb7EwTflIpBCNZLu1KQkvRXbtHKglGvT9MDE/l3Pr7nDl088iEgHpuwmgixp4zH7DD1Hx9j9YI8fwAvA2mmlivkUhUkHabumQljIgqRrb2vybVo+iw5DVa1uB+ptgkRn0tTx/XCnKATnK5Q2mrBTwS2XCY03O9ITfftvdAfEIZ81JPShST02kL9K9lTryLSjXQaBwREL7YX7evJdW2AOviOrEhp3qZf2oCB/P33s9tdlpslAgnuCua9nMJXvfwtW5nJj+FEleSmy6W9ctzWwttBUbsbhJ2jnHW2cBZr3NtLySfSIdxhq6bjMgTD0qPBO8D5WItimjttofWeq3Vf7JJm4f34LwtpkxQecD5Y99SRFmqgl79TeYxt8+R/8BPnbpp40LP1cEDukQM/GBLJ9ylV9Gpyy7yQzzOmUZztbSOymel4lvmT9lPYoB5hMLS7g7jExOslSg6AZjmLv2m4Rs+F4znnmSM85Yp5q8exCrssutpwQgmaM+7i290BqsmVD03NO1CGZczRN38tx9Ge3IuX8O3jSSG+6aEyeGruMuNaqMBXSTLDdla9yTyotVDZUv4+wKaxh/I7fzI1jgfTOqd7alwO5laL9iL+ua/J8o4i/pS9G1EEAc/4I3XWMhZGW1B/uIm4olKzJgqbzaHgo/B4N3xEk3pq2+sp9y1Pv+JRpOuiWQ8UVOV9oyhBsM7brrtXHIKSne3MlrfPWTLgTNrpTwnJSh+tQZ8jgi9/cai/qWMpKRvQBH7bGTHxdarmtsS9g2E0qED0MM3JEwcBqJkBd8ajmP/aAigtzzfAhRgRBnkuMcIV5oSbDaIebyo/KnC8yMr4PWRh5BnMQvT7RuEDknov7kVffZgNrtB+UfcmpvZc8/+8Rtkt1CVTscAmPMjhLht5TmJS3BjzsC8hGigjfCVQb+6pR1jrmd9NWrqKsmRrXsgHgL0z4G+NjK3woToIV3Rr7iF3tVui8TOG80nyCn71/KpiYw/fzpKkzg+SHekatV2jOcsy28p4N5B9kUzOwYXq5+K0ZWWPPRvtjfaMVRdMW6HQHa5OIRpfC/cZ96XrNcBN1n1NdaZ/Vs1Zk3sOUVKnEcCfCgFKnFF8IIZn3iLy+YIwDFN3RiNnj2Ykdc9FEpq2pwf820P9Mw/H2hkvRQW9dtJ5m2HHpxfc1xxYPgiEUvAbpN4+JpnvV7bCNgiGCu/qz9zXf1E9zGcJqCNXbFuWvjXyMxpC8uyqUNLAq9Mm+JJquVW3IsW8hU1HUQnCiTaEcp7SHVdpFDyyg9CkZlx58DhZ7UlUhIGvEIf4LmmXq2rjW0MhX0qbzyt4VbZFDpZBDLet8OnBGyuK7twEzveIETtyYx4oAEQ1OVShb33wjAZApw83HjOWAA1jb33Isz02Sk41blkSIHH+KVj7o3YY9uYYAGlW2TSlOZcfEjHg5EhRx3wJGlFIQBDLaXo8oAo27aAlMq2z+oaUW58qmmpCqKGz27o6i0TLHQ5MOcdpiydVLxnQJ6USEW6lD3O7829bZVwDnoeGf4CoOMaXVr+T3G/F/bTGh2yaY80C9nKnOQjxr98JFeqK7mRBSkolGU4ADqueJ1rZwwM7RjLDgpDDz1tVpI8W8fg/PHuybcSHhNywuIo6kzXQS0D/r1nLYB5CbmPaRpC6Gsa3eo3NJHsBNw6ffeOoU5PdluaPOJJDuX/i7LrVMc5u62lCZMef/R4ywhaq4OU6Tu0Y6y7vSW4sccmVeIZDmJod4Wmd4G0pjVZdmDN9kG80L8JtAJMwnyZX4m2rfPVsnPQ+D8wkbJwWmJKgzWERj7vBjO9Tetoy8N9AFvtriha5JDtT05ul9mYmjtzXYRFG5kHRkKG9vlOFB1LVk6q9F1X5B15hU9uNEaRhb1D/WRMYX658c7UoldhL8mAe2X0cdnvUorD088aAuXCXfrCxGPc0qdmSvWtT2nfvjgBIRILLpaJ5XPzVbpcfN+lvUaAldPGafNFBC3Q4jcAPVOb+4zi5XrLyCpAe7y/t4DvWpBN37Y441Ndmb6tCJQD6mVzczHSA8LxM7jESVTCFOUrpxTlHnOviBDKofhqM40y3T1nHtrS8mMZ1Smr6JvALz8d6Cjm/h/ixFnk8jzQ6LksUg0Xb48x8wMG332LaqyAevS1EDiPD3r4JaYmAQF9rQaV8J0y0CQ+eAdLGkjiuiTR7VVPRmG5dGKxcLbffn/9iUb/bnT8SA1R71lWRDtlZb25gAAQ4MuSjTwrrwab4BwJt6DDmdDCBVwJXDN+Nz/HtZjNNfk9D7QDNuiKeyuqHIhq5z9/Ju15eCNz6lBSuzobNWT0yl2TBULUcMPAe1bLY2oWbxbxySBOYNfvCZSc1ems8Zwxg7AsS6OvpRlV40Ixtck5ybBi7A8yUAs9idoIQIHOnKXqPVeHxxZY4H3SNDBI3G12i+tfYhrwV2neZN3F2E8xmIyKZGMcZ+mr/LG6CcuEhBMy/c67EAbDFECt7k80+xpXnMsyQ2w2hjqW5RBuU/95aI14zkhV21LvGHm+URFz6p4T74WXXASIWYH4D6KuuECKXNbw9DxM9ML4C1XB1q8jlBvcL/nBLqWbA1J/FZkFBIvyUJAo0nFUNTSMoHOwVvaH5u7494G3mOqIGSwyetuoGYSAJqBwrvEHo80m8JqBC7AnYQUTNydjDGn1NPK96qyCuS4E5+i3Z3+QFJLnGSOlklyIWgeyG/7q+wzfAKHqANvL4j3zKtFAAeXJVUpxWHA6O8R5omMXsvEcj5aNB3FOZFtRDvs3UKGu7pYm+wXucCpgcvqTbATjk1AFXv35PYAol2213A5s7Xx6bw7jYT6oGHhKWeJ0VLIcZ9a3YQYQ+0OIUbgRiG+Ap0KziJVxVlcxK6XsIHcyOO6hIhh+wsfVM2duWTNd/DsoWfDw3iYAVLYAdPr2K4UY10lHMnUYtaIhR7ThW6ToaVq6qUwfbnTnTjNt0IsNwE6mI2jLjRwycuxfNa7WycpLBIcPWBCYWc9VGUmu5MUk9tHGXuuFdJBtcyTu0nMdU0U4VJ/y7wx0/wUUbw4BqrR3tje0yLcCPYCu6yKqPiE7m/yVHGcbFTxhr+h1hkKPUlkz8c3lFTriZRAz192I1HhRQtQS5G2Nk/gOD++VEY2dj3Kzct72zHn7pvVShziG19EXSJNyFa7XroBKaycqahrq6lJhYFQvxt/x+S1SMN6PQ4DumdpTmonxskfUq69WfHwRnzPm3mhN0GohKtloqJ18GAmwEB1qiyEpUWmfT+yjy20nDii3SDRcrLmpKmZrvNt3qlSMdM863FEVR0mclkogwzFCcAgObaHnBWIVMPtE8yA2LjsAp9uCdIZF9ktYZ6cQJgmaC1WuUwYgBAmwpL+zFc+W7JxAHVM8sWmm8U0DqQRZDvWOS0YBIkgg1JSxlC4TrsvJbrpTJHC0ce2OxFOgyehY5RIvPu6T5Fk8r6NBEtYEJxo87iiw5L5eB02is3Lc7trX9B7IXIEjUYdHX16OgJvfadm4WG1N/Mi+KsKyWmmuUd3PARVuSyoZzfbWJI+k8GSJrE/JOjeRCR/LoeRa5ScXeilCNM/Z9+wbLOL1Qsuy/ljpYgGP068h/Kdjy/wzTDvUWwTtubZiYpsd0iHGyOYY30Rv+LlI6hRP4KmpSaYeic1wM1HL19f0JWQz5lQUz6uuDzmQywa0o3TgtrIdOsebYMNvuW+EetlVeoUc7MqyQGhX4FGXREUQU3zxlLzNMfVVNHIxkZhXhx8o/Z+vfuKgPiA/tayBI8Sb67E+Mxvd3EXjQxG7aGUUVxxBQVnqINt7H7olKS4Y8XDRkD41hiBukXApthA6KzLJc6bpL7vsy+DQ1kHQfcf4nD6kYafgJEhK0LA6/TyBw6JhGg68gSFwBzhNel0cbs65U/ZDyY0T5nG3R8gazXQIVCU3P5m5aT1LZeoAE2T5RpVC4w0TewVrBfLY+nWGNc6LlNrK6f/C8cL5RZmDHxuZFgG3Vvt8Vnk3RHaRF2iEQATJbh5TtIVIafaLMUiPjKetwy0WRhg7Yg4zhINO3Ht3FJNBkIT1gK7SdRO1n2tuYpz9VnyZAS/4SHAnISfZZjQ12mGU2Sy0oua/fKwrcmiJx8Auj7gA1iKRMOV524OlHjIk0BB5JgNSoFRBNJhBU8gbj/Ore03eX9xVji0Gong8chLDY5h9h4CKFwge5cg24QdZBUklEa/PfQxHM5WFGq341614QHqS92pmOAPf8ExnVWF+yDsCSca06PlLRRFeaqdbrYjAFOTTmfgwASXtDTtQNND1ak10ws1/eAlyeW79MaSna46EXzpT6QzR4s4M7PYT9EO7v7cTNQv3HU6emrfTrxIagXicOYDZ5GwYk2p0mlCaIjOPn3s7/9AFXnwufoNqWuVR4dw6s1gTgBw+mu2tRKp9wDdfw0lopLH2vQZab6kFCA4V2cU0odTABBO5VhxqlYiyb3RWUfPBu1vHYfgyjnc155rK8KjzKotlyjyu7jM9LGTJ+JBauyzgCbfv62ncVVxOzeNRvKAp6phU40itRmoQhKRL3vYAcxkve/8joHpCtKtYqXaG5+ZcIT7s3lvaHyF3OW7pp/eBzjJHZ5mCFs4T35jk3A6HfPTpjqxf0x7xzpuxZLGXr+bDJFqoob5cP9jrkxtuyqAF1Qx2SEEWU1l0CEftLKQfMRkd1533YlY0AyUc+ZPPXqVwr0Ii5dU2UamYwSWKY7NOis7m2hEFT2Jrj8gchS/NYastbJF7SG1GVhT0GFwkDREAgF75IZbuAQ+DG/oL6g2DX9+EXJ/q6OCfnEV/kWUcn6ElcotYhNWubBsbTE8QlcBDPyCPcBYGlx99DRA2fm0yZCYrjCUdRXS4duaml9QV4MZJ/tDi1dNHqwhPOD8M3wsOphodIjisQNzatUzzK+BEsqRFwdPAwzZSZVMeL5yJXZ9YxaojFOO0pX5G3zFr/cknQsqUuwxj6QJQ3qlcUr0Tm1Zx/FrWxEqSdZE3GAQjRkDFwBzIGqtKbBq7fdRc+aBf06O1YNQbOg4WDQJNVd4f82x7Sj03fC8xEI6X8ffe/7OwY66zAVbShEPAf5af9MnUJbrPLIAWqzPQEE3zVytKXvvKPgAbnFefXatyDvcCmL/aTiCXPhc/v1V3AJtNZL5+M6VuhnNIoyykVh48+oZ0AAWg0/LsnRBUQ+SDk/j+T1VMZugWJvsLOluXTV0g1oL87H3CC9CkCEZj6A3Ia9lp9uGlNv4hqqBf1NJtn95NzGf6ulVG4ZmQ7JbZTKP6SrKs29KMdrJo59n/VqnXo3X9NgMjwAb7AkRYciJDWPBM8el0hSs5mTC7aCawZgO3J55ZLK/ccHh2FRHkx4kkUzoDR+UgQ7QE6gETqDs5HMLRsioz8NZ5nExkUeOLegrhp2hdbZ1kz65lmNa7Wqi2twrbueNgVDLnkZdOqZ0GzYW7NmqorP1bPICXfulsu68sUrhePGylEOLC0+Wjl7/FVZfBnrOyrewlFe1+qwn4zD5LaLjFcIT/re/+Ia6qPVvLZIGECMH2pzMLMomxk3iyL3db/Ac8VijTKlacz5amDVpwarIi4zU2Hh2b/hT+gfz89BeVhRMzc5Evce0Pu7Z8FcSzpiGIQamGWe9X2qW0KA5xIH2dxYthY/5FPkCwZUvVidkloBtpvTc1iMpAcBhO1PRDpHkGsZUYFdFfqL/1Sp98SKGy0O8RMeOqbRoqrmx1X9bR6QW7J8cISEOrVXtICv2pzynKjJ9c4/OxFlssSDQ+oOCQOhT25E99BDKNTu+rnChogIoJ5zIdAPPRPWhOXEoQFEo7vqnyhRYPWlmsI26eAdwCv2HTj6sbkFoP2p4fWk+Q+siF3RI/Mgh1cko2oLwcG+z7fExoKraZR6OpdGYc0WdrqEZBRpjtwChq3kBagTuqZjq2no6H9iaxpxgec7ozZoaqb92pI33MfqYXrgY5hie8iMEfV+B6HYapRVVnWYEkLKugn/HHUPxpuRP9GhTR5SfHBdGZX+nzVg137+n0oLSipTyU/dXH2mCwOjLyLyRDMGiBlCkwBh0FhBKZcUpHN16kM7jXYJ6q0aiwhJSuhDcbyNCluVdSJds2NV5B4RQZJPUjFqgJVr0+VgjwLmGUNzuj6XOyib3hjOKzYvWgeo74hxtNTXQw4lunWvEU49EIlN+/iMmvB/AGZaklws4J88Issy+ljBswZiLe0yRWaQzt3toxRNSB6Wm8ngL63ANglGllOv9h7FMHRwxCP9KdI5uLReaFycPAuq1vfSHg0AYPErS4FcOJyQwcVVFKYpdVP4APIv2IDHS9uhZzQZO6DgWdK9rNzmAETwWLrD7AoFjZaawFmCBjEHyFKRJkGYDK0orkw5vvl2L1iK/Pyt99L8dYqcLuvxYkSTRFKCu4UGfv/ENC7znGBm3HD8B4NOsRzeqNkshdPCts4JY+QZHpRMkE90DpsZefphAiwral7nuWrJshKgxVv9XMjTz4cySJT04ytwAQUkoOpavdehN1RQRNaEVEmN1s5+o0ESB8Q7BD0oBznFlQwi3oa9VFfK83cjzaj1EWSh3r9cRdZt9H+j6ucDQ2FmtNkILqdC303B/86i1ZJoDklq3HLdoc3NGI74L6ERodv0jM1EVAUIbuCPWRyuQj3bkUhHpu3ITqf02suiTWFhDp0wqTW5NYB9VCtwAxh7cQBpm3Kspa2oS0TGiSpCtuKXEACduhjMXkDzc5BJDGzKvJPRxJvKO14KT4QLxi8aQfdvuqI0YUwsByzdyOtghiTUP++DeZlX37Rg72S5JJMM2N959G+Tc04n2/3azupLFOsB6k8pPzLT8QvmOc2HwbWM8a17L5arpfkPAmyrwx2rE58f2NHcCOD/I+5VyCxUHXJHao4drP49CCtZK43tIHamjL/8Aykc5UUIPvtr9YJ9NDtLA1k9kNuupOa+ZSf2bJLrVPadtUVmPvYwYLhqI6O3or90KrfGrqa7uQCF7T81Q6MW8aHAo4H7KWWxt4CRPsGHbxuCBnEslrMBQ+qcuv/k2EzdWIi1Q5lj64+7HGYWZeYgA0L3Dz9+bGOX95X0YBfOUxDeVBk2uAUq7uxl7mfrLkPBi6rXCBrat+UKa2abu01QdbaEc2HqkwMwMdWSmvEVI+M1rYhPWK5hbE+BvA+S7A8pQ0Qt5sUznzRKsFGoAyDUI2RGJXkWtCreohg8wFlV/7+vDCmefwkFiF87IqiJyrwxQQ06hymfaXP9CwuPnF6gVml/f1BpG01II498mCqJkCuFI8i625EMoLc6wbXfIvpY2iwlrq06rdZx2z4O4fdv6l/y5tlTyJvWba8p3nrzDMspF8kvZcRI8mEvxcZt0BKOyYynxri6TdKvJUI3qe1Fb1Sz9Z5FGQZ7hYLKLA0qR2isA4z9N8CvG7H+CAvG5HVEwC0VrcDXmMaK3X4aK2XLAsNr3qMIORIeS/3XaYVudGHPHWhWoJF3Wr4zQylrWj9yEBhowD6cB8R40QSZwGsPWGwV4rasVjZA0x2bFlvVqZEuzhjFRCUm6vVNlDaYsqRlYORryCemQxxuIaLD49Vtj7SAceSLkuhNvtMLnlwuVnXpLokH5AU2P+feHj9EJM2TbdFRYn7CEe2F+w/qswzBB+pcZk7PqhzhIuM/mUTRM9edNzZ1pcVAmIZr1MSNnAWn5FISgJSReqzDWv5KNX0LzdmCTWSnidYEgfOoNen8oucz3XxSRx00NeL4oJ500zTpSe+a0b0T2vfmivqRD5EhNzHJaypCSbQcIljQGIbGbciEG9psDmvaisuo99NVSYGy5bjbvx0qHVIZp0Gsnne6fvASvqG8NZs3cJut971UeEy6i62abeC18Su10E8JNfD78zD1+A6xYiw7JuuzPZywI0btAQQOKuBT+xDR2KHJfkdnbBZAioXiBMJPaJ2H4cvFkVUMD1j9a5lWl5QC3hNRavmVKmpTmc9qTw+4W6vWxJfH7Pq2W+DtxsuLIscXW5aaM7rM50nX9k8FMhatn2EdpuB6Hx0g8lv7ajpX8OvQOMZTC7Se/P4bRjJWgswveE6A+fn0HuwNDdSdCwllP3oowI3sFLPZHreV0aIFePyz9PPiKl89VpM+76PBlOqwC4WsQ8gxuSZzHo9gfG3AhbPHxTTG4WCKKOq3rmOu9YYA3GtUpivD3hCQlB4RK1/YY3R7u/29dSHHRgzJLle5YCpNYFV+38bTrGelLmtUXvBXU/c14FktSyLZhIJhAgemOfSr2Cqke1wAbO/VPePH1F2swsrZFokD7rRxV86scypcPYwn8JpJQHPMzz16aQ2VlFlLwzfAhIuhNCd7ZgJrPO4F9cVLUDpwjTuLPyqA2BcGxI4hPhOyKY8j5aEE+cRb5ciXNhDvV3E7menIGzjCz/Qzxd5C7aJ7ZLEj61SmhPjeWtXd+85Gzto/6WIPrepWfJwW9M5ctSiGWrTiFPywh2R6RRREtEunoiv05TqEOk43S8EmgmqiLj8eGHJvj4Satn0uKR1aWtaCPtBcbzwiqHvBnBoASUQopFWz6eYCGUcxbBQj/UHA+US/7BquNKslb7ftfYnV93T3gtvqDeTi0arzE/OpDyS8TyHXHye1e/WFrlYCNVtUihqLeb5uj5W7VTWqMWHUyaJFpn88mRfEFoniCW6OfbBBFqYWVZ5TmThVwblPvDz6yNIhYDqerUMiddUq9aPz8iEjXi9dO1Y1IQVTGtuPEpRs2QV6NWY3Ksf0Fvpd2smpOs87zuH6wBrjvCvqG2PVniaTR+zaRH6ix1azG1G/BnXcCv0j6WBWFJKxJC2OSKtU4jhIx8E11bDbBSV3/hggdX3WvUxj9Jh06RPs6obmJkcqVwBP8ZxFmrQn2B1G4/dYFsWUbcSwnDkX4HdlWjgfc6dCchO4WllEFJRGhMrFaWHFmj9fSbPi/waVleJwKdAPUfTP/ueXnSUGaU5q8AEHZPO0/kHoK1NdfEcHrWBkNPb81K7NjJyIjVa+g2LmueVhQ0e3E+RnpQUGaxbXMZ0xyD12rmMhj8IOmiREpy5ko+Tq1SqE+XNZ6iRMKQJpO+M/KiEZqztA/BykUFazl9X9K1TGHMiCxMOdkAeRyIyfykTZkNNCE0pxH26e1C2BO5XbFoNLBjm/yQS9RohU3ulTBtiBn9wnsjHxafwfWc7N3J5x7vsrBdQQUs9JNl0NKwsiBq5kuOB3JDWzTRlVQn99GPgekXvPdkj2rcfz+2gnArN3DROafNeUMe9iEX0q7auUXytP6aS8rDGjEl2N/svE7HUyADme1/R4u5FjlrN1/sGGXYDCnE1opGwx21tJUdgF679UdfbcD2c9K6UrfXHpHQTXaW2BztHjMfdXx0b9fUZBfHoeXSnqNlPUBFx5u+ci+ktfwddDBogDCplunUsku8d09V+DcfWjmfgkHhEGKRn2ZJ+eNTWeu9ubuphmuLdgG70BD+JwTjURh69GyNxJjQ5nyZt7HTuCon67/TrpUrRLG3lC9nSsq9RhMOh8v1JbZx5I83DkSXilOweEtO+VTGACYVAsi2QUQ4oqt5eyDOT2jbtF3bZ0MmJ9MOMb/4QcdicH10vrMd788KwaPs0XrqT+1jEQqMuSip3YpX1yRvUjsr63X+Mhq6sfgNXIVztd2xDjKEI82FJUeDmNrtq6k5gPfP1Sd/zndmc7IX/3opN7+QyCdLWck1/v2rAAUqC3MYTuEF/oan+fsazepSAGDxDIcYRF0TYGxQRx2AkGJrE9A2DD2yvpTXfKXsoJJjPjuDXTQUOzB63ysSjrvafHu1ND0slUqtKZYIFkt5X3z91+6AMQvWKfat5h9qjpURnBdHfyZyIr2JmeX7Ak1MK/4IGel6kjxiG+aPA8PG2GqmUHnJoHb3FTGFExQOZscYDfe0xRSQ9ZdhltzDG+MZeZFGJ++tcDmekXy6YQGME72CqlTa1hfqSQU/efnzHaMALRg1ohVP0ORsxkg6xZmb/A7XGWYxnpo9ygi3R2clAaOBqC1dKuWC2xaMGIdwbBtOE1vkckwXGDOzia8YEgkV+w0CQfwcMnJJ225U1zLUmgl4b/VxoqU6s3E9+Zzb/GtbwsQhD2MMrBy0lW5t+gb+Pt1TH1usqlzYwfJ8dbWjKEwXoQ0FniKIqxIl7XhN8sA/ILtkSLmOhZqhFVPpAk4OfktKvzy+Z139Rzl+Oap7vS3hUigDgmDV1GThjp5B5TbKf/jSURtprBgUwimRHPfm5GDEZRpSRX38pohC9yiJfuYnUBYYjYP0xc+RQQWJfhacWYGOXgCZfSWKdw/ylhat0dU2kPj/Zc6DBYsjyKmtw8cOs0vblqtlNY1cqoAZzPtQhlZCZzlHKQgvf1WLeIS70TCzVAuaSrC2hxIokd35tzYKoL3Ccpz1Q0aZvTL0GyUX8RXjxw0Jw3Z/cE7Zj279l2HCeNg8146zONNU/IlRaxKCOzmQs54HiwkcdedpRgylOqjCklZPv3yu5tWHNCiyp4JpQl9P7vAGAuxjjo1K3qVOscdNseoyF5VbNSx9MTOhC5hJjbPzlARvMYjcGiRmpDz59RYnqyu9tPEsFGx/HSbExNA0+V6+qKbR7+19rC0xywi/5RvALi6/U9Ud0ZLDFdpUQoZVkO9aOswtusx5FskvRa+EYOJO1xUZeWNlL2RdW3H/XmqR8nnaOoTHE3eLNPAdoo6LTBsDfPkQWmVlcxH1IH37wllQINRAmxtT8IVNvgcVChS8zDlo0nGpLrYN5/UpJV637zuZgv1BENfK69v7CFGiLVfN5rS4nIu+pFN2Mhbs4aqYnY7dcHBzohodI7dr5XI43ErHGMc/agDIcZDDAXYkrcI38DvSwW3y9QR0TPIyajjSegToQ/VJd9N9WWtiDqDUQPlmB5yhJVpCMT/L732uWjJoJZcNuFTLv3wkVoPtEtWJhE0ePZEDdI+vYuw31+M83mMynoFUklkrQZ4rBlVKd4aGAhbq4kv7SPRnQETQAUxQWdwYrScf2qjIkimCvoWopk9owoZu9bmDmJFzh81B6olpiD6yuzCU1iV97oYUpt3xYvk2YyBwiBsPNQPaMrb3sXGBLVRpBFk1vh1nF/gNI+RYR1usUCdj1vmxhKcocgHbAvWBQkPT2kHgtFVgsxQwxy56n+t8JWH0NjPhxZWB0GeK1I77/bo0sEW/E2O1cjtVHJLOMr2rJnAsYzNE5oieKhe5dmm/+DRUlZZ6Rk+KS918qYpNfrCZ+O2qqGVbbLYqzBXMQ6v5KODM79tFNEVoUuRtAQah4mSefW6G5++3wUAfacB3Y39v3j+BoazKGYbp0rUuxSNPixCVWvwcJWWiJim/TqwREecUI8tpIpMkmwuJH64ZuZ+WEuIqC05s6wy7MbY3D47+R1a1zffBc2cg+IDoicfaxThdSWBBk8pInTqj9GyoKB40YTDm2y13Nas5P5pZfuskbXevzdqRK4rFuYvVnBE6xqcyfNTPAlEMdVorKUrJ+Lve0YiQfDcHNW9sAn0ChDXhYFtV8tqis2A3ktirOCTiDvomiC6b+DCIP5iw0gWzaM29aGobnv7G93ORLWWsD9xRNP1bLY2nt1drZjvzxEq8s1R48n1HLrlQZKOs6vsoumSjsCJAAZ4UtimVIgs+WA0ct/9HDCoTZrRX0nqUbmnUoiLJtIsDtakeV2PRlG7YN139elc/ujHikmDLzb2w7BVA4CfTpJJy4rGiSlzF26a3zRV2SHdc17Ynkb/0VGZbM/7+bIO5khkyB3ppDYm50JrjaEmzRwtPmkYlXO+DNLj9r74m7vFnHTENCasnaYeoMjHGZCHTOr4ByQUBFm2gxyiVMdM4Ukqz4einNZx47t3GvWNcA883gJfHBZ2kdE6ZzI8PYzpCVSjYuE94sQKvwpg8uN949qKag8xzwMYGeRWRCKBf1qAWg05L+zvv8yeIPApTO9ZIwtfaVDSrQW+75h57moDiRLcyw4Ef1g5WE7uCJkyL45pn81wmBgyizEMj1Rj4351D+jaCzLt9MiFavL67fYXZY/k8RA9al9bUM2WZC7OOVnR8yiX7yPxVehsrkbJzGzt6Vu6UFg28nSGixrYPhI+AkfOORqaImraB5J13BTi15bKCDbix8YHMyi/xQ570KsMFU49EigZp5Kb91LUI+ct+s2oR9o78rtYslSXO1zqw3pWw0Re/LgcFK1vpvkrxMTBILjSrDiE9VBln0Faf+CGkkz/6WYC93TOCZZ3PcNCm8APBrKAFLT/b8+xgLYAyHSVHMZisTb2OJSASYnXyzAfWqzkYHqiE2DdbSRo5v/KVh+Z66zOW7D3ZyiUl34ABVWGxgRqroS+2mqQ0MlOKJU4B2WJYS+kYr5Q7RnAZJ+84X3plultnTjufJKxaT+TihQU1sDtjfzqyf6htlqsRQmJMdubJXBmDNC341J9yt7+7Yq0bmYpYcy5v38NO2Oerto9A11OLVPqKJQ/Qu1Dmmq1mFuABuOpOmacwsgxYEMX7QNoL+0mCaDANtkauTxHTvo1S3IFVo3GNqBv40pfKrB4eYYNOVecmkCoCuLQfFj4kYj4Xp8WymKzaV3UP/8RvdKUuGeiM2MquxuyWqFQlydVP04MLg25mCd8YggP/lEJJXgpk/5ye3rJOvytZE4oYw8cbzu6cdpQCtqCJ04CDCzczf+uRRYOIMwbvdCap+eaZ3hrRQhJPjIDafucYZepqYDOkhSFF1SkKRE62qCWhK/1e8xTWpUp4T8zSL1MZAo49xvHhfeYn0tIHsb2Jton0WKOQdPHKbZ4nJNvHhNxzGkMYbmPpMGTByt6hDyrsBY2XgTuQULAdTxZfnVWN+4TgHiRRIZ3c6UBmTnklY/H9KH7J+Hhja59Y85XT17ga0q+vb6qRtOrDQ91d7c3IWT29u8XZTQ0r17h5R31fIhDMKwLiZ+nI5YS8vN2Yrl3vYitIevVmbHQEep/FPy+9i9IgTYZwlEZJ5Zs2EV3T4oqad942k8956NPQ2zFynWHp4P06DxDaqdzPJb2iqncbpkHv/rn09y2So8EuaOmVD0FFXFz4bofaFABPufo85yBLy8YzzG9HVOn9fuW4Yk52mBHmwPOLzTKKCwqOPBdVwnhzpS54AXyFOjiJQv+3UqGP/JKg8sqdvAsy4pfTxY/MuL7GiTi6khOAXnUpdIJgt3jQQOktCvd25SRHMZLciBrsYCVuc4diWrksBP1cTJZXw9tpm4F70HMVA6R1QEaY6pG0wz1S2IijOyzUtha9PsrG5WNzIZglIySB8/Ryg8qxoGOryN+YNrMSclsEkIYRZiUUBr9kJ2WbDrvGIi/HOVYhpHdm8AwqscQhTOryzBWKxYDqIv7fjp5Na1zoCJqwYFN/Spmcc4e2fMa32M94NCHLMQQ80nx0GYxtuRTZVP3IpHbRgj7fttQWfz+rwnvctNs8ziX/FJ2fCxeynmtm98SkQl/p5F+PZQQvlie1FaBv7Pn3xxaydGB6HlAbnEzUErHHD2BASFF5SZWdg/jDmohzuEIJRS/4lf68ksIrpJBiyqOsp1ughmtbsx1NyJck2Ne/f2blrWgDikInJYewudZqU0Qg+WE0qIuVpVx6FtVNnlYclcN8Qft6lsQfl9Ic3qsRp3AFL4UCjGf9j99XUw9pEnGpc1otdRydM22SE6tXtdV4xvoX5DzrkVL2xA2Zqi0NBzhipBIqlGwdp3x/nm41ONF7+8DCEeUF8Fwc6Mbz4ydK4OV7KCyqYWSm1Eu9d5oQRqyvmD9Dr60RtinsE/PahYWfa///6XJbjmdTDdbevrZ/OhifFUzCQe1Ws5QNL5kCwhrcG5CY5xkSUsXjgIP+5WxuX1ILRyIF7M6uNn5muhcWCw2ZsHrBmZ/VqROhm9cP8O3A0iC9h/rgQfyxdFFNBLnx0JHcv0eK+hs9zoeNmXSnGa6O8g/3IKyJHYPmd3oRFOdzqR8UZZ6cZ7LWMF5TRn/paZxjSmUYDt/Q7nldCx2JUdwWHo1vzyE3Jz4SJqNwRodQyaDSzLgWr2mdf0esnSbafES8usaUGnl9cGPRUn+Noh3I9tqiTz18UXZvNWufEN7IRsbwyoNINc01QUFQYbfbPeNBuXmbzI8dZN0ABSPcRjRKAyIjFUCcZZ5ae7C/hatWE/N4lLZ2cxFHbCfmljcB0btK6aQV2JzKHYYy7+aFgxMBEsSwy7Uzlcfef4yGTT7uKvGNhN+i0SCu9SpvDJWRk6TkP6PpHzJ4nHYFt1vn5Hpv7wFyrqwWJJGjhFH4HXQ7Yixz2fVFqfZgLM0t0B4zugY6xPtfpMepv4HrZv2NITBDDa3Hs8Tl3BYyAcsOS7WALpvfZMhRT3zPZZ0saC6eiXSTt3sDFeC0iven4B4r8Vm1hsZQ6/F46O1oQ1OTtyATCRvg9J2eY/Qnzl9F24fOMilg9jsUvDMBhbnmrHRrb3fthdH0Yk+ZWaPw2fZCiM4SBSa00FBW5w7OeIYA8h3FLida1i0Ps8NkKsM7wDf6t3DM9VCzOiIYLOmmNX7kipo3a+MT2QGDAk6hri1K4fSZbFmuvvweFJYivI8RI/tVSO2pJYptdjytVq16xWii8SYbHG51MHxG33pC4hSfpprPwtFvLy3Z0ZhaUJJXV+egyr8RJA5aYMjDxQUuR9jDieNQy4RUFq1OCFb5EQND+fEJgFOZwL2/eMH3TTWWjFQucivo9nrDtzRY6eFQa4QOleP7hGH1vCVGIvfSXrXDxhdrLAige0LNc9vIRtbHctXvcWZxs9mZxha/ChjcLjjv/Ayg9SAuY0vqohRKtdSPS0Wo05snLr+cExy/OtDV4dEkizJ+Y7BZZBe/YwDfXEv0WUnRFYKRZ3SLDRjvea5wYb1iU1rEkpAsieY7S6RJNOQxymMvkuYWZvcOmYIA9yfKfgxHWbCTaspGJL7Wsif5m1jUmk1zxJm2BaJpGLPsFeStwOpfRJ2tFIO0fBWGdqu4it4Jz1PdCDTl9GxOSNBS1+RK2AX7+SH/+MmAwOWIjs50svLs1QXf9ZTNFbRswulRyWoRiW0/gZwXwgnkwquEAN/DaIEQT/KW7BpOV+No2fs4c8AvYrFEpBA7pXb9517U1Jl8MdZMvuMDcdIrPrI7FTJARDzNCM3XqrqnM5QDQvWNqfhnZPCgHOJcPAGthOfypu4BWZItmUVme4xomyZaLDtBfPZZ4b1aWtdg7nl4uyN99S+qNJNozoWNz07eO8wmJtX2I77PVIGw34QiHLMz0A3pTrlxyqRF5ZwxkImNcSFWkH5Ecr80aQnaEbekvSJrjbntsaPk/IIaFBn/ksxG/uRFlzZrcZAARGPvJTheesAb40Q1Ihm2eEd2tu/Lrm2HqT+0Yv3w4h+deLm6J1Obw95EjI44Fjm9XF9lDhsiUffCJ26mrC+Tz459qreksv6aCFpgDKq28JKl5fwerDlHxL0MoZyi6PT4iTqvkZtIP8Az3ewMg7u0Hk4JetVAOStaPwqeaTDrtEpFkZYCroZZRn1rtR0pC/b1AbUtFmobaF3zSkJUYa4q8jQ5Iz19kdgLOPIUI4frjSwRSRq6D6Gx3T1KMDPRREq2unAZ7pU24ANZGy/G8RlrLAJEQI+vFfF4+dWIMijQowqiZC2h9FqbQZ0ZHqCASpg77jflr0zLsjs4xElYtKm3vHHTqHt5YfEJoocQa6L50YNE7I9TCHEZ9seSYaQ76rDtngnjdcMhU8xlqeNfPbq02UkdVKDYRO9zxnJLd7bj2ChR7A5i9nPtoeKnem0fmA0BP0L5iT2ZZ6lqdE5dpZZDYoBejAuAJALWrlqkokQj74Z7cIXr+dFc0Jpe3ZQj/hy4Ms2rWyYWQ/fqRlbbJ3F1fSHtEo0zYxs/RQb0Ri/VTkLEuew5A/PEYz+05lyHdCYwfhnigRvhUz59H2avY9EE8f1UQCbqzgMlkZ7fxdTG+pyJO0QTRx/AdwUBOdc9mZs4v6Tz8qw7jUXxVtqhAKjEIClvjYcRXRnIrJBlSlFOHNWfQ+d6GfdkvE16ouseY98gXfKNn90dtTNPkXX6Kke4teFroy+v9NtH/ScjY9LK6IxNZFG2arqVHICDqJOYpfTRa0sCwxZQqXrwTsKCPIkDsExP045Yhseb3XLYnxjCfOLIOouEnYBMa7LZBRPKDKSS1BG+h6KGP8atu9mFYK0BgPuOKVyKHoCfRUAQxVcv6lV97LQvVT/07j7OkYz/JR7ItCsEQIPMs0gN9VBw2H8VUKXKTr2zUZkojYvNYssEyFVab5120CHZTA43QBHKmtgP12U5t/XtDJAiOBDLrPqG7fDQhZ0sk2x2eFJ+ODVnpLPkeUWr1qAZjMbIwKtAl0LWdwNQWT0vU8n3f556HIaP+dVRferiQVHXYmq44fJVz9vVVa0EJhLIgvw+fg3rNLC0XrcZ3vrgauQ+FZaglCmZahumcD0vRRLUR67vAmPI5LDvCYKcamXi0ehEKR/ee0Yh5PN/gWxPfIJz79cBiuyzIUgY6mn5fPWDBGJhGsVBI0ZOaYW4/SqjuN5sA9uTj8QrT/KdasVla/5S+bQAY2YGfZOssDjw+Pz0PSR8UwhaOU1NDO7VGte3Da2GYvyyX6iH7K1mq51Nna3k1SDlx03eKEATK5WB02e0K1Ugh8jPSYCE5ZelKSIOm5FuhsGVFHTMxYqvDeJ4fGqGEY+G5f/u91Dh1hZT6SPLYRkbaOtzOWiB4KZnZ1n2Otfdxo9aDzuJNFxda/2s8MO181uma/tAblqLMA2BY0/lpgM1P0p9wDfuQAsEXe2ACEy8I1QBA6jqkR1ORu6VbI6J2yFOFNnDiPbuCDjtP9jBFi+DfSyYBz9W7k0X2/RBtIk14q/rdfOv4q/YrT1azqxeXOFqr74EOP7XO8PBbHA9VZ7iIlSS6cQQBl2UuWPDpvAJmNwZ6UyDUaHEL2PLmVqD9dAHmSPWyXGgJx1PhXLH3StqB1D8lM3UdFiW/35hBE/iFSqCJ/i/7MMs7kqyrz/yni0zkGDlqnuzNExM2ntzMiZZtU4lyHmh97mCNM/rPqg0+w1UTlBfnrPBtIUuKVMOUyAi2ilxNgRY0TJ/WQ5I9sO9V3NDgYEmYWcmQtE3sSnyz7uX9/hIxftMTjmMQZNRCw0WBw7rCQ0isaBNZ0ExnrDPq8Yc/Saayqdp+lcj1IK+FPfJIbvAxg6HjeWqiQM8liHVliwSLdvTBQHrUGGr0B/WeX/R0xkfahn7iXIHiiKfsxkoTqFyqdzffIJTFnYtwR+ZkrihfgJNj3ghsCDgPLvABb8WL90HUj8vNgK1Cu4m6TJWlxHrIrphNOcsCl3pOjHiVYbfisP0pR6Y87U58x5PdI9o066EtOLn9lTJ1yDl84Huj83h+W7POGiG1x/cojx7G5G/nuwqSS6T3SCac+74I7ZdQnzZ/UrnQyZoo8Rq3nK0FQiiRwVmweMluHMzfPDuIJjN2VAbtJC4HKbDbkE9izwhEInlHXB0RzeNqj7GK6GJIRIC9jOjXVDh/BTzAN1LTWaT6Z85iqGEdokey3l9GKzeCb0WnSycwK18qviJCicXvAlkG2xv1YC00BdhzRYvJY7SWVXIvQVWFh76JnerOxhHOVwiTk4m+zSxbWHkrDWHnjMAe/BUWPl8E5k/TIAaX4Y167T0zEOpbm5SaWjiO1QVp7HbZLu4j06YMSUCW6n79vN20jjrLfVkvG+fSJ/dCyF3zuJon1KngGJTSb1yTVQOc1o6nofNOX3QHQxMBIFCCEija10b6PmDEpli8NNdxlmwkYqyToCJ62A7Ff0uAmDqfyBpcEJwRNrCy0GupRfsk2hU+++/tOSs0I5yGjIoqeow/xof2L8aXPVJ3oOwYHUlM0GHfWTAoRsan8cVn0uB2oI95vLY5JxWFf0LQtupxDPaK3LyiYdCY6JZG9srIJEnfUw56NdXBA27rxjzOZ5GoDy5HDWYXySEAlKIeG7+2zgmGkcX61YdeVAeLHLRTV3q6hZzx93Sw3EWEx0oOOQJOovg50Wj3lx354g7SSpmq9XHmr4Uxxr+MiDNz4SwYDZNOYyNaaL4znmUUeouMnzFbaPcw7rEDcEdKgxLTUveESR4srRPunBgmg4NWTWD4XoaA+89bMxRjwS/3iyjXheVHuibfRds6gOW6M25dL5DPEf4Fxw1QoHaOK1jdVvlngBP+PJYFhAHjxI8JPz46U4OvJgnVov0hsNY6K+GaOfr0nc7DyXdowYvlupeevAw/6KnVeiilAybIGlJBchpoV+H5LIgzkULnCx7Tp9fBItCjpz4e7cd78BeobdlcodLJejxsNcpVRVwlkvL4ykFkHgsJP3unlikk4opTsbOgd/8seok5JNB0vW0ZkxFEWLE90b1JCu9R9wfd3GQKjDp+1txNqrJVq2c6tLGg3P7bkCeMUmKYch8gN1EKiCBjRAOtAdk62v7+GrwpUgnIAWHwAm9ie+B2zu1bQx98hep7a35L931echiYszRe6mxdJOXNjNZYRigroc/5o4YeV/GkFpCZwadELTW9Tkbxi2Q7ruJqYu3TXf0XKKsH29L4SpImMojHfcjumqn9JxTL79IRfvlGRRoWOOHOX4T2HY9aN1gqLSwsGq6bpK4k8/7l7p/XDMn+WMcluJxSR7kvJeViFJpYnIRW6LCh+6b3jy/Qggk0kdeaUGSKTabRVTukVzxr9ZY8rwd04XPS9p2ABbTdrDjIxA7JxVsusbQqCSRodmm0Ywc6dZui8XEVCpwSfkbKTiwo6uBH0feEhalqv/wpfaCH9u9ST9oHgWlS2hYvv2w5NNgUxoEZHOFjACYogUBLGII7XVoav/BTlpoT6gLvTJ15xwevy2gnsmWYpIJqyS4rqkSuWL/gLcAkY4s0tSErZmMychywMXG5Hft9Bxh194g8fm15p8P/xozGCCFdLljnKVWvPHLMw0CojY0X/uv1AwW8+vW8MX4MqawylsYIIn9Ug3RKKZaesJXmfCgsiUdgUrNcVfPl5KxEEIp6cVkMFucOzAOxvRhZPm1m8XDcqSlW1aQGkrJYtNwa40TPG05e5O5NNufUaPA71EDhHWmsBdRaiFVoANkZX0bX5JfS19sWBgcKgJbE+Ox0eBJRq1eNgJSuCBb1QdILF1YQRItz+mH9USTB2NgdPrmNKly67p7P/zVnqsTEnHJ1dzm4vaNo6bw0m5LtwzQ4R7jUj3NHuIcUbVXGMggaUSbsp164PGTzLPfGOo44a4Z922xQkOPaRd1b3hCY8OdcwqQGJmEkC71KzgEM8A/B5O+hwIHv9rDodZCsZwqLhDfpwVKafJuuH+ZcsEKcP9o1Vgk9qWUP/6hP8b6D3S12gdowJmZHPhuxAtpHfLB5xGDHcL0fqu7DuNwEVBoOGwNo2b44OCVreE4mmG/weH42i0MGnF9s8I5yrV/lnwAW7PpxmnyObAIWxIOPpiv/tlVghVMBjsrmy0JMN7pk1wBqRRG+3OkHr+gGMpRlBb7ZJomaUHIiqo+mB3J2+x9s0snNGSHqAuCdH+6PGCcUVqM5cmwfEWzTcdwHMF9IZiq7HPNATIARg+zbFjZKlf8+KFF3vfN3tBqzWpMAbxvr7pNQFed3x76yLCMGPjC+V02kUlR7Eb1abGh55hZ7L5fKPU2cb2YI9kw7FHDP56JzWSmAnWAmO3xSEjaqH4e7Ny9tfpQAEImPuYHH0DxWA9HAn+35wREe2MkDCIvFWzbMhOamx5X78q+lC7lwy3vQgNETZpdozfqUjdQ9yD364CDstAYfXBPRR/p516oJa1lMJZ859AOeMzZ39QxBauDVQ6+HhzXvG2uz/VQoj/Q8u8qvVluVX5fhmr5IOebf9Kd+HEYp0h1KxLby2XA2IU03R78gWwKCCe3JuBctPXU6eVz1KlYhqgmSfqXgjwaaC6cZwosSM7lWenuuC1h7XHAH6OOSofEGcxY4TsBrTrjgmq95olLa1sbCGIxd9bdUZJc32mOXughQkQYpD04K8KvqvL4SOZO1YjVrdJDx7bScpzzRyi7fkX6D11WC0yl1h9sz4KqN1DubhVFXbGDABjWVOiV09XK1uh7wYiMmrRVTAyC658MQw2uO9vNnFssVDJ6Kat53HIqkkLv9QTAzFneev1jqkEHM+gDYfFS1eM3zHSELXlp+bI774AMYHNTXNXcdTRI/MntQOstJQr12oDjXyysMcBpkI8MjgZcqygo0Gl9CnB+EAYOrbd02LcsWkKRfT9op7cYvmMrIsx+WI7Zslpw/J9RZ4DDSCOEU1YsuOjaghKbrb1W2HjoibP/mEKtN61DE8jw9ZzcK4UGAnkm92DDgXm3jDWIFkt3ub4Pr1LPuEOE+huIlT9JW7YOcWOj+EvkoaL1pcxJYE4sN3iIb2xKXCMcgVzOsn9xaaHOJ42/bEYBOcIm2NrzPbn0hH4P65XsWLXCwXcOgXXZu33yVyEY89tlh109HKIpOU2jehJc7gOVTZR9AJ10M3yevjCACpYKmL/ebPpM+jg6Fg1kQXc3zZGEHB/48VnAjCaEIPEZWn7wbNEvnbg++tUfyZc8eHMytZgq2VvuhYwalvdODmTI1J9fbKmuJViozEGTwo2Vdxfg070DSrl5BuBaZ0wQbBq6bihzvqBFbDEAzZvw+9IBrIPR3SZ+f536pWy/td4WPimVi+6TRgzjngoctHeL/6ndMuDuc+Ec5z4dKRWiyoGLNnUyO4W2RhrbSIL0oKadmzcCakpO9FAqS5xesfTvCfeVWnATW6xKXAqW5raXxwoJm8cYA4PTmhNrwE/EZhThq6Ju8U5PXgMxVa6Q12ObvLwOnqx9Cg+NrrPIDsMNgV0zgsQe4GF0p47IpI50ARXcm+D2hvr5gZLdq/8wUnWodE6AbPuCaPMmatgyJcNouUFZroWRRm0rNnkwpDdSQxrAwMMazYafRID+A/Qvv9iw4HDcJv7eEydeqxkB/hgTV5tmvYBKEr63YGkwG2xjeUNtTbsRpPDZmz6ftwVAafVzUA1WrX/ZUrRtD0JWrzph5gcXNprK6yobAhnrr91AQyowuFT65+U//6c4KOFDVTnLA+1jyS+2iI00cBtBEqlL8jFxLdiV9VluqNAddO7Q/EZthaVJCZkVk44fjGf90COA6mzGUXIIQABafbB9tNo4Vxm9XtS+KBm0DCj7t68O9907/o1rYE9tWESsGNSG4WeFc2d2V4dHeNQwAU/aZ2C0d7g1hBSCOoYkgse04JXwDno+pNvyHRjCrxM6aTIngeqfvCmi0RKXUd4WuriAGZ1hmGWmLxHaxXsJiRvndHu1dXJ4AvBYho+xtnxfeowTu4VMcNf1w7VqeVvXiIMJCYNfLk53oKDHHA3a+nq9qNLME5ovLQjDBO+C9wK9V3TReZq2G/LZTMNyDyBzTy+Tklu5tEs+Whp1Z3VoA+OufXPZaiH8sE4HdlenAqL2s9e5iJs/w2dC7ni7vMACZpQHn3tqswAPMUuwrc4Wcbze4iFXXXjwxbaEet08MjiG6/zn/xNOFPiqqJpdIjAx54xHgkwIFsXGESqtJ5I6vBjZ1vVyC7HJTq0enQc605DZydrfmfGgDoTiY3A6lNchVqI3aNtzAmo4u3G4+pBmRjfaTtHl720Y+2lFy8lrWwD4WBAv0prcmKEsmQgjAhzM+CvljRT/3eHr+QPxUgPu7aB/KTYtTFNzHHtjMfQQj1XjLopGTvz4+puydVRbkXi0eo17TL392IKwRe+mU6BcLZan5PO42Glx+qyZyCpPe70lEBNmqVlH63aI4OX3sc/YR5XvQorDMyI14K94tQKfMMcz/nVUL8N2no0B04WUMz6V25dlOejm5U8cXfTU9GLs6RRTQDU6D/PipviLG9OU0oynmc7cR1fiWvUX8uJxOLBMfZUj8d4mr14rfAu1d+osAiYsa+aBBBRzxvE5uA5xw0UBuoBO676x9C2ax+kLCpUXqUIhhDJM9mWG81UbUPw6GNbz76m6UeFqSRjHdfXYMI/p+Ez85DUFXYUw2JHJv1Re3l09UeJWWBHJReZRPxm7AzV0zbBPTP7DaDr+hXzz7jnopLn5OPSEK82qi+9ShIChchloz7pzdv6HTDRvzFae7aYQ4I+wdzDY18Q15rVLnUiXCAA0hA3CbbmqbGEdrSeyBTYEK/oLLianQdKWsi6cS/uGh1qoXo6Ve9xxRXwWxFKyvjPn1bNUr/08Bieyh4diY+mI+TOlrMGYDxSWHOhSzzTWZU+SfKh26ikQJ+Rt7ks4T5ZLLSq8T1FK8zLrZo+5xsZTRmNmfoyaMYU4ZicsYyeEiV6853+8IS3/b3bgpfFzBZKmVxccIG7tH7zS5tUAQQDmot8xaw9LC8f0lfm+oOWpKvaGRjnCZJ1flRJRxO9+JZUqryJ8u+TKZgHrgSRb17y1RngD+BixRvTyeVEO7R10vHY1V48BSC8+WduZNwR45UXkqriHjZv7Hdv/PmwM3Me5IM7Bj6z/6viyGuOxCy26MXoAJlTtqYlIvl07N35fBFtomaEtGSwk9EFuXpqnmHXgN1wWbU5ZAo56/+QVmvPN4lG6aVL8O/OQlTkAk4QMJIT5v8K5Mmic44/+ZPKdf9gvz4Pa7d3JtJudVwU6pOyfYy9dPsQ3uBBmtIWzQeAdrToFyX049bF9EBw3+N7UEuymvZBMqpT8w2dCLAJgIR1EfeCMeQojdknC6TqNv51GY44S2F67UZc2gBMov0pm9ZkAcIbqSolnQpxLV6C+/cUZuKU0y8qSp0H/5tomZlX/qEbW2NftkrF+DFCQv9dZL/XsEwex2KTi7f6O3YbsvvION2thL7P61kjfRdncs2ZyWwdVWKh9P9JYXNs5Bs8023RZyqZ1Kd5VB1cNbHX6HNdYQkyrSNRLWUfuVKlFXh2zs8AO1ENEowqaYaqa6pyh6CxGD5TedeOwyOtFDhvMfYNeCZh4jZKN9y54KN8I0KWCJg3eVRlBDQOUL4VsE7FDDqMa4ltXL4xeahwIOcjOi5wHFnyYXIs+KAr78tDIN8iiLRF7mfYgLwARdZp9YVRE/lzBOXxnBA0Y7z5qpwK7nZ0vcAJ2y+CYdN880aUx+XKA3vKJr2J55vhY5XkhdC483faAyqZW7vOyPTRLdOXisUecpeijxEio/QiDby27YT/slvWLN+IgrYsisx8DuZvL/dLieEIshtxb8DRyf7Ou+yxJdbSSS/SI7vMgwowoJWk3HiOzI0dnhEtF8O3mLk68RuF2TXOTRWGHkIAeQU4qTMNNg3ArelTQbb7Nf4mhGJ0mO+6VBjzWEAZetcxpi5W+ArVl9f4bpenqPtCP6ndrbh1COChc+7qLY6H4yaSgfHsUb8a0GnSeS7ABqx3L0c4d2BjLRIom0D53AaSbn/u2RX8ENVzPIjryb5U7JsOFvt0/+o+0mYmONWRX9tt+pE/p7ztYycyZH5MzhdH0uKzdqlRCRFLqeaG2TauWcV25eiFlbzOu9aE1FP2juidbJ9+bhNdryM+slVNa4LBo6IJG+NL3Dv6dAtKTDi4eUdQGr1ZLyU+zi7qGaLt44XU+sjq5cDyN0giVzaDUemsYgtS8IrFRbpfwhZR8c/aekc9eCpWfs3PtD6YjeOWlI4ebbR+kygqT6a1sREMxeY2Ik251dednCLduFjVt/e5F5pWzHdcnwV0QpyEiZ9U6rTisnhceOhWUhbPvYwCTB0n6ZOjQfX9uGcjW8j0edk720Mba6/q+20SuGJCIhZ2Tov8zyqSP20QVm8gNbYxNnTFKUL6QB+z3eyTLCosZ6awQmO7UhVvTfISXv/aAtdCx+nRguKELQBXSnX9qib2/Q39IrQm7oNCwte5a2GDY5fgg18SHGXGyv2vIK2abOkFaZwqip3JGu4vxquMvsMpMfIdddUXuXPAW7TfdQl9erKwzBpzdMx8B79odgQl315Uc5+QPGV7D28PIaGQ+VwncEAz2KvOxz6+hWXKBLcC25iDBs78HBvTu/ZUe7pMft3zfLPuQ4xzJiSoXq/e271NGcSHAvYgypttURMrt/YZ4niOcPJjsNpKRzlh6/HbFVrE9W5s0wggyXYu485/6nCzeylD7nP0/MEyxBGO6SGrKSjimayQl6rYJm6ly5JCXTqOwkOnHDIQ/XiD936cCSBObgWaljUXYYGmE736wXAM7GlopyZKT3+aS2nDs4WGlAeJlF4n/W6tl2yTj7QqanjHKXSl/XFRF6/uC6nTYHZPQxQw5Jxutnb4Co5iFlCjrRVtZYMxpCrfi/ogUmQk+9RnAuT6l/pl8SIpQBaE/x8d2H3KqhQa4YSofPAKOxBiwfy2qvl+o2NjHIZQbTZg6bow/TqN8sWJ3RyHTu6ZJ6mhepEk3hoACdUwHppELy2jc1a5U6a6+TkDBZOx1tX0r0q83Sv6rhtAC+sAV60Y1quWaLRuMNZp60DBtKx6AOFy2ebDqbCfpeA9u6Hoh2AOk2tD+dgDkjiZAioPs5M/jyC3GdB/1jzaeK3pMPXh6si+Nq9/LRCe8WwCYmcjyWOwxzxiAi7aBcGv17au6ZzASWo3UbKscThOzogMAxlJuGka9hpFFVk/DA35xtaGTS6v5ve87NMpmHNGXyzQQvkPxLpU0RTkJrpazY5ozb5LPeoYZTotyJZfGJa22w32DPh7VJyan3eLV7SKGaMRw0WJFg9/CZh5bm+2ePs02eqazAB1ymRnvLvHheXPc/7POUHMzkuggKftXN93Im7dJTXzr+1wc2EvLnmF8H3sBakqXGOjCuQmB+UNE+3VuQykkxKFr34PNJpryQrCVGsfj9e0Qd9ticN/ATo+zTMD6KeAOjG0sxVccnGbAZcSPk8dm/pNhka+FLg+V08jcLUAcpfYDs7zCDdbF/gbMBgkCToQmP+FxRNtLQeM9cF1EkLj4ODllSyRHyi8OiEeIUd7YBaOrru06w3cFccnwhCQDsNwTI2lvnj8pvWS2g6hN1FnvvKKUnTJlmWgjrQh0VLsI8TRi4L6Bc27hwE3nS0gI2dQMHVUr01W8oUP6F92Rn2SEH+vGwKqDEj1uw4GredClNtiKVZJwMUtaOrL1oMQNhuijHTQ5CEch1L60ln9wR8blO5yM/6uRl0MmcA3RdInv0Q/VCZI4xQEAJcRktNhzwFVs6U4ELRlEXFKBMgtLFGHRG1uYcZdOULZRYhzwdCsydLMPm3/UfgcFoBGVDUv6isJxnKCnF8qrPkm5WnXhJjytmLhMBslg/n3t8cYKOWh30VsWoFlD8Z67VnvlFjvd1Tb0j0SZYfDECFVLqUYqO9lloRp9lm3C15pt7YwS+HRdtRbKVxeDHpsWoBFc7tr88SPCJgU9gsCdsXVh7CfMTDZfVEQUstt3YPjEbZz2gWmgxSRx/Blq/m94dtduiu/vQY52OTyan5h81yvng0XEz0MaqvvGn1ue4qA6dhMzeqHVzTKX5ABu50SaWmOgdoK13IE6mpf87iJfC+icXUimozmSLP0gVKGufpukWIgVjGFhm6IHzorIGbDQFpwYFtPtX22rBLxdJjgQ6ciTK8u6izNR4hQIB1RcEbfjx/c/69ECTYn5hV5+iQ3iyMQt+K5/qGZR3ONIkxAshsPaEUBx1nogR7s9TL0WHKxpZo8F4eB5Q7BzDiB4btqQ24Yv7ZnBO21xPWyqA1LWEIpsK3gapfwbS+JlOaoSMX+MK4rs0DJ0riuJ1usSkWYefIkWsV/jafU3f5kgLEx51PUHIGo+qJxHZ5qfGL3HsUXbM4vEmg0sMyN5RL536q5F1TbnXp9mmnYzjiUxSqP2ARzTejw8R6WOWn/o0tpa6Z5NMD9dknZp49PsV1OIlOqZHz5Ox0OT9K3yBXYy74n6LL+llNN6H7ovjbALosGODmd84DGMUCUSZPIv0rLqOEiIoThKeBZpUmVcuUBY+woqZ6AifkbxPzSxJemsooW5sZ+p6I0y9j1gXUOyv7uwXtxVWpg7aeLi8a6GOuOuTGApdw485HFM6kr6KfAQFuX1kPtGwEtaexuY2xn0OkThr6ZZsCTHU6KsSoLS/rkGX7lRRY6cgv+dOLqaMmckZARUvIe0sRfYNpPPr1HfJ30/usRDRtmfmNSRnUyDRc0sMj3sOuYXxg8J5ttZ/JZdAQhR79hKSLnXjbQ7SZHD1bB7kIXg48c3RuJPtMOfGaXVCM8fauvd8IXsaV+YPz7YdNk7AGv9agMANBqf9BFqT4dUpwvZ8fPK88hyMYb7QbQDCyU2XO4ug6xwECOAvMc/sfZBdH6VFNrxEUODuxSbeUYlkwg3UKPJl16tsl4isBY62Dl69b6vPQwZNNKMkuwn5b46KFvLaIYO3hOkk3Fxn20XGqzFcPtJ6uEJ1IqLrLk7ULKAkj1YC1gBuPCARxS2Dm4ECmFgpjLaEr1kBltzU4reWZ3K7er9cojbbsgPMP3y+X7k+FbQQgJAsDe/jkKdNUoeOaNqAT9B4+8jRU/8dTdcUOj3s7Ot99ruElo+lTmle5HJoj04uhFkkyUk8Y19h+wAJFiau8TFFHyEGnSvfZCWNknUxe8ct+GubM5BlX1FJWWJ4EP4d6JU7nXqvNE3zPKjfFJrbKEf5CoUmGbOR9ljA/oSyrnEVmtCIt7VI7g0iurDaPS9fXaFyoRENzxLZCFbwpRm+4lm8hiqyor/xaZJ0PMOp+omBXKYXwLtFSyKCsYi0nMBbh92807GHcqBAqZj+v6xyTt4+SOVqhXNGt9r5VyPrByHQzMbQiyrRVn/tPcJ4SgMGeXUJP376s1qn6FSbqtr/LVSNdkwG1WmRBMJ9lv3bLFkfnFJtmOmMooCH+AbPjGVPEovW5yxyJ94VsIoMteWp/BSHQmKqNehKLkS+OGQu1EcF4N4+IPLA4US7kbETTk6uVI5KJCnVQZjzinXKFW3HaZCQ1RtmisixexL0nziC3YOOKhdWqOLpsuXhDe0DzYRQJ0RmMLrZdgcP2yXTG2hU/IOwinSIW2YAYzcsAXszHr5Dqfzkktfw2dDm2qOCbZ7jMJmsLSyUCSv9+9uQaIySYXVaB0Hth4ikyHmYqX65WB+llkK5KLyAFHMyIvQs0ntHJtsYRiU45C6x5BIKpBLdcKAnyFToCT5s8Rmeh6vN2izhbGpVe6fDxVJ7UGgMDo0go0mWQNDebxAjBBwsNkfEFEc3Fc1vYUq8C8S0hqKFAgdDnse7HwkumWmo3ZEakVLFFbHhxZNxlzx75zdQhRMEtFdvtrRqu3XWA7Pd4PQbvqCIVnjZk/bIexP+bzUmkVNFDnQAs27J/uEh17vTLNLpz3sdQAqcDJbOeZmHq+Tnf8895C5gyByawbHH1YQH4YqP//eguLRqK54BwmnFxdk1OnWI4NPh084lNonfPD9WEpp+7uFSuhAowh01keYyUainqVJOkNOWZsyuSrqEg2rfEB6UR+wbjJd5NJSQQFXll2vuMhY2DmXtPeOyCXlP5hGTsDIUAs4cdpzY+nQJHsHZgDTvCNTJSo2XN6/7o9x9ODePLUd1p2IpHdXTEijHDPqM2BpsGduEjiBzpdE52PTorMnavs+yPth2q1vu+t7CUYZpPlSkJoaQJ0DWn6Kn/P934/U6Mcrm60wt2NW0Z6dHJjps3+0em3PnIXEzKcxyBcgtsyeNjQVT8zppRj6riBTp36zh78dQVoYxACW088ir8EfBk4yyyx2D0W1LgbQYwO1ZMiVHoc/VtjWX9uW82Qzo8+Pefn2kGC1qiFfTZDB7aJxCW1EptcCpaM7aHR80YUs7ZtCfsFBHImkwUy0nDGDJ9vgq8MSzqrdXYfZNQGxl1n1ZvUev3TMaZG8dEyUu3d501VtNVm0g2bvF2BVsG2lt8KqFRRsKyZ/A3+skLBThvlMUm4LEOr3UASQOZku+uOwBgtnVINPyui8qdkSH0djlLM9CP/0KQ+kD9ZkdiKuyWfaeMvCGCgbhhdmDZHu7Ev0t+IV2mKKLhbQCp45CJ4VedGP8gLo/Z8GOTzGJkpzqlm/RWPZN/s155kIoJJ7nm76wZxsAkTUjJ+hg6ZgRDoKHHdUKj7dpLN1AA9lc34JMCAoJ/2JL8NCQR3AABPfGG+bU/nvSDPQ/lBGI5bc4WLXvRaDe6b/M9gOvLzyFCd/giuv1V4xn471vJTS8N/cfabIdfaE18RAUGFpzB5GEcgEE7APs20F3xxtvwdzlxSsAAaXG+T8HmBz8wtCWbfP6yR5FMamQd5vtqHdO6VqlguSGcUfJzYP9ZZ0WtzblijcBYP3a0TMLcFxLrnwxorxs6Z41iHBGlZ/d444/PhTlaGa9aMjUd0yKgpCtLV3A2sgq50R7/eN+oXrj1a2VBd+XwipmDIV6uptiis4TUGIRbBJpAj5VYFftZPg2Yr+WCSd8EEgG6dCCsHHKsf9je9JYTELTWWEQQU+r69tAM4um8n9W7Mdy9eeGoFWBpoJUO4OPlPyaxOgJmAy9Db1OBAAMhJ63ZMCs6HVS3AtlOUpohTRrGDvHzkA62IsHekFUXiOBXv+M7PEKEcJGGeR97ACNyQysr57ic7fKM3gzIA1jVtUiUIkYgVDAN/w7e74wI5+CeprGO6/RsFBaG6El5p+Me7HvHqdJUEDbglo5EZu7bI74wOdJE8BijqK8+fpd8PllSLIVcTwSrAj5uyVaEbXmr4Jo5InFXgqoL7nas+/0JXMzMRb6zjb8eLcIQ3VTxQmVrCw8+tQ2w7h8JeKvj5uFwFhm8mX5Y8f2wzbsoMrs4vIc0UQygkzfmj4giNuMhSp4y7sa2+y9GkIs29QAfBlIKbNdkYhVBc2Za9T2J3ZsqthpBspbJcbSrCiPpI86qXnufGLyrmhIaFGtI0URLNlyjBd1/WITW1poUNbaP10eupcitSF2z8NbG417yE1nznQsIdYFrYdoo9/sSNh3YUlhKOztv4UzmrNq2OQoRqomAin0EgG9lYnykjZ6ZYCKRi+oIrQvwMsjQeAMQq2zNfklWixX56/PfadqwpB19j3/Q2PGbhUaBloCagn6ye1hAAy7XW0FzmrsSM+2csIH2cTotETsjv0s1OsConlvDoSDvN0g/yEUEz2fhLSIJxiDiqlMUt96dxORDaaaTiQlKcChGaFERCI53zHxn+zK9irl1bEtl0ZUzg9QbUhSLVRYOs0y3cGIaVrNb6RCuFmCflEfFoUj17jdJio3YacnTBjhDqI3W+Y7rcZmRvt2IN6nxTI/8xIGC/4jA4Wp6gVeQjV11s4y3wyroy39HnlgflbKTufEBPDy8hd1OMb3ZziXdCiVruIUGtwCDQzRz8TNmk9v/jB4SoRGB9d9raKF7p1CkrpBA0i7y9ccusKStbxvo2bQ9BzkasZQAC1yzjrb5JHHoX5c0bNRSGR3AyInmIhDEyAbICbabC3s6jPHj/y+EOx/3Ms6kcWqF3mtqTxxtePTybz4IG8TqEvLxP5roYi4Clwztog06gos41oDRjSurZWby+puS/uBBZjtKTR/ffEqhZadE+7FVKcDlQ0dAelmyKa7kXX8wzxs2+EYSE7rvMEvnxfZK0PQVXoOg3OEmMfJL8tEPzmYS5dBNnhKHGjV+OJ6WI9yNVp3zduwY4M/Ftog/TPRZ9THVHYAtZwhA1NTY5CNLDxNWUADJDsZrdvs0lx3qIJPOS73J/icHEnnrDb9Ol/oCCM56uKMXoadps3T/vXDfw96nSWt2jtFdYu66cUzfCbVOPFz70lx7l2SfPFuwypRx43RfLaffI/uzvNs4qbKAlit7wbpvhg6GKgCQ7p9kvB20Q25L7mnZHGB8WveHAdXzKJ9SyOkALLzXEEmxbL4EzVAJrI4gy8QR9MLZXgJvyC855dOF1WjIZ7zDhINv+wpzOkq0s6dWZDv12fOdwz4dXKZc1mZvDGQ/UwKM14jUrTvZMP2UzgAAAA==")', '--eq-fader-skin': 'url("data:image/webp;base64,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")'}
/* Interação visual dos knobs; utiliza onBandChange() do código original. */
let activeKnobCleanup = null
function setKnobValue(index, value) {
  const band = bands.value[index]
  if (!band) return
  band.gain = Math.max(-12, Math.min(12, Math.round(value * 2) / 2))
  onBandChange()
}
function startKnobDrag(event, index) {
  if (event.button !== 0 && event.pointerType !== 'touch') return
  activeKnobCleanup?.()
  const element = event.currentTarget
  const startY = event.clientY
  const startGain = Number(bands.value[index].gain)
  const pointerId = event.pointerId
  element.focus()
  element.setPointerCapture(pointerId)
  const move = e => {
    if (e.pointerId === pointerId) setKnobValue(index, startGain + (startY - e.clientY) / 8)
  }
  const stop = e => {
    if (e && e.pointerId !== pointerId) return
    element.removeEventListener('pointermove', move)
    element.removeEventListener('pointerup', stop)
    element.removeEventListener('pointercancel', stop)
    element.removeEventListener('lostpointercapture', stop)
    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId)
    activeKnobCleanup = null
  }
  element.addEventListener('pointermove', move)
  element.addEventListener('pointerup', stop)
  element.addEventListener('pointercancel', stop)
  element.addEventListener('lostpointercapture', stop)
  activeKnobCleanup = stop
}
function onKnobKey(event, index) {
  const value = Number(bands.value[index].gain)
  const values = { ArrowUp: value + .5, ArrowRight: value + .5, ArrowDown: value - .5, ArrowLeft: value - .5, PageUp: value + 2, PageDown: value - 2, Home: -12, End: 12, Enter: 0 }
  if (Object.prototype.hasOwnProperty.call(values, event.key)) {
    event.preventDefault()
    setKnobValue(index, values[event.key])
  }
}
function trapEqFocus(event) {
  const panel = eqPanelRef.value
  if (!panel) return
  const elements = [...panel.querySelectorAll('button, input, a[href], [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length)
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (!first) { event.preventDefault(); panel.focus(); return }
  const focused = document.activeElement
  if (event.shiftKey && (focused === first || focused === panel || !panel.contains(focused))) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && (focused === last || focused === panel || !panel.contains(focused))) { event.preventDefault(); first.focus() }
}

let eqLastFocus = null
let eqPreviousBodyOverflow = ''
watch(eqUIOpen, async open => {
  if (open) {
    eqLastFocus = document.activeElement
    eqPreviousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    eqPanelRef.value?.focus()
  } else {
    activeKnobCleanup?.()
    document.body.style.overflow = eqPreviousBodyOverflow
    eqLastFocus?.focus?.()
  }
})
onBeforeUnmount(() => {
  activeKnobCleanup?.()
  if (eqUIOpen.value) document.body.style.overflow = eqPreviousBodyOverflow
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


/* MESA DE SOM — materiais fotográficos incorporados ao componente. */
.eq-fab {
  position: fixed; right: 18px; bottom: 10rem; z-index: 9998;
  width: 56px; height: 60px; display: grid; place-content: center; gap: 1px;
  border: 1px solid #666b70; border-radius: 8px; background: #17191c;
  box-shadow: inset 0 1px 0 #777a7e, inset 0 -3px 0 #08090a, 0 6px 15px #0008;
  color: #d9dde1; cursor: pointer;
}
.eq-fab .mdi { font-size: 23px; line-height: 1; }
.eq-fab-label { font: 700 10px/1 system-ui, sans-serif; letter-spacing: .1em; }
.eq-fab.on { border-bottom: 3px solid #e45048; }
.eq-fab:focus-visible { outline: 3px solid #8fc3ff; outline-offset: 4px; }
.eq-overlay {
  position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center;
  padding: 12px; background: #050609dc; backdrop-filter: blur(6px);
  overscroll-behavior: contain;
}
.eq-panel {
  width: min(470px, 100%); max-height: calc(100dvh - 24px); box-sizing: border-box;
  color: #e5e5e5; background: #17191c var(--eq-panel-skin) center / 410px;
  border: 2px solid #a3a7a9; border-left: 5px ridge #878b8e; border-right: 5px ridge #878b8e;
  border-radius: 9px; overflow: hidden; outline: none;
  box-shadow: 0 24px 90px #000c, 0 3px 0 #050608, inset 0 0 0 3px #050607;
  font-family: Arial, Helvetica, sans-serif;
}
.eq-panel *, .eq-panel *::before, .eq-panel *::after { box-sizing: border-box; }
.eq-panel button, .eq-panel input { font: inherit; }
.eq-panel button { cursor: pointer; }
.eq-header {
  display: flex; justify-content: space-between; align-items: center; padding: 17px 20px 15px;
  border-bottom: 1px solid #4d5053; background: #0e1012b8;
  box-shadow: 0 2px 0 #090a0b;
}
.eq-model { margin: 0 0 5px; color: #eaeaea; font-size: 10px; font-weight: 800; letter-spacing: .19em; }
.eq-model span { color: #f26a60; margin-left: 12px; letter-spacing: .1em; }
.eq-brand h2 { margin: 0; font-size: 22px; font-weight: 800; line-height: 1.1; letter-spacing: -.025em; }
.eq-close {
  flex: 0 0 42px; width: 42px; height: 42px; display: grid; place-items: center;
  background: #202226; border: 1px solid #575b60; border-radius: 4px; color: #d9dde1;
  box-shadow: inset 0 1px 0 #54575a, inset 0 -3px 0 #111315, 0 2px 5px #0006;
}
.eq-close .mdi { font-size: 22px; }
.eq-scroll { overflow-y: auto; max-height: calc(100dvh - 112px); padding: 17px 20px 13px; scrollbar-width: thin; scrollbar-color: #5b5e63 #101214; overscroll-behavior: contain; }
.eq-signal-section { display: grid; grid-template-columns: 1fr 65px; gap: 13px; align-items: stretch; }
.eq-display {
  position: relative;
  min-width: 0; height: 90px; background: #060a08; border: 1px solid #43494b; border-radius: 3px;
  box-shadow: inset 0 0 14px #000, 0 1px 0 #5f6467; padding: 8px 9px 5px;
}
.eq-display-caption { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 8px; line-height: 1; letter-spacing: .08em; color: #9aa69f; }
.eq-display-caption strong { color: #d5d2c8; font-size: 8px; font-weight: 700; }
.eq-display-caption strong.active { color: #84c798; }
.am-canvas { height: 48px; width: 100%; margin: 5px 0 3px; overflow: hidden; }
.am-canvas :deep(canvas) { display: block; width: 100% !important; height: 100% !important; }
.eq-no-signal { position: absolute; top: 42px; left: 5px; right: 5px; text-align: center; font-size: 7px; letter-spacing: .025em; color: #748579; }
.eq-display-scale { display: flex; justify-content: space-between; gap: 2px; font-size: 7px; color: #85968a; font-family: monospace; }
.eq-power {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid #747779; border-radius: 4px; background: #292b2f; color: #d8dbde;
  box-shadow: inset 0 2px 0 #73777b, inset 0 -5px 0 #121315, 0 3px 7px #0008;
}
.eq-power.on { background: #80282a; border-color: #da786e; color: #fff1e6; box-shadow: inset 0 2px 0 #db7063, inset 0 -5px 0 #461619, 0 3px 7px #0008; }
.eq-power .mdi { font-size: 29px; line-height: 1; }
.eq-power span:last-child { font-size: 8px; font-weight: 800; letter-spacing: .05em; }
.eq-rack-heading { display: flex; justify-content: space-between; gap: 10px; padding: 17px 0 10px; color: #b3b9bf; font-size: 8px; font-weight: 700; letter-spacing: .12em; }
.eq-mixer-body { display: grid; grid-template-columns: minmax(0, 1fr) 96px; gap: 16px; }
.eq-knob-rack { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 8px; row-gap: 12px; padding: 11px 8px 12px; border: 1px solid #45494e; border-radius: 4px; background: #11131663; box-shadow: inset 0 1px 0 #030405, 0 1px 0 #54595e; }
.eq-channel { min-width: 0; display: flex; flex-direction: column; align-items: center; }
.eq-channel-label { min-height: 30px; text-align: center; }
.eq-channel-label strong { display: block; color: #e2e5e8; font-size: 10px; font-weight: 700; line-height: 1.3; }
.eq-channel-label > span { display: block; margin-top: 2px; color: #a0a8b0; font-size: 8px; }
.eq-knob-scale { display: flex; justify-content: space-between; width: 74px; font: 8px/1.2 monospace; color: #b0b5ba; margin: 3px 0 0; }
.eq-knob-control { width: 80px; height: 80px; display: grid; place-items: center; cursor: ns-resize; touch-action: none; user-select: none; -webkit-user-select: none; border-radius: 50%; }
.eq-knob-control img { display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; filter: drop-shadow(0 4px 3px #0009); will-change: transform; }
.eq-knob-control:focus-visible { outline: 2px solid #91c3ff; outline-offset: 1px; }
.eq-gain { display: block; color: #b8bec5; font: 700 11px/1.2 'Courier New', monospace; margin: 1px 0 0; font-variant-numeric: tabular-nums; }
.eq-gain.adjusted { color: #91baf5; }
.eq-gain span, .eq-fader-value span { font-size: 8px; font-weight: 400; color: #aeb6be; }
.eq-fader-strip { min-width: 0; display: flex; flex-direction: column; align-items: center; padding: 13px 7px 12px; border: 1px solid #8c9095; border-radius: 3px; background: #a9adb1; box-shadow: inset 1px 1px 0 #e0e3e5, inset -2px -2px 0 #6c7076, 0 2px 7px #0008; }
.eq-fader-label { text-align: center; color: #23272d; }
.eq-fader-label strong { display: block; font-size: 10px; font-weight: 800; letter-spacing: .05em; }
.eq-fader-label > span { display: block; margin-top: 3px; font-size: 9px; }
.eq-fader-assembly { display: flex; flex: 1; width: 100%; justify-content: center; align-items: stretch; gap: 2px; padding: 19px 0 16px; }
.eq-fader-scale { display: flex; flex-direction: column; justify-content: space-between; width: 23px; flex: 0 0 23px; padding: 16px 0; color: #373c42; font: 9px/1 'Courier New', monospace; font-weight: 700; text-align: right; }
.eq-fader { display: block; appearance: none; -webkit-appearance: none; writing-mode: vertical-lr; direction: rtl; align-self: stretch; width: 45px; min-height: 220px; height: auto; margin: 0; background: transparent; cursor: ns-resize; touch-action: none; }
.eq-fader::-webkit-slider-runnable-track { width: 7px; height: 100%; background: #181b20; border: 1px solid #4b4f55; border-radius: 2px; box-shadow: inset 2px 1px 2px #000, 1px 0 0 #e1e3e5; }
.eq-fader::-moz-range-track { width: 7px; height: 100%; background: #181b20; border: 1px solid #4b4f55; border-radius: 2px; }
.eq-fader::-webkit-slider-thumb { appearance: none; -webkit-appearance: none; width: 58px; height: 42px; margin-left: -26px; border: none; border-radius: 0; background: var(--eq-fader-skin) center / 72px 72px no-repeat; filter: drop-shadow(0 3px 2px #0008); }
.eq-fader::-moz-range-thumb { width: 58px; height: 42px; border: none; border-radius: 0; background: var(--eq-fader-skin) center / 72px 72px no-repeat; }
.eq-fader:focus-visible { outline: 2px solid #164da0; outline-offset: 1px; border-radius: 3px; }
.eq-fader-value { width: 100%; padding: 6px 0; border-radius: 2px; background: #252a30; color: #e9eef3; text-align: center; font: 700 11px/1 'Courier New', monospace; font-variant-numeric: tabular-nums; }
.eq-fader-note { padding-top: 9px; color: #31373e; font-size: 7px; font-weight: 700; letter-spacing: .03em; }
.eq-presets { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.eq-presets button { display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 40px; border: 1px solid #62676d; border-radius: 3px; background: #2d3035; color: #e4e7eb; box-shadow: inset 0 1px 0 #686e76, inset 0 -3px 0 #16191e, 0 2px 4px #0005; font-size: 10px; font-weight: 700; }
.eq-presets .mdi { font-size: 15px; }
.eq-presets button:active, .eq-close:active, .eq-power:active { transform: translateY(1px); }
.eq-panel button:focus-visible { outline: 2px solid #91c3ff; outline-offset: 3px; }
.eq-help { margin: 10px 0 12px; color: #afb6be; font-size: 10px; line-height: 1.5; text-align: center; }
.eq-player { position: relative; }
.eq-player:empty { display: none; }
.eq-footer { display: flex; justify-content: space-between; gap: 10px; border-top: 1px solid #444a50; padding-top: 11px; color: #a1a8b1; font-size: 7px; font-weight: 700; letter-spacing: .04em; line-height: 1.5; }
.eq-footer span:last-child { color: #d28b82; text-align: right; }
.eq-fade-enter-active, .eq-fade-leave-active { transition: opacity .16s ease; }
.eq-fade-enter-from, .eq-fade-leave-to { opacity: 0; }
@media (max-width: 390px) {
  .eq-overlay { padding: 8px; }
  .eq-panel { max-height: calc(100dvh - 16px); }
  .eq-header { padding: 15px 14px 13px; }
  .eq-scroll { max-height: calc(100dvh - 100px); padding: 14px 12px 12px; }
  .eq-mixer-body { grid-template-columns: minmax(0, 1fr) 77px; gap: 10px; }
  .eq-knob-rack { column-gap: 3px; padding-left: 4px; padding-right: 4px; }
  .eq-knob-control { width: 70px; height: 70px; }
  .eq-knob-scale { width: 66px; }
  .eq-channel-label strong { font-size: 9px; }
  .eq-fader-strip { padding-left: 4px; padding-right: 4px; }
  .eq-fader-assembly { gap: 0; }
  .eq-fader-scale { width: 19px; flex-basis: 19px; font-size: 8px; }
  .eq-fader { width: 39px; }
  .eq-fader::-webkit-slider-thumb { width: 48px; height: 38px; margin-left: -21px; background-size: 60px 60px; }
  .eq-fader::-moz-range-thumb { width: 48px; height: 38px; background-size: 60px 60px; }
  .eq-presets { gap: 6px; }
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
</style>
