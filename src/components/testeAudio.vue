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
              <!-- HEADER FIXO (sempre visível) -->
              <header class="eq-header">
                <div class="eq-title-row">
                  <div class="eq-badge" :class="{ on: eqEnabled }">
                    <span class="dot"></span>
                    <span>{{ eqEnabled ? "EQUALIZADOR ATIVO" : "EQUALIZADOR DESATIVADO" }}</span>
                  </div>

                  <button class="eq-close" @click="eqUIOpen = false" aria-label="Fechar">
                    <span class="mdi mdi-close"></span>
                  </button>
                </div>

                <p class="eq-sub">
                  Um equalizador futurista, em tempo real. Ajuste as bandas e veja o espectro circular reagindo ao som.
                </p>
              </header>

              <!-- ÁREA SCROLL (quando o conteúdo for grande) -->
              <div class="eq-scroll">
                <!-- HERO: VISUAL + CONTROLES PRINCIPAIS -->
                <section class="eq-hero">
                  <!-- VISUALIZER CIRCULAR -->
                  <div class="am-card">
                    <div class="am-ring">
                      <div class="am-canvas" ref="amEl"></div>

                      <!-- Centro (informações) -->
                      <div class="am-center">
                        <div class="am-center-dot" :class="{ on: eqEnabled }"></div>
                        <p class="am-center-title">SPECTRUM</p>
                        <p class="am-center-sub">{{ eqEnabled ? "PROCESSANDO" : "BYPASS" }}</p>
                      </div>
                    </div>

                    <div class="am-hint">
                      <span class="mdi mdi-gesture-tap"></span>
                      <p>
                        Se o círculo não reagir, dê play e toque em qualquer botão/slider (alguns browsers exigem interação).
                      </p>
                    </div>
                  </div>

                  <!-- CONTROLES DIDÁTICOS -->
                  <div class="eq-control-card">
                    <div class="eq-control-top">
                      <div class="eq-control-title">
                        <p class="t">Controle Rápido</p>
                        <p class="d">Liga/desliga e presets prontos.</p>
                      </div>

                      <label class="switch">
                        <input type="checkbox" v-model="eqEnabled" @change="applyEqEnabled" />
                        <span class="slider"></span>
                      </label>
                    </div>

                    <div class="eq-presets">
                      <button class="pill" @click="resetEq" type="button">
                        <span class="mdi mdi-refresh"></span> Reset
                      </button>

                      <button class="pill primary" @click="applyPreset('bass')" type="button">
                        <span class="mdi mdi-waveform"></span> Grave+
                      </button>

                      <button class="pill primary" @click="applyPreset('vocal')" type="button">
                        <span class="mdi mdi-microphone"></span> Voz
                      </button>

                      <button class="pill primary" @click="applyPreset('bright')" type="button">
                        <span class="mdi mdi-brightness-5"></span> Brilho
                      </button>
                    </div>

                    <div class="eq-mini-note">
                      <span class="mdi mdi-shield-check-outline"></span>
                      <p>Não quebra o áudio: quando OFF, o som passa direto (bypass).</p>
                    </div>
                  </div>
                </section>

                <!-- BANDS: SLIDERS -->
                <section class="eq-bands">
                  <div class="eq-bands-head">
                    <div>
                      <h3 class="eq-h3">Bandas do Equalizador</h3>
                      <p class="eq-p">
                        Dica: Grave mexe no “peso”, Voz clareia o vocal e Agudo dá brilho.
                      </p>
                    </div>
                    <div class="eq-chip">
                      <span class="mdi mdi-tune-vertical"></span>
                      <span>Range -12dB a +12dB</span>
                    </div>
                  </div>

                  <div class="eq-sliders">
                    <div class="band" v-for="b in bands" :key="b.key">
                      <div class="band-top">
                        <p class="hz">{{ b.label }}</p>
                        <p class="db">{{ formatDb(b.gain) }} dB</p>
                      </div>

                      <div class="range-wrap">
                        <input
                          class="range"
                          type="range"
                          :min="-12"
                          :max="12"
                          :step="0.5"
                          v-model.number="b.gain"
                          @input="onBandChange"
                        />
                        <div class="range-glow" :style="{ '--p': (b.gain + 12) / 24 }"></div>
                      </div>

                      <p class="band-hint">{{ b.freq }} Hz</p>
                    </div>
                  </div>

                  <div class="eq-note">
                    <span class="mdi mdi-information-outline"></span>
                    <p>
                      Se você usa músicas hospedadas fora do seu domínio, pode existir bloqueio de CORS.
                      Você já marca <b>crossOrigin</b>, mas o servidor precisa permitir.
                    </p>
                  </div>
                </section>

                <div class="eq-footer-space"></div>
              </div>
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

  // preamp (evita clip e vira ponto único de visualização)
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

      radial: true,
      roundBars: true,
      showPeaks: true,
      showScale: false,

      overlay: true,
      showBgColor: true,
      bgAlpha: 0.16,

      fftSize: 8192,
      smoothing: 0.75,
      barSpace: 0.25,

      gradient: "prism"
    })

    // ajustes finos (se existirem na versão instalada)
    try {
      audioMotion.setOptions?.({
        radialSize: 0.64,
        radialSpin: 1.25
      })
    } catch {}

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

/* ======================
   FLOATING EQ BUTTON
====================== */
.eq-fab {
  position: fixed;
  right: 18px;
  bottom: 10rem;
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
  border-color: rgba(0, 207, 208, 0.55);
  background: rgba(0, 207, 208, 0.16);
}

/* ======================
        EQ MODAL (FODÃO)
====================== */
.eq-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(1200px 600px at 50% 10%, rgba(0,207,208,0.12), transparent 55%),
              rgba(0,0,0,0.72);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 9999;
}

.eq-panel {
  width: min(1040px, 100%);
  max-height: calc(100vh - 24px);
  background: rgba(10,10,12,0.92);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 26px;
  overflow: hidden;
  outline: none;
  box-shadow: 0 40px 120px rgba(0,0,0,0.65);
  backdrop-filter: blur(10px);
}

/* header fixo + corpo scroll */
.eq-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: radial-gradient(900px 260px at 12% -40%, rgba(0,207,208,0.22), transparent 60%),
              rgba(10,10,12,0.96);
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
  border: 1px solid rgba(255,255,255,0.10);
  font-weight: 950;
  letter-spacing: 0.10em;
  font-size: 11px;
}
.eq-badge .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6b7280;
  box-shadow: 0 0 0 7px rgba(255,255,255,0.03);
}
.eq-badge.on .dot {
  background: #00cfd0;
  box-shadow: 0 0 0 7px rgba(0,207,208,0.18);
}

.eq-close {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
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
  color: rgba(255,255,255,0.72);
  font-weight: 650;
  line-height: 1.5;
  font-size: 13px;
}

/* SCROLL */
.eq-scroll {
  max-height: calc(100vh - 160px);
  overflow: auto;
  padding: 16px 16px 0;
}
.eq-scroll::-webkit-scrollbar { width: 10px; }
.eq-scroll::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border-radius: 999px;
}
.eq-scroll::-webkit-scrollbar-track { background: transparent; }

.eq-footer-space { height: 18px; }

/* HERO layout */
.eq-hero{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items: start;
}

@media (max-width: 900px){
  .eq-hero{ grid-template-columns: 1fr; }
}

/* ======================
   VISUALIZER CIRCULAR
====================== */
.am-card{
  padding: 14px;
  border-radius: 20px;
  background:
    radial-gradient(900px 300px at 20% -60%, rgba(0,207,208,0.22), transparent 60%),
    rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
}

.am-ring{
  position: relative;
  width: min(360px, 100%);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 999px;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.07), rgba(0,0,0,0.60));
  box-shadow:
    0 30px 90px rgba(0,0,0,0.60),
    inset 0 0 0 2px rgba(255,255,255,0.10),
    inset 0 0 60px rgba(0,207,208,0.10);
}

.am-canvas{ width: 100%; height: 100%; }
.am-canvas canvas{
  width: 100% !important;
  height: 100% !important;
  display:block;
}

.am-center{
  position:absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  width: 44%;
  height: 44%;
  border-radius: 999px;
  display:grid;
  place-items:center;
  text-align:center;
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.18), rgba(0,0,0,0.86));
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: inset 0 0 28px rgba(0,0,0,0.62);
  pointer-events:none;
}

.am-center-dot{
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: rgba(107,114,128,0.9);
  box-shadow: 0 0 0 12px rgba(255,255,255,0.05);
  margin-bottom: 6px;
}
.am-center-dot.on{
  background: rgba(0,207,208,0.95);
  box-shadow: 0 0 0 12px rgba(0,207,208,0.12);
}

.am-center-title{
  margin:0;
  font-weight: 950;
  letter-spacing: .18em;
  font-size: 12px;
  opacity: .95;
}
.am-center-sub{
  margin:2px 0 0;
  font-weight: 850;
  font-size: 11px;
  opacity: .70;
}

.am-hint{
  margin-top: 12px;
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
}
.am-hint .mdi{ font-size: 18px; margin-top: 1px; }
.am-hint p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
   CONTROLE RÁPIDO (CARD)
====================== */
.eq-control-card{
  padding: 14px;
  border-radius: 20px;
  background:
    radial-gradient(800px 260px at 20% -60%, rgba(255,255,255,0.08), transparent 60%),
    rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
}

.eq-control-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap: 12px;
  margin-bottom: 12px;
}

.eq-control-title .t{
  margin:0;
  font-weight: 950;
  letter-spacing: -0.01em;
  font-size: 16px;
}
.eq-control-title .d{
  margin: 4px 0 0;
  color: rgba(255,255,255,0.65);
  font-weight: 650;
  font-size: 13px;
}

/* switch futurista */
.switch { position: relative; width: 52px; height: 30px; }
.switch input { display:none; }
.slider{
  position:absolute;
  inset:0;
  border-radius:999px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.14);
  transition: background .16s ease;
}
.slider::after{
  content:"";
  position:absolute;
  top:50%;
  left:4px;
  width: 22px;
  height: 22px;
  border-radius:999px;
  background:#fff;
  transform: translateY(-50%);
  transition: left .16s ease, background .16s ease;
  box-shadow: 0 10px 28px rgba(0,0,0,0.45);
}
.switch input:checked + .slider{
  background: rgba(0,207,208,0.34);
}
.switch input:checked + .slider::after{
  left: 26px;
  background: #00cfd0;
}

/* presets */
.eq-presets{
  display:flex;
  flex-wrap:wrap;
  gap: 10px;
  margin: 10px 0 12px;
}

.pill{
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
  cursor: pointer;
  display:inline-flex;
  align-items:center;
  gap: 8px;
  transition: transform .15s ease, background .15s ease, border-color .15s ease;
}
.pill:hover{ transform: translateY(-1px); background: rgba(255,255,255,0.09); }
.pill:active{ transform: translateY(0) scale(0.98); }
.pill.primary{
  border-color: rgba(0,207,208,0.34);
  background: rgba(0,207,208,0.12);
}

.eq-mini-note{
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px;
  border-radius: 16px;
  background: rgba(0,207,208,0.08);
  border: 1px solid rgba(0,207,208,0.18);
  color: rgba(255,255,255,0.82);
}
.eq-mini-note .mdi{ font-size: 18px; margin-top: 1px; }
.eq-mini-note p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
   BANDS
====================== */
.eq-bands{
  margin-top: 14px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.09);
}

.eq-bands-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 12px;
  flex-wrap:wrap;
  margin-bottom: 10px;
}

.eq-h3{
  margin:0;
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.01em;
}
.eq-p{
  margin: 6px 0 0;
  color: rgba(255,255,255,0.66);
  font-weight: 650;
  font-size: 13px;
  line-height: 1.45;
}

.eq-chip{
  display:inline-flex;
  align-items:center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.78);
  font-weight: 800;
  font-size: 12px;
}

/* grid ultra responsivo */
.eq-sliders{
  display:grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

@media (max-width: 920px){
  .eq-sliders{ grid-template-columns: repeat(3, minmax(0,1fr)); }
}
@media (max-width: 520px){
  .eq-sliders{ grid-template-columns: repeat(2, minmax(0,1fr)); }
  .eq-scroll{ padding: 14px 12px 0; }
}

.band{
  position: relative;
  border-radius: 18px;
  padding: 12px 10px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.10);
  overflow:hidden;
}
.band::before{
  content:"";
  position:absolute;
  inset:-50px -80px auto;
  height: 160px;
  background: radial-gradient(240px 90px at 18% 55%, rgba(0,207,208,0.16), transparent 60%);
  pointer-events:none;
}

.band-top{
  position: relative;
  z-index: 1;
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.hz{
  margin:0;
  font-weight: 950;
  font-size: 12px;
  color: rgba(255,255,255,0.92);
}
.db{
  margin:0;
  font-weight: 950;
  font-size: 12px;
  color: rgba(0,207,208,0.95);
}

.range-wrap{
  position: relative;
  z-index: 1;
}
.range{ width: 100%; }
.range-glow{
  --p: .5;
  position:absolute;
  inset: -6px -6px -10px -6px;
  border-radius: 16px;
  background: radial-gradient(220px 120px at 50% 50%, rgba(0,207,208,0.18), transparent 60%);
  opacity: calc(0.25 + var(--p) * 0.45);
  filter: blur(10px);
  pointer-events:none;
}

.band-hint{
  position: relative;
  z-index: 1;
  margin: 8px 0 0;
  font-size: 12px;
  opacity: 0.70;
  text-align:center;
  font-weight: 800;
}

/* info note */
.eq-note{
  margin-top: 14px;
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
}
.eq-note .mdi{ font-size: 18px; margin-top: 2px; }
.eq-note p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

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
