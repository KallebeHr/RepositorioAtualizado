<!--
MESA DE SOM — visual moderno e compacto no celular.
Como usar: substitua o conteúdo do componente original por este arquivo,
mantendo o nome e a pasta atuais para preservar o import de MusicPlayer.vue.
Imagens dos controles incorporadas: não é preciso copiar arquivos de imagem.
Knobs: arraste para cima/baixo; setas alteram 0,5 dB; duplo clique zera.
O fader controla a mesma banda de grave (60 Hz); fica horizontal no celular.
Processamento de áudio e funções do catálogo permanecem iguais ao original.
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
                <p class="eq-description">Seu som, do seu jeito.</p>
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
                  <span v-if="!player.sound" class="eq-no-signal">Selecione uma música para visualizar o áudio</span>
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

              <div class="eq-rack-heading"><span>6 BANDAS <span class="eq-profile-name">{{ eqPresetName }}</span></span><span>−12 / +12 dB</span></div>
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
                <button type="button" :class="{ active: eqPresetName === 'Neutro' }" :aria-pressed="eqPresetName === 'Neutro'" @click="resetEq"><span class="mdi mdi-refresh" aria-hidden="true"></span> Zerar</button>
                <button type="button" :class="{ active: eqPresetName === 'Grave +' }" :aria-pressed="eqPresetName === 'Grave +'" @click="applyPreset('bass')">Grave +</button>
                <button type="button" :class="{ active: eqPresetName === 'Voz' }" :aria-pressed="eqPresetName === 'Voz'" @click="applyPreset('vocal')">Voz</button>
                <button type="button" :class="{ active: eqPresetName === 'Brilho' }" :aria-pressed="eqPresetName === 'Brilho'" @click="applyPreset('bright')">Brilho</button>
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
const eqKnobImage = 'data:image/webp;base64,UklGRkoxAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSMUPAAABHAVt2zAxf9g7GCJiAvqyQGX9NJr0tUVtm2lJ0vf/sTOr3VVtzrRtjG3btm3btm3bts02qtruqc7MHRH/H99Fnsw6JzbyciJiAhhJkhLm/3/enYsJIqDniJgA/P/OIgAkqIgGFUBk7aRBRQMQGsXKQQANqkHXNhKCqmJisw7Anjc9eT4ce4eTBNh1F0wMqkHXIhJUAyYeeusj5w5+699O+fAjPn6J29/+kOm/ffu3L7rwE7c66kZ33AfLVUVkTSEBy9ff9E5H3eAz13Dpb5dxckqkJePkSF7xmqNPuNl+WB5kjaBBG2CXmxy3/3PPIRciPTl9KaUYY7ackpmlNuYck1silxKv/uzBYdd1QBOCjDwRUQBonnch8zWk5eIxW07ZzMy33NxycjPyir9feMprdwSAMOY0AMAJb/7S+35NJmfK7mbubhN92mZuicv/eK+H3WdPaNPoSFOg2Wbn1yWSbLOZ+apnMdFSTi1JXvJQAAgyuiSI4lpv/8dp59Pa2CYz76CllFryS69+xhFAE2RUKQDc6HySTGbe6ZxJLr4pAFAZSyEE7PSiH/18M9uczbtuFtsl59eee785QHUMiQC48Zkk3bwPbXmOJH990taAjh4JwO1e97kFtjGZ96S5uaeYuHDKl26AptExowLs9HmSnsw7aDallZOT6cEAdLwEYI/r/IntUszWDZ+15dbzex53FCCjRMIcTvzOJYnRzMzdrL4qs5Ht2xttwvhQAHfbzJKTmZm7m/ezxTbxtQB0ZEjANrd/2UJZStnMvN8tp/yjt90QImNCgNv+lfRkZj6AZiTfIk0jY0HmZJu3J8ZoZubDmGPi0wDoOAiAfokpmbuZD2ZO+WtP2QAdA4Jr3/drXMpmPqhmRp5+U8zJ0GmDJ19EJjOvE8Zwt7TEK64NhEETBR5PX4pmPnPgD2pwzN1b/upG20IHTICDHrc5RXOfHeBfgBI1M3nagxAGS2X9xxbo5jMGbBxdgBk8Z/KpmNdhahB+wtRmN5tFWU3KOoB7TPnmQBggEax7ExdzNp9lmeztABN48stfcTB0cAR4xD8YzXzapczEXmzP4EZe/QiEgdFm6y+QyXzqZUZ8Gjyktc77Y25QAvBmLibzyWV67lPyYuMBS/Hl0S7cA0GGQ7H9Uy1m8xmuYiDNE/98OwxnwM1OZTaf6VSgTSllZu6eyffNBxmGgIOuYms+4+L9WUrxKtMS34wgQyDY/ntsfYTmFB+EIdBmjz8w+yjNiW+da6TvBPgAl7zKMg1oQKnIc8sHoOk5wYbXx2h19GUtT3njXaG9JrrhD8zmUy1lpVJmA8WqG/k2aJ8FvJ8LNiVfVSmrYsezeVrkIxD6q8F1U8rTKxPK5FXgihrEop++lWhfKfb8V0k2NZ9WzUncEl8PSD8pbnQ2k5n5bCf5xFLNsInf3QnaRyp7bmJrZj7bMitqAS285TebXmrwQS56haUU78023vI+Mtc/AXtemdPUSum9Ulcq3wKkbxTH/MFithmUVXi/sKyUytz849tD+kXloPMYzaZVlq/kozDx241KrwR8iAtm5m4zG4m2yCch9ImgOdXThCkv2BzAhi+4Qir/CUH6Q1Q/XKKZeVXEwgeYxM3SddH0R8AbmMzMZ+PtvE0gMGy2TbeE9kXQWzGamc/CXRnMEq8+GtoTDT7E1iuH67kt8QfaE4rHL6Q8MDCAe/aTNfSBynG5JKvObfjB9It8Dub6oMG7uGTeUzZO4bOf+QXXg3ZPsOM5nqvhs9bsxs03QOia6LpvMHm1gVds+QPRrgU8m0tWDf7AkAL3MV/YDzoNqUiwYaMnn3KZgm0w3ubLFRgn8yYI06g5yNE0m1opU9rnr+I4nspX5lS6hZcxeWW0+mcMT/xs0C4pbhfNplWm5rewJT4SoTsi2/6X2etyRn08alv+EEQ6E3DDkn3605pwmMRT5jvUyIPZzqBG6DFs9kuuDe1MwBcYu8QTWOJf9xLpSMAjPfl0S+kTmM295ccQuiHY5VLmafk0YYe1CDBatsv3g3aiwcOZvDcgb35LvB1CN/RNZXplCuDthQhwr5t1JODznJqXsmW54JvZCp74wW4o7raYfXpeaRqXMLMJnvhYhPoE253BNL0OLv7FV7TV5HLa1iLVBdysJOsQWzaQwg5gwwjuZj7ZSjwc2oEHM/aLk7YB7IEWD5T6Gjy5W30/5s1+C4TqJPx0mDwU/7ajSGUB92DMPtlsSIZu+SSE6j7M1lZh9fEYqfxYpDKRnzOt5IfTD/8YIHUBv2byNeBP5A8hqFpk21OZ1wK/2a64HrSqgOcz+RrSIr9Xl2DrU6qCy6mAZ79iL2hFimtf4bYGkPRlZnZCZYdsruowMTAwjXxEk7K3R1Ul2OlS9gW2CfgHGORkiFftUVXA7WL2DpKSCP6ADZjNkj8UoR6R+X8wdYISnymuqYBquSWesT2kGsWx5rMlic8vStBAUi0H3HI6GaGagNswzwJKcMgJRUNFQ4k3r+p63tm/gpeImrXHQKtRHLBUrApg6zQRg1u4jy8eUlHAQ0ryGvmhR0vJjSNfj1CNhN+zjl8KfTODJNVK3LQjpBLBHpfSViEdcwJwhikc1rmc26OhlSj2vmwLpA60kzIcsjcKZls4rBrB3F+ZV2HJ9QEOFE2qrljiP9ZBKoHge0yrOQok2f1GlKXYVqhVcegVbp3zCzjmiQ9CqKTBcxi9VpyN3zAW+ZlqAj5Q2mpeOvInkGrezzWDZKv5CkIlDR7DuAZp+Tw0lSiOyrZWcCTyngiVBDyhpDVDNPLT0EoU32VcgyResB5SB/BzpjWBpFAuV+wDrUPxVcZ+UQUm0hpJPH0dpI6A5w7QzItWssgPIqCWmzP3jKYjy4ut1PLxaCpp8FLGLkl791585civQypRfL1bTtC1LMlWyty4PaQOwXeZpiDVSZQeYdP6WgLexziF1lfzKhN/JYJa7lDyrFTsESOfgaYSwXYbmWf05Jk3QqhEceySr0EjX4SmkoAHMM5MerHPIlRzr9npyconqlEc3rrNzPdkDj4NTSVQfJZpRl2hA2Pkcvp6SC0NHtxTd0/8KhT1vJBxzZF5ynaQWgLev0VSAB7NePm+9TR4YxkFzJK5cX09Afdi2oJLDxP5YShqFdnur0yzUgZMs0sz8/8dUREavJTtjCTdBQO9Mi/aDVJPkE91YnBwP7N8ArQexbdKHBONFfHNB9XU4K1sZ/TICljkP+dF6gm4fpttDRC15I9GQMUBH2ccV5zK/BMENTfy+t6DLiSRIsXO3hFSU8CH2fYexeADICU3Zrxyz7oavLb33MU4nb14KqfM1xVwc2abxFTVwcfhhEW+AQFVq36LaQWeiRTZsuxn7ilaGQ5fLFaKvyM08YTIdyOgtuOym4+JgmnLLfKbopUF3JLmY5QYAbAPmEX/CmpT7LfgNkrYACq4tXwKmsqg+DLjQHFmk3XC8uLTz/zLBpH6DrrAc3+oVDpklTI7K1cdDEX1AR9j7I8RC8zQeMVe0gGVL48M27DjKrksHoQOBLyR7djwFtg1WPJ/zUPqU1y35NGxnVCm1PL5COig4sPMAyC1su2llLLSlKN/axuRLohs8x/mQYIyn6UUn63Z5oOg6Ojvekc1wLOaLRwlHRH5ZUk986/IWWbIdvFukG40eBpb66erWuRboeimyHZ/ZuyOHsESf7uDSEegOOR8zzVJMbVjhuxXXhuKzip+ytQZS82AGXjp7iLdCfqZEmsaFjyhRT9la3QJd2KqTXMMaS2fj4AOq36XqbJblzKtxG9spdIp2e3vJY+hqefy4zkIOt3gDaUdISzAuVg+jgYdkydxjKyUaPkK6Zpg102exol9pExIPH8PkY4h4AE0GzjSTpYJucRbQ9H5gHtf4zbKzC65ORQ9KPgr87C1TfwFAvpQ9TsljrKWn9R+CLgflyrTG1gu10c/QPEJ5rre0ApfCkU/ijYvz2Yjy/yq+yCgLxXrLmYeGmiWy98h0hvQ5tdsh4deLT+pDfoz4M601F+Q0r3lWdcS7REoHrlYbEQlbjwBil5VHHdBsR6DWZJ/a3coejbgJyV1S0c4VEqpy6zlEzGPvm30GVy0Tp3FR8vyCaXMzMzdLKV0rGrviGzzB6beOrya2ZuZm2XnMxDQv4J9v+95kLyU4qssszLLftVLoOhjAZ5b0iBt4Wzc3bJvOgCKfm5wFJMN3sytLT9Gg77W+Z9yceykxHtq6C/s/0/mcZPJZ0HR34Jd35VtSqWMgmyn3BiKPlfg9BKnUkopnaFQKTNr+TTMo98beRzbOA33Dg1qS/zHhkZ6DopXkXkqI9AK/3IwFL0vuM3PPY+RnC953NYQDGCDYzyZ2cgwW+RroYpBnMMHuZDMRoXlRV6xXxMwjKLrf0tms1FBXnorKIZSsOE155Q8JswvfuvBUAynAHueb2mwypZZ5M0BxZDKPJ7ANtpIiC0/gznFsErAG0kO1JaTX91BBYMruM07rs5WmyaypY/eBxAMsALP4VJlks5JqmVL/DIAwSA3c9v+ljlZz1iubLnwkkObOQy1YPdvkdmq8qyWufD9Y6AYbgFOfE1ps1XzrTkin70/oBhyEeBLXGytrn8lQBkzzzHyO4AqBr4Ju/yAZO5EZkxHzCyT/O4uGjD8ArnXuzYyTU8ZykuUbAXbkmhnPf2WgGAMCoCDL2RrNhwW28x7ABCMQwnzuPlVpOfplJTyko1keg7mg2A8Bhz28XNbRjOzDkhSJUt++QdefzwE41KBHU4+k4sp912OS4V3AaAYm6rA8eeTzGbWY5nklQ/GXKMYodJgv3f+eRNzNrPavEqzGBf5nzc/6yAoxqoCuv6VtKUYrSYzr9Iskjz3AAAB41UDgGcukcxWUZ2WYuaffv6R/TAXFONWAo593Sd/QItm/WGJJD8wD0AxghUAnkhms9wHli0nnvWfH98XEFWMYm1CwF3+kjIZzS1blyxy+Zt33AYQwZhW6LHH3/AHZDLGbN1IMcaWl5x22d8eDEACRnYAgHWvuZTpcnqbUsw2PTObYLaCmVluufy719pm9wARwfgW1QDscYuT9npR5MSczd2mYJPMzDybuyUyRfLb7//OFx4VACBgtEvA8pM/8Y8/fv6Ma8iYjJbMcsrubtnc3XI2c4sx55zIHMnzzycvegEmqohgzEtQCUAA1u/3oNNJbiItkYxt29LaFFv6UtsayUyetYm8+l277XK7O+0GBA1BsCbUAAQAO97/abfd6c4/XPRNH/kVSV6wSJIb/0cyfforF6YLX7Nhl5vf90BMDFhTikA0YPIR19sNzb0+/NHH7X7Sa3/76+ftdNSzP/LWGwG7HrsrJgaREARrUQlNkCAAArZcFUAQCUGx5lUVSAihEW0gjWgTmgCICv4fdwBWUDggXiEAAFCIAJ0BKgABAAE+MRiJQ6IhoRJbrVQgAwS0t17gAfwAaEAm2FLeIv3EwWb8Ve6D4V+bv5Por5m+yHVN7x/5v+H9NPCv5KahHtHz3vqO8Bt/6EHtz9n/5P+K8iT/D9IftN7AP8+/q//K9eP814ZX37/SftL8AX9C/rP/L/0P5LfJV/x/5/8qfbd9Mf+n/O/6f5B/5t/Wf9//gP8t/7P9b////r97PsV/bH/8+61+t3/M/P8pbpBmPsCiVSzXabywT1NvObebFAyt3hGW/Skbby+bnZGtu15JWpM4gmk5JAqD6W2/fZr+NP+rLKV4GEnJ+omvkGFbun/QlDgagPtF5SwubvtRpxm9y/m77BTeD9gMSv/BC15qlylEHKva3877YMXL/hH2gm35ZET4SppLbUF+Yk842DjFbEPmsrYEvBFLNHSV7/4tD6L1asqATBNfd7fySWwQwJXu4ArggfR9BcUK5g4mlwH3L88NUOn05+oeRVGN1eHt++ogOzC0o3LuhXsyb/wV7VyMwN8unMnw1EaY6DMPKfxRgrY/ZnnM7Mmi9kCtIKjQzSQpeNJBhKBNn4kVGQ8sxM1cRRwsC33pEL0HNlvG5iG5i2+45NSqrJ3564QkX+04eMFsh6hcwFGtXnyk60qt8X64pm6lScCe45dKZdGf86G/Ama5AtafloLMbipKErRT6oZ0GTqavb8OA0TyDnhI2NmG6xJkfqQqN0h97OJrUR6UKtVSXI911PJ5Hr/DUPAJOPS0kldOkrHeAGo1mI1h22UuWqLdBRMHlb4mzw2c+TjyQ/kzbRO2bHkp9u8leG20VQfrO4EQ36OU65lHq8e1CxAw1ShS77j5x7zRLRac66m7HB7Ew0p/irbk9a0j+aHvxvpfV0rksqmtt2DI1Pjc1s6yEiOyxNx9l7gEtPPRiqWdKCfkcIgo+HpC3QxRnieqCZFTbikaM9MrEBWDXCxDrock7noq6oRKvFZp7x1aY63/zFOZ2I+6iJVly++LS5OMhdKi6QPPGZNPERa+sDZJQQb+nkPoh0IyGbpXMLTIOC0egRvtynVxUgTJsjQW0BbUar5WWXVJyVqAOJT51hqWaJiWcJphCPiHOmRiz4hZGp0KHaUNkmZet6K1j7byQ+e18WcrZrTitqqgn3uX5Rfe2KO/+U18HUjw40NdGMzzD2SL+8EbOi8CVrhQff6BoIsOzN1pBY8/mN9o60tGQEc8NAlPQ+W3BU/OZAE4i5IZVag+jHt7uS+ProoGu/HiyzMfUNWZ1a85d27zxuh0vZdjKF3bS//9U+5MKQqzgba1pUwGaHFsTfv6IGuUry14PQjq/+r+YbETaeBBaAB6D0Gw2CVktA5Z3a+roTe7l2tndTtDDLthbGB+Mhhg8jv0RCJpyouOrPzqEb9ckcmHDE+FuCcDgFL81U+DLoj3j5haa2V4+B12LBcpXilFc/RDjMNhDxqfn+AA/okYgJ3kgf0uNmLjCfOxhMUHEvfbWHlr5Z92mp1HFRmD/7Ck3RMSPKGYRvzkgidvkN7RE48rxdPNQ7eJRcQiuactJ5IbtzaJd736GrQFEVMKVH+JgADz2GCRqc1IKQkxFsZr4XUsbKx4oqTh7tPrDFV7dihfOYIR+PWV7bJQhyKJn9CNRGSzd8GnC/3n2ZLCEJOuw9EBlfiJw0Kf+K7R33xNIJabk8zXjGB1TsM543Hf04i5CJ0APQaLUYZ2Ac+Hc9EQeC0rlLAAx8blTHXaMclctCapp4uriGvOz29X7vDHj1VeT50LwkLt0PxKwIzCpWiif1GXbZsF8d0Ax6cMY3u4dcGmkLV/dgCMiSTKIBX0t8ZwXjyNG2Y2gud3imzoRajV2/tDsTDeMEgu4cC6hysGvK1/FJe2JwuMRaZCVkMFsBdF6NCoUOza6Jx5uMCItsh9/AKeB+4/jx7F8/IWOq2Q4PNuhGORSZSADQTMh0S8mJj216umDLH3WvwmDXrqTitAhHjhk8BL+vhEvl3OzRHw28UkyeXGIgGPqF02U65MiIHjN1K/XYl7doKZk1B2GGyZAx1c796zn2zLscpXAaiOyEeWRUDYTAlUilQhkVYLqkzX2igvP73VHe/zPUaFkm7lq1a0A6pZMdwInsjuFxC5UBmDtGdKr+Aq/92ZD6/Eany+HZG5Muaqq2JWrs1o+XLNqHDnOVcjKjcBas0I+Iqol5Iue8WBlMcLvpQAea5D+5Wnq1tPYAZzi1UWAZnGA+tlEfmQ16P6q8oLifYEt1jmwkWXPRDZyWhQFA8kd8QGY7OpKiMpJjTVOHPw5J0Y59QynnpLqAqzHJ6VTYfJXJPcKL6RaCq+udcj0EgU76dLubcSAJom1HW72J677PQzPkrE0hAmDxXK5edFsCky+Cd/vG+Do5a5EEbLHA5yRrsiCNA48siR9CnnEEl4Kq0I858MogTZqPQmb94rjrmBdai2wxIq3VdsgxtbE7ArAwBj/3Wwhzrpm9OOdzbjdqfPL2JMhUmUy00oFoEDvbBMjHKNvjrse+KmeJaF/alOJyoFHYOsuNxNTH5CkspeP28cYjU+XlDfrUOQLw1nrkiE/nHrNhljmI0ooHWuy7NPL84BySsLsGZFykbrBK/ITgcs1tPt2xxtAlPKSCLze6aqfERvh8Dw7fDU5vGqG7Caz2EGsS37+71cKsy7kBvEH25m47PboYJSCYZAJ6rPsIO/Yhj5bgPzF+dnugc25XqSqaD57WlNCJu0a7AbnXBYln0hG0Yf/Uv2FuHS8ZStBZvgnbPpDoFeCu6A75v78sBuu7cmafhp7z8+Ahr/m4IrH3Pde5lxmUQT+yUsX/odyfo/LWdAUmKuygr1n6WkN+bdx9k0xZZEc26l3pfKanyswgfDtn3zNusK2hJ9NJ89Hldyo828fe38GUnbqzwnZ7+iCzo9aww21F+xCf2Q4Ypo4KMxiuTJhUSrsl2yNsHLVWOVz/6zvOriV6GB1SKxtMEgs8ZW5djxNuXvJA01Z+X9NnM7uC0xh2nxx3alFrgmaWBX0onb8QJZgPKGgKjLVwB7bGGWwUxIImB72M//fZn8yvwq3znwRqqptbocLP3FBqUwPBJP/VCbxBXXE3HVCPYfdCJ7DEAFVbka9EN96Ob57MX66ZP0kPXs/AICrDZ0YYTBKHJm5G5Pu+vh/NhCtinKrymudP5+1IBSDg9AgjMxjZMIAdtO/KVeHreWRrFOusAxzYjM4553TEv2lY5NpJD4e11PuAhjHJKmWPa0N0dhLB6rIyvPtCfP8IRFpxkbB2i40pBK1XotDQ/JoX4VlJCqGWD8h11A0j6Oc2K2FtY4xoBJVN/Q0ZtZyfIez2X6XszbY7JB/yI0ADJ3jBw3jKpMJ7W2l4TAuoh2o/uqbv//0ovQBOFTSmnWU6D0F1TDaIT/4FIjTdu2v0TF7+wDHsYZeyPTPxz4MxUl7dNUCk1zkMV0hx7G7cCTedkj+qMh7QNUbaXiUtPj5Vhj5A/VK8ej6jI5Ef70kzPpmvHEtH2egQOGqS2HHVk8a9wvjrs3a3jKOm2CFPzr69odzQ6l1pxw+S1kMKDli7Z2Sb/ovVc0dAhXG+fBgxb/PRKd0HOmzIhSItl1fQ7GnDEJzqSY5/6hYO9jDEMv8W1z179ua/YUgY7TLR/tyanDmhJ2EKw8O/IRT0FIoMLnTwU4F7xitWlcVmASW3QK4SC0Hqo8QYtvq8hDIOz51aBM+0VjCuEnDXjOv3A+wj4Vsl7f+cQieRgu+X0zuZV+g8+AMVcml+Zjr72qvfDE0RGPUNvFBnw9XkaR3EdzuTGphztYQ5uwlMtfvwqi15tM447sxzhoPgd81RRJP3U+pJFwXMbyHEPc0mQH+0K0AONCZKmg2ZwvgAUpTSmEQoTR47qUJQAoQFduaPVT5FlpKEMciMr/iSl0ZKmh72bdolbu3YRpTPQa/7EYNjQv/nL1n4ym2B+OTyByzxELkhABnqizyui+PLivF7q2WSPe0aVjS4Nd+kNRF+pZ64HJiGckAVul7/ZNIwBXAdm4c+MDZTKbgL7WXgNzjDUm75DQNSrg/z14h1rz0QYuPnZdHxpY32L15KeFld625yXhXKS0i/F8CZTMY0iriU66qVM0uaufxReLECKBv0H0vy7kNhELEUVhTVE8iD9Ott/wNd70z9gtxsCJuDfC0WkD/U0BiykzBUOpH76WBmg+xyDc4uMRZV7cdV2Fp6kH3ll2ZXugyfRz8q3vjaOUfgvgXDlDFnfEdCcPdfoQl6U5a0o8hCC4FxN3DT4DAYP8DPK9JdgIiBzJFe24NeRk49HX+WipieXJD2F31IXCr0VDdyuzM9WmqvpfzY7b+1cxC3l58f5dtjq76Bw5eb3k6d4U0pfOP+3VEfH42sZaYKy97yx+ny05wPy1NwW5SrzzUXY/LSt9mFtSKZwynB+LANr6sD39LdXliy7q5VBpX4WgoMPk6pGW89Ip0zDDrtCnUilpufbor9tb+MXfPROBL8Lsp2VAfah59ouazckpJUgL3sY5WT3We1uDxtZP30FjbDTZtafZvkvu3Tv+gMhsPoNeWvrIYSSwVAPU/gsJQuvxfz62XWRssO7Ao2lFrIR5F+E7MNBx2QxTZhTDpXCwEVMRCcn1IpbB3nDJ0P4wy8rYC+AWyf/wTWe5784US8llqKNB46iwhIpqa4QU72CKbGbDPzxn/Q+6uB4rVboODge3k26wnjbUwK8UP/adKQ3Qi/Gamv3t+iVVtZMpCYaDz4hD+38bIs6DeAexrj6E/+3ZKnPVTpIaA8Zn+eUXkvzSP4tETl4sj/xjlmBHih6+vk+MjTeyvDnztbh556MD9ReVlaNsiiCTlWo1cA0dx9O1n2HZgNBTUOPKQUA2JMtX2ZLYXACWvAtnRlpT0q6qwudzuAMsZ9/l9BjOS/f+43qkgFx0tnEB8pS9GgHMmb0K9YTR6m84jzFLKe9GZYo+D6Kop6bCZhDyfSCig9YteDYmj0f4VWypN9DcX6UO1ZjftQlHroEoNRiKMdfm3mwp+ySj06oid0xMBL1X96wlttCxXQ23pd+lJgFJP39697J5XTEO2SrNog2rkYmbY3dck6kZnOZ7x6n0UhXfGarTch/ZRUAtJzPnxiWwv6/K9LgtfR6+nlUpyyLRU9EAnZ6P/HfzlexdvOxJWnFn7//IJZyo4pmcQtTNQA000siQOnn2NTYkuyXR7TB8jXdTDkM3BaL0uIz7taiJ5N9oAb3QKSkCVW8Kb65Pj8i3Wa5jR4WcBjsacTjPqPjI8qPbP/Xu+L73XTGV4JrvqmezckXi/Wt13ChGf5m9c4Sjun7R2OW0OW77giQFv5hftBf/LLdnREx08+WxhW0Xfw4MVefldnXya5BMB5jJ0mEK9ELsYtAWaOJ6O1E+UA7MYXAbzFO57VT9/IEoHAB+JRQS8WaW79kGF9uHHt1ppbfQYr8ctaDLALb4dmyuQBmNgEHrOXPYQT1rgoEaO7rZYu1sqi5HtTeCaLjWc64iRmo3GspyiftxeTj3E3+dubgKF6LZfyi3CaK7Y1ay4zhpggJemIHMssAsGB4z5ItUmeaOB3xCjOvJofnVCoNlJRA9nZIVUupTwK6FJV7Tlp9WBYTkOdEngXGTUdRxN08PHF8d4hM8w5o5A4cACq0bagJQmA5yAleYHbLTN1QrkN4ljnnK9Jimc1Ndt95x1v+MIThfBz1rn2KFzQ8emF/2H9iYais9NvzmPzvziYCJZqppGoDPwGk88N9O6OFkF5ZIDfQfcntUuGkxp0wOk4LPkwSEyCygXzcCpzO1V6EpmJkvDbSxi4DPYjMfjTVKZFmhHlmBGeFevySdXqC3PHVgcggBU6wS2x25F7SzQ8RfqAbqbWy9H8L+kow+281ZawTiABlk7Hw2GZm9kqUaftavMQWpb9rlz9Zqsx58lR2VYdN2n42BRIbgHY58Vk43Jnh4hp7HeyZfOk9URjuxoFOYG2MvPyKLX1foCsH7tXFU25mD2yd/fnyigp6Gp0K1Fg3PL5iai2SK4bXIwHuhJwUqi9A+ZE5v0R1ET053+NAQTOr3hODE2Ykz/FO13uOXjyGubbrJzRcLhI+MGZHYajRYpn77QfG426G1Sqa5UUvSp9+aC/6/8PmzJiJEkPYSXyh6wWsAl/oGeaIgkZ30bboLimRcOtSpCkEwCXrTQRIgg9/lw7pYUVUA5jkmfMxi5jfPLyGQWbFG6X5JhyfRp+1ru+r6rxzzRMAH4ESxl5zArRC+kC6ENH46oBsaPJA/3sVMQeAEuP2Mt+/WPmMhRShekL4nanqwvWOjFLTkkfyF2IEGiB2t7Ym8eVEjOBesaOLwCP0E+StvoJS6g6yxwA16uW/znaCfEFbFgdgEwF2rHIRc0dl1ncQmh4eoUDu1BDsuc4OBdqheVl5AXO8rFSUGGA4UZLV/YNhdmQQG3799krGNGYCUnPQTE22afTiD76P1SUsv5TwAWB59v0pYktBCV0RKpoPZ507xh3I+GPOpRHTArQJcFpCbeMDXXCy0I0IEXJHcrfqsS2XRHMXYjDRPYze8dLDijo4gyUAFaSJHm5mmiUObHrSpH7dQxRlYO16FEg4z8XY8TzsMZQC9LE9v2lEfiuS4omh7SqedAbFx8RdTE43yk8BdqnWB9/7iLwBDvkUctI2/6rCebdSz3T5FCLltMtpYkFfOBYexq1aq14CQX3nv55eDvDR6fnb7pWEUec9xRXB1Llh5CRS3fCdiEKCGZEPP4bS3MOlG6/8Z0/jSHRaU5p/FbY4iiGBfcsPwI9qro9OUW/INjwOhVO14XoI0YeBqvxrfPjhpCoxzPdHrdAknqgaPaYzMawlxSl0pOVlEkWOtC19aUVc/kbYW0idi3QAuuY36uRcv5P6ib0UfvyuNw+8IAaQnVX0SWNw+/3pg5Yt/TuwA8BWpSiS9qDonBEb8B/VmD8LgHUP7ch8qo6jW+NXD7XNCXY4KCDvOUw2E6Ae/UDNddAZU0mn7gZEyYvoiRSNd8Q8fCnW6mc4gK+n1hIzcW88iZ1rPxK6hxbghXPqmiheshAyDuzMgMIfUjuwue5a1cPdkWCR3ogXbdX3t4L9BdAAHoBTI6mqo1F7n8IgMecwHPbDdgWTMzUmSdGRWUUnoeAGkaqLZRUzijol9Jo5W1zqxPRFdl869VjIIZo7EbX7W1+I/Xj7QE1amBjlO/VQgIu1V3A2uROQPOaUz3EvvyeHzK77oeMdBJkAYgj9e/bUf7gIwcmmyAemMdEC9EN4JZzgPpUzd77rsqJGRBIhKzr3zfg525L8z0BRPI5Wgy7/y53hzxma0/PPUwJ504h/HJ12ee8/cr9+80eOGpZSE1+WUrHd4wsXMnUsRjyJfJZdhCilhuAkvQvETzIGJ2bwXQMuf9/dl4gstUuFm0/lBGIgHrG58oUUrW8+/o5rU90UEJH4Vc7BQ/P+hXE+p7xB1gFQUbgFP/ceDJh28yj+JgH7DkQWrgg1bmyZ4KEvzH7lJ5Mqz50K5w/ilau737+0VRi0R1/5kbiBFINl20pw06DlNSwRi4qcV2Gp1wN4P58x7eg+tEfHls41bXhC3VEWQe10J4IsdKPR94xVRSJxG3uBSV3OGYbnipugHXerSScx7PeeW/fOrV3/kuYXvvG8X+hw+lfxWnHuJKjAcmJHCiTCPaRLumxozHDoU1EH/wQA/ILxUUqukQuoMJbd47+VklOcJlCGh3KTDHUF1cq6qFNzVcq72lD6QqOaYs90skHCPIn2ZQAh4ldwM/OiiYIk6sJb4yMbe23fKjFrQn/Zl114UUE02RZ4nE1mfVkS2Yd2KmXZ3aeQYBfkk5gG9IOp3fUagvRGcRTBN04Tr2IcBsW0FfLZGJnm5oyD9Okes1S10yC4bMzfOXhkycYRX6aRlaVH5bb78Tri3FR5K7f94dH550ZOfn1kO7GLT54itIJ7xaoBsncYIYenTaWq5gYRkBi4t6Ibnq9uQiZhahPEsvMA+Mp9pTxy+EbsEuwGGtWrSIT4ku1VUqzPkQ5Z5+usl4bMRo/Alo7MJQ4NJT26jgqVXKsDyf70RggYK4thGVkH0QQQjb+/wV+UlDpg1IUAL/9C4zs1uy3JrHnQaCDIuCj6Tt+FjFwTmAZl2j13lCUhWHJifXFdZzmKd1gz+LRZryK2egz/I9ZaXO1I7TxT8LmJcEetbEEMrS7gJGGVypKP8TK6a3muPK8naU+jgjL6Dx2K0kvk8vSmItUABTjCGaIA5IPuE185DVCXT/RSM9p+fuH0/j+MTSIKj66/2Sqd4BYPjGV98te1uSoFjmpgFMgcZsJb20zR2LPS6T6l68UgC9GzXlR0zY/cNXsn3HlMl3luQeyWzNJjKbCVeSqwrfZbHu+ErHtpxc3iiLKd3dxJW+d8T8/dvuOf8+rdHBnmiT9b2RykbPCi1YkvoPjzpBh32VRYM4x4kvqGxVwvt3rZu9X9c/MZyt5fAo4H/L8b4I1rpurPktftt64uIvbrBJZ/4bHs7x7EDrVdOt8P9tZxThw8GsIZ3qiRKunDhCbPXeMQh+wKWconmdiTiyMQCrDInSFjAsLyIOFL/SmgtNxNffsU0zZM3Jujp7dl2N/Ch4ZnYEOVEzlexaf01TNDOR953ggh21ZnVxOjQhiLQCREmnYnL/SQqYNb/RbGfZvfjlg4Wz9+CRGB2joEWG4Hfkld+snsYTVoaydnvYCw9XSm8EufHJXwdHl6Dhc8D8XJaa1CwEN0PPR8ceinHudEyqDhJRWzubuudIB7TMJ1fC655hOu/hT1pcWVmY/S4aKB6Fual0NMxew2CQO5nYxE5kq5VoXpWztsrHtxp/2457X45FpDFUVDPYiYH27DkuRkuaApuyZm2lgqEcFlhhZel6LgcUPzbfwcTdL61vPsWH55P0A2wE1qf22+s8XkN53EpCQD2/2J89um5cfL7TeWALVBSEZp+xPNHsz3QLa/GIMwfpqNaHeYZriwYsF+U59FHBdImKrrTi3BlMzeRyyG9wk6fBYwemr0Qlgia1ix5dviB3K3Y05HoLkZohE7xPSJxLNZwqYkFbYufAktpzPHjfnKcA2LFbvej0nNtPio9QUsmVF5z71ABMEpugwoPpqD7NcEUmjS1NheK1HgjlYBc9239HFaM0JFFtIdh7lKccAtnnkg6oqu2WnYWUJK++WrrXHa038RpJr0HJAnsZpmObVTN472axzzacFOAmbHOZFydd8LQrlFF/xw1pVL0UmJMgR4BCbMQQhk4Hg+nQfoflT1al6yCZDSb/ka2zS2Yoj/pVxxkywYnWL71/oBYR0yZqFfAa+AhNWIuIw2EcpUIW5V+/ZVKOQiM/MqTZmjeMrw+lqsMrgX52EVTPC9R7ImEsqlQZJ8PxaaKByX/CbiQ+qXIbFh3n31V5Fu/GVc2kRY9xb8h4vI+2/lRVb+l7fYyc7csgVxW5oHuzd32EWOo6TBPDojsnB5gR/9dle/VBzE3kIK79quQxgmPI0E65LBkigRBy0v5RFdVKAYt4edoRxFQf41/vZUSVSx6NXSut0OffJalD5afSzD8yN5AnH+51e8h0GVmltgLE8rjSyzJImdBX4K6SFgXuxo9bpwDbyhw9wpd1YzFAzgyF72M9Ai25QD6yoDD2r7LK27Pg0dmowXFPeRtTQ7xI0FQW0az6/J3+kS+I71aLthJ3nVqRfNHkLF63wWRX4GaykqbRQOOn/SDCRW93raBhlXStwxK9RCHw9rXEj/Xf1whLe+MfU/S2y9qpBx9C0vAia8Y+ZWqO1Nv8Ex3jRsQ6NspBANAhm79jnNkCxjSotG2y68ZpLuexImzGYduI4/MFoOh1fh+D43w1VBVxoXOddGfz2Mehg2UzZEE99KR0g8syyKoieOQiUA2+ntB8lBUwTpiqz3W2PHikq6tS44xeuzGhG66kMb5QpH2fYn1YEG2yHZ2ONVxVbUGRaCEX0ZLkwGn9WFG2GOxnVXZYvkO2qMEEBH3aVnZ3TvheKNdl74+32fjwZa8E34Fl/8rfAARojaqMduPL73ZoV83URXBLiu2r1bmyYrpe8Q76EU+wX8PMokJ8EHDNgWqwOpePbWuYMz8XsuRGMoH/al4bSH2NeEZ3IZEH27j/Pcl5uIjbPO7tR/kXO6rxUNgpBJOopycSfiWuEEpys1JZNr9FNd5DwKp9JZI7Tsq1nrZoL6lRYCvHL0LuOJfsi2z7345fbbcdCisCMyyBz3sHCSTWgx/kuZnxw6o/m3etF4mHLxEY4IjDUvOjdB8IAS5NbuwNJDK3Bo/94zHtevI3e1U8ePiULNEl05/tMmDNW4XsiS0SyCWQJVXU2w+jFA2w9MkUSo/zhAkJnaS9rrgqMyBftbf/9f/9pRlZlWC3+5frjzIibaQgaQtPwyLLjTSmTeD/e4KEBv9G5TSdXp9u7xqALYEBJxuzHywpq2i0lrXc+rd0fvtZ5tEsbF/1FuAGDyIs+GBPNbKZLy4WpfcjXDV/Dh/mtlEz5JKKlKo2jhMYf3xevc59DPW7nBmPjAcG+haL3K2rjed7ticpwFmhp6mFQ89dCn/GSNIHDwdbFGmwlNyB9jIBmOZnHZKmS7LI3jlM+4x/xgsaCRVjMhIZz9AlJmEgr0esARmnQTJ3EunDWrVIiXGRc4hOUt4BsbXlkevl4R6+rl0Z80yKqfkGoppWvC5YK4rdr5QShsJvvMKftFmeHVXVxkH0ckaU2vR2IxIiVNdQgRPZREyqXGbQ523AvtJooZ+Jcap3kcP/7++71kLDaMYcOQGWdpYmOArzBsrnAC1rKEaH5Kk5w0LVoY6IOsst5g51ZFqbNR15xQgGQEsImbrW1pp7TEUxZJD5umqUmOfQSMKigAwV0Fqz1i8XEAZPnFrLaRGPaUNmu9zZjpDtkfE/k7OBeBq3DFtX/HRlF1ej4I2Z2GWdqPzYWXJax6ji3HaJXEuLlpLSVz+vR6fjePvCI3pYzfjV2FASiu6jSSG50phJJQkdukTwXqjn5feVVVABmlU4tpWFj8f9yvDVyDgLIadbP24kcpnkRaON0QhCrjOkCyO90hlmMH/jXq/IcAJzd/Pz7XNoBWnMyy1elymL6sjoVQ5IVQddOyziZB3qqzhFuBt4qwlRYGJSMvUFsr1wfSgV/REhA5qZWI2b00zaAoTMsfbZneaSyn0rL8XE96Az4Ezh+8adMvGvj7Lzu0fajvY2q5efc0wofla0fUTUroOSSyrDV9fwVnFqAZk4ijIchS0plXGppNRvCb0G/Xy7tD9Q7J68H6w0Sw/9F5ou+rBccAqGeD9AkvZIdefCcnT42JTNhLSAn1RLxdEkhSMvoY4CrnCppOJ17dskMGtpR/6h/UwZyTFhELZcFOGLDUd2RwAAAAAAAAAAAA='
const eqSkin = {'--eq-fader-skin': 'url("data:image/webp;base64,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")'}
/* Interação visual dos knobs; utiliza onBandChange() do código original. */
const eqPresetName = computed(() => {
  const presets = { 'Neutro': [0, 0, 0, 0, 0, 0], 'Grave +': [6, 4, 1, -1, -1, 0], 'Voz': [-2, -1, 2, 4, 3, 1], 'Brilho': [0, -1, -1, 1, 3, 5] }
  return Object.entries(presets).find(([, values]) => values.every((value, index) => Number(bands.value[index]?.gain) === value))?.[0] || 'Personalizado'
})
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
  .eq-mixer-body { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .eq-knob-rack { grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 0; row-gap: 14px; padding: 12px 3px; border-radius: 13px; }
  .eq-channel { padding: 0 2px; }
  .eq-channel:nth-child(3) { border-right: 0; }
  .eq-channel-label { min-height: 29px; }
  .eq-channel-label strong { font-size: 10px; }
  .eq-channel-label > span { font-size: 10px; margin-top: 2px; }
  .eq-knob-scale { width: 68px; margin-top: 3px; font-size: 7px; }
  .eq-knob-control { width: 72px; height: 72px; }
  .eq-gain { margin-top: 1px; font-size: 12px; }
  .eq-gain span { font-size: 8px; }
  .eq-fader-strip { display: grid; grid-template-columns: 56px minmax(0, 1fr) 53px; align-items: center; gap: 11px; padding: 9px 11px; border-radius: 11px; }
  .eq-fader-label { text-align: left; }
  .eq-fader-label strong { font-size: 9px; }
  .eq-fader-label > span { font-size: 9px; }
  .eq-fader-assembly { min-width: 0; display: block; padding: 0; }
  .eq-fader-scale, .eq-fader-note { display: none; }
  .eq-fader { writing-mode: horizontal-tb; direction: ltr; width: 100%; height: 30px; min-height: 30px; cursor: ew-resize; }
  .eq-fader::-webkit-slider-runnable-track { width: 100%; height: 5px; }
  .eq-fader::-moz-range-track { width: 100%; height: 5px; }
  .eq-fader::-webkit-slider-thumb { width: 42px; height: 32px; margin-left: 0; margin-top: -14px; background-size: 54px 54px; }
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
  .eq-fader-strip { gap: 8px; padding-left: 9px; padding-right: 9px; }
}
@media (max-height: 660px) and (max-width: 600px) {
  .eq-header { padding-top: 10px; padding-bottom: 10px; }
  .eq-scroll { padding-top: 10px; padding-bottom: 9px; }
  .eq-display { height: 64px; padding-top: 8px; }
  .am-canvas { height: 24px; margin-top: 5px; margin-bottom: 5px; }
  .eq-no-signal { top: 34px; }
  .eq-rack-heading { padding-top: 11px; padding-bottom: 7px; }
  .eq-knob-control { width: 62px; height: 62px; }
  .eq-knob-scale { width: 58px; }
  .eq-knob-rack { row-gap: 10px; padding-top: 9px; padding-bottom: 9px; }
  .eq-channel-label { min-height: 26px; }
  .eq-footer { display: none; }
  .eq-presets { margin-top: 10px; }
}
@media (max-height: 540px) and (min-width: 601px) {
  .eq-overlay { padding: 8px; }
  .eq-panel { width: min(960px, 100%); max-height: calc(100dvh - 16px); border-radius: 17px; }
  .eq-header { padding: 10px 18px; }
  .eq-model { margin-bottom: 3px; font-size: 8px; }
  .eq-brand h2 { font-size: 20px; }
  .eq-description, .eq-help, .eq-footer { display: none; }
  .eq-close { width: 36px; height: 36px; flex-basis: 36px; }
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
</style>
