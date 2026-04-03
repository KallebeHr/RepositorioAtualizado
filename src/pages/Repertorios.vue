<template>
  <div class="repertorio-page">
    <!-- Ambient background orbs -->
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>
    <div class="bg-orb orb-3"></div>
    <div class="noise-overlay"></div>

    <!-- Header -->
    <header class="header">
      <div class="logo-badge">
        <span class="logo-icon">♪</span>
      </div>
      <h1 class="title">Repertório</h1>
      <p class="subtitle">Acesse e baixe todas as músicas do seu plano</p>
      <div class="divider-line"></div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="status-state">
      <div class="spinner"></div>
      <p>Carregando músicas...</p>
    </div>

    <!-- Error -->
    <div v-if="error" class="status-state error-state">
      <span class="state-icon">⚠</span>
      <p>{{ error }}</p>
    </div>

    <!-- Main Card -->
    <div v-if="!loading && musicas.length" class="main-card">
      <!-- Card Header -->
      <div class="card-header">
        <div class="card-header-left">
          <div class="month-badge">ABRIL</div>
          <h2 class="card-title">Repertório Completo</h2>
          <p class="card-subtitle">
            <span class="count-badge">5.772</span> músicas disponíveis
          </p>
        </div>
        <div class="card-header-right">
          <div class="vinyl-disc">
            <div class="vinyl-inner"></div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="card-divider"></div>

      <!-- Download Parts Grid -->
      <div class="downloads-label">
        <span class="label-icon">⬇</span>
        Selecione uma parte para baixar
      </div>

      <div class="parts-grid">
        <button
          v-for="(part, i) in parts"
          :key="i"
          class="part-btn"
          :class="{ 'is-loading': progress > 0 && progress < 100 }"
          :disabled="progress > 0 && progress < 100"
          @click="part.handler"
        >
          <div class="part-number">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="part-info">
            <span class="part-label">Parte {{ romanNumerals[i] }}</span>
            <span class="part-size">{{ part.size }}</span>
          </div>
          <div class="part-arrow">
            <span v-if="progress > 0 && progress < 100">{{ progress }}%</span>
            <span v-else>→</span>
          </div>
        </button>
      </div>

      <!-- Progress bar -->
      <div v-if="progress !== null && progress > 0" class="progress-wrap">
        <div class="progress-bar-track">
          <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-label">{{ progress }}%</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && !musicas.length && !error" class="status-state">
      <span class="state-icon">🎵</span>
      <p>Nenhuma música disponível no momento.</p>
    </div>

    <!-- ══ UPSELL CARD ══ -->
    <div class="upsell-wrapper">
      <!-- Animated border glow ring -->
      <div class="upsell-ring"></div>

      <div class="upsell-card">
        <!-- Hot badge -->
        <div class="upsell-hot-badge">
          <span class="hot-flame">🔥</span>
          <span>CONTEÚDO EXCLUSIVO</span>
        </div>

        <!-- Header -->
        <div class="upsell-header">
          <div class="upsell-lock">
            <span class="lock-emoji">🔓</span>
          </div>
          <h3 class="upsell-title">Adicione mais <em>musicas</em> desse estilos.</h3>
          <p class="upsell-desc">
            Desbloqueie um pacote completo com categorias extras que
            <strong>não estão no repertório padrão</strong>
          </p>
        </div>

        <!-- Categories — each is its own checkout link -->
         <!-- :href="cat.url" -->
        <div class="upsell-categories">
          <a
            v-for="cat in extraCategories"
            :key="cat.label"
            
            @click="teste()"
            target="_blank"
            rel="noopener noreferrer"
            class="upsell-cat"
          >
            <span class="cat-icon">{{ cat.icon }}</span>
            <div class="cat-info">
              <span class="cat-label">{{ cat.label }}</span>
              <span class="cat-cta-text">Clique para adquirir →</span>
            </div>
            <div class="cat-badge">VER</div>
          </a>
        </div>

        <!-- Teaser bar -->
        <div class="upsell-teaser">
          <div class="teaser-dots">
            <span v-for="n in 5" :key="n" class="tdot" :style="{ animationDelay: n * 0.1 + 's' }"></span>
          </div>
          <span class="teaser-text">+2.000 músicas extras disponíveis</span>
          <div class="teaser-dots">
            <span v-for="n in 5" :key="n" class="tdot" :style="{ animationDelay: n * 0.1 + 's' }"></span>
          </div>
        </div>


        <!-- Social proof -->
        <p class="upsell-proof">
          <span class="proof-avatars">
            <span v-for="n in 4" :key="n" class="proof-avatar">{{ proofEmojis[n-1] }}</span>
          </span>
          Mais de <strong>350 Usuarios</strong> já adquiriram esses pacotes
        </p>
      </div>
    </div>

    <!-- Footer note -->
    <p class="footer-note">
      🔒 Disponível apenas para assinantes ativos
    </p>

    <!-- Modal de Senha -->
    <Transition name="modal">
      <div v-if="showModalSenha" class="modal-overlay" @click.self="cancelarSenha">
        <div class="modal-box">
          <div class="modal-icon">🔐</div>
          <h3 class="modal-title">Verificação necessária</h3>
          <p class="modal-desc">Digite a senha para liberar o download</p>
          <input
            v-model="senhaDigitada"
            type="password"
            placeholder="••••••••"
            class="modal-input"
            @keyup.enter="confirmarSenha"
            autofocus
          />
          <div class="modal-actions">
            <button @click="cancelarSenha" class="modal-btn cancel">Cancelar</button>
            <button @click="confirmarSenha" class="modal-btn confirm">Confirmar</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { db } from "@/firebase"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { useUserStore } from "@/stores/userStore"
import { useToast } from "vue-toast-notification"

const loading = ref(true)
const error = ref("")
const musicas = ref([])
const progress = ref(null)
const showModalSenha = ref(false)
const senhaDigitada = ref("")
let resolveSenha

const toast = useToast()
const userStore = useUserStore()

const romanNumerals = ["I", "II", "III", "IV", "V", "VI"]

const extraCategories = [
  { icon: "🪗", label: "Forró das Antigas", url: "https://SUA_URL/forro-antigas" },
  { icon: "🤠", label: "Sertanejo",         url: "https://SUA_URL/sertanejo" },
  { icon: "🎬", label: "Video Clip",         url: "https://SUA_URL/video-clip" },
  { icon: "🎤", label: "Funk",               url: "https://SUA_URL/funk" },
  { icon: "🚛", label: "Caminhoneiro",       url: "https://SUA_URL/caminhoneiro" },
]

const proofEmojis = ["😄", "🎧", "🎵", "🔥"]

const parts = [
  { size: "~900 MB", handler: handleDownloadAllOneFevereiro },
  { size: "~900 MB", handler: handleDownloadAllTwoFevereiro },
  { size: "~900 MB", handler: handleDownloadAllTresFevereiro },
  { size: "~900 MB", handler: handleDownloadAllQuatroFevereiro },
  { size: "~900 MB", handler: handleDownloadAllCincoFevereiro },
  { size: "~900 MB", handler: handleDownloadAllSeisFevereiro },
]

async function fetchMusicas() {
  try {
    loading.value = true
    const q = query(collection(db, "musicas"), orderBy("createdAt", "desc"))
    const qs = await getDocs(q)
    musicas.value = qs.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error("[Repertorio] erro ao buscar:", err)
    error.value = "Erro ao buscar músicas."
  } finally {
    loading.value = false
  }
}

function solicitarSenha() {
  return new Promise((resolve) => {
    resolveSenha = resolve
    senhaDigitada.value = ""
    showModalSenha.value = true
  })
}
function teste() {
      toast.warning("Indisponivel no momento, volte mais tarde.")
    return
}
function confirmarSenha() {
  const ok = senhaDigitada.value === "1421"
  showModalSenha.value = false
  resolveSenha(ok)
}

function cancelarSenha() {
  showModalSenha.value = false
  resolveSenha(false)
}

function redirect(url) {
  let counter = 3
  const interval = setInterval(() => {
    toast.info(`Redirecionando em ${counter}...`)
    counter--
    if (counter < 0) {
      clearInterval(interval)
      window.location.href = url
    }
  }, 1000)
}

async function guardedDownload(url) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Você precisa ativar a assinatura para baixar músicas 🎶")
    return
  }
  const ok = await solicitarSenha()
  if (!ok) { toast.error("Senha incorreta! ❌"); return }
  try { redirect(url) } catch (err) {
    toast.error("Erro ao redirecionar para a página de download")
  }
}

async function handleDownloadAllOneFevereiro() { await guardedDownload("https://repertorioatualizado.fromsmash.com/parte-1-abril") }
async function handleDownloadAllTwoFevereiro() { await guardedDownload("https://repertorioatualizado.fromsmash.com/parte-2-abril") }
async function handleDownloadAllTresFevereiro() { await guardedDownload("https://repertorioatualizado.fromsmash.com/parte-3-abril") }
async function handleDownloadAllQuatroFevereiro() { await guardedDownload("https://repertorioatualizado.fromsmash.com/parte-4-abril") }
async function handleDownloadAllCincoFevereiro() { await guardedDownload("https://repertorioatualizado.fromsmash.com/parte-5-abril") }
async function handleDownloadAllSeisFevereiro() { await guardedDownload("https://repertorioatualizado.fromsmash.com/parte-6-abril") }

onMounted(() => fetchMusicas())
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

/* ── Base ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.repertorio-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background: #0a0a0a;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px 80px;
  overflow-x: hidden;
}

/* ── Ambient Background ── */
.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;
  animation: floatOrb 12s ease-in-out infinite alternate;
}
.orb-1 {
  width: 520px; height: 520px;
  background: radial-gradient(circle, rgba(29,185,84,0.18) 0%, transparent 70%);
  top: -120px; left: -120px;
  animation-duration: 14s;
}
.orb-2 {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(0,195,255,0.14) 0%, transparent 70%);
  bottom: 80px; right: -100px;
  animation-duration: 10s;
}
.orb-3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(29,185,84,0.08) 0%, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation-duration: 18s;
}
@keyframes floatOrb {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, 20px) scale(1.08); }
}

.noise-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 128px;
}

/* All content above z-index 0 */
.header, .main-card, .status-state, .footer-note { position: relative; z-index: 2; }

/* ── Header ── */
.header {
  text-align: center;
  margin-bottom: 48px;
  width: 100%;
  max-width: 500px;
  animation: fadeUp 0.7s ease both;
}

.logo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px; height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1db954, #00c3ff);
  margin-bottom: 20px;
  box-shadow: 0 0 32px rgba(29,185,84,0.4), 0 0 64px rgba(0,195,255,0.2);
  animation: pulse-glow 3s ease-in-out infinite;
}
.logo-icon {
  font-size: 28px;
  line-height: 1;
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 32px rgba(29,185,84,0.4), 0 0 64px rgba(0,195,255,0.2); }
  50%       { box-shadow: 0 0 48px rgba(29,185,84,0.6), 0 0 80px rgba(0,195,255,0.3); }
}

.title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(36px, 8vw, 56px);
  font-weight: 800;
  letter-spacing: -1.5px;
  background: linear-gradient(100deg, #1db954 0%, #00c3ff 50%, #1db954 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 4s linear infinite;
  margin-bottom: 12px;
  line-height: 1.1;
}
@keyframes shimmer { to { background-position: 200% center; } }

.subtitle {
  font-size: clamp(13px, 3vw, 15px);
  color: rgba(255,255,255,0.38);
  font-weight: 400;
  letter-spacing: 0.01em;
  margin-bottom: 28px;
}

.divider-line {
  height: 1px;
  width: 60px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, #1db954, #00c3ff, transparent);
  opacity: 0.5;
}

/* ── Main Card ── */
.main-card {
  width: 100%;
  max-width: 480px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 28px;
  padding: 32px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.06) inset,
    0 32px 80px rgba(0,0,0,0.5),
    0 0 0 1px rgba(29,185,84,0.06);
  animation: fadeUp 0.7s 0.1s ease both;
}

/* ── Card Header ── */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.month-badge {
  display: inline-block;
  font-family: 'Syne', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #1db954;
  background: rgba(29,185,84,0.12);
  border: 1px solid rgba(29,185,84,0.25);
  border-radius: 6px;
  padding: 4px 10px;
  margin-bottom: 10px;
}

.card-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(20px, 5vw, 26px);
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 8px;
}

.card-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #00c3ff;
  background: rgba(0,195,255,0.1);
  border: 1px solid rgba(0,195,255,0.2);
  border-radius: 6px;
  padding: 2px 8px;
}

/* Vinyl disc decoration */
.vinyl-disc {
  flex-shrink: 0;
  width: 64px; height: 64px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #1a1a1a 0%, #2a2a2a 10%, #1a1a1a 20%,
    #2a2a2a 30%, #1a1a1a 40%, #2a2a2a 50%,
    #1a1a1a 60%, #2a2a2a 70%, #1a1a1a 80%,
    #2a2a2a 90%, #1a1a1a 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px rgba(29,185,84,0.3), 0 8px 24px rgba(0,0,0,0.5);
  animation: spin 8s linear infinite;
}
.vinyl-inner {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, #1db954 0%, #00c3ff 100%);
  box-shadow: 0 0 12px rgba(29,185,84,0.6);
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Card Divider ── */
.card-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  margin-bottom: 24px;
}

/* ── Downloads Label ── */
.downloads-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.label-icon {
  width: 20px; height: 20px;
  border-radius: 6px;
  background: linear-gradient(135deg, #1db954, #00c3ff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

/* ── Parts Grid ── */
.parts-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.part-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  color: #fff;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  text-align: left;
}

.part-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(29,185,84,0.08), rgba(0,195,255,0.08));
  opacity: 0;
  transition: opacity 0.25s ease;
}
.part-btn::after {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #1db954, #00c3ff);
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.part-btn:hover:not(:disabled) {
  border-color: rgba(29,185,84,0.3);
  transform: translateX(4px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.3), -4px 0 20px rgba(29,185,84,0.1);
}
.part-btn:hover:not(:disabled)::before { opacity: 1; }
.part-btn:hover:not(:disabled)::after { opacity: 1; }

.part-btn:active:not(:disabled) { transform: translateX(2px) scale(0.99); }

.part-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.part-number {
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 800;
  color: #1db954;
  min-width: 28px;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.part-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  z-index: 1;
}

.part-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  letter-spacing: -0.2px;
}

.part-size {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  font-weight: 400;
}

.part-arrow {
  font-size: 16px;
  color: rgba(255,255,255,0.25);
  transition: all 0.25s ease;
  position: relative;
  z-index: 1;
}
.part-btn:hover:not(:disabled) .part-arrow {
  color: #1db954;
  transform: translateX(2px);
}

/* ── Progress ── */
.progress-wrap {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.progress-bar-track {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1db954, #00c3ff);
  border-radius: 999px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}
.progress-bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer-bar 1.5s linear infinite;
}
@keyframes shimmer-bar {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}
.progress-label {
  font-size: 12px;
  font-weight: 600;
  color: #1db954;
  min-width: 36px;
  text-align: right;
}

/* ── Status States ── */
.status-state {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255,255,255,0.35);
  font-size: 14px;
  margin: 40px 0;
}
.state-icon { font-size: 32px; }
.error-state { color: rgba(255,100,100,0.7); }

/* Spinner */
.spinner {
  width: 32px; height: 32px;
  border: 2px solid rgba(255,255,255,0.08);
  border-top-color: #1db954;
  border-right-color: #00c3ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ── Footer ── */
.footer-note {
  position: relative;
  z-index: 2;
  margin-top: 28px;
  font-size: 12px;
  color: rgba(255,255,255,0.2);
  text-align: center;
  letter-spacing: 0.01em;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-box {
  background: #161616;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 36px 32px;
  width: 100%;
  max-width: 360px;
  text-align: center;
  box-shadow:
    0 0 0 1px rgba(29,185,84,0.1),
    0 40px 80px rgba(0,0,0,0.7);
}

.modal-icon {
  font-size: 36px;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 12px rgba(29,185,84,0.4));
}

.modal-title {
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.modal-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.38);
  margin-bottom: 24px;
}

.modal-input {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 14px 16px;
  color: #fff;
  font-size: 16px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  text-align: center;
  letter-spacing: 4px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 20px;
}
.modal-input::placeholder { letter-spacing: 2px; color: rgba(255,255,255,0.2); }
.modal-input:focus {
  border-color: rgba(29,185,84,0.5);
  box-shadow: 0 0 0 3px rgba(29,185,84,0.12);
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.modal-btn {
  flex: 1;
  height: 46px;
  border-radius: 12px;
  border: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-btn.cancel {
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.5);
  border: 1px solid rgba(255,255,255,0.08);
}
.modal-btn.cancel:hover {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #1db954, #00c3ff);
  color: #000;
  font-weight: 700;
  box-shadow: 0 4px 20px rgba(29,185,84,0.35);
}
.modal-btn.confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 28px rgba(29,185,84,0.5);
}
.modal-btn.confirm:active { transform: translateY(0); }

/* ── Modal Transitions ── */
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box {
  transform: scale(0.94) translateY(8px);
}

/* ── Fade Up ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}


/* ══════════════════════════════════════════
   UPSELL CARD
══════════════════════════════════════════ */
.upsell-wrapper {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin-top: 24px;
  z-index: 2;
}

/* Rotating gradient border ring */
.upsell-ring {
  position: absolute;
  inset: -2px;
  border-radius: 30px;
  background: conic-gradient(
    from var(--angle, 0deg),
    #1db954, #00c3ff, #ff6b6b, #ffd700, #1db954
  );
  animation: spin-ring 4s linear infinite;
  z-index: -1;
  filter: blur(1px);
}
@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}
@keyframes spin-ring {
  to { --angle: 360deg; }
}

.upsell-card {
  position: relative;
  width: 100%;
  background: #0f0f0f;
  border-radius: 28px;
  padding: 28px 28px 24px;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
}
.upsell-card:hover { transform: translateY(-3px); }

/* Subtle inner texture */
.upsell-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(29,185,84,0.07) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(0,195,255,0.06) 0%, transparent 60%);
  pointer-events: none;
}

/* ── Hot Badge ── */
.upsell-hot-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(90deg, rgba(255,107,0,0.2), rgba(255,215,0,0.15));
  border: 1px solid rgba(255,150,0,0.3);
  border-radius: 999px;
  padding: 5px 14px;
  margin-bottom: 20px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #ffa040;
  animation: badge-pulse 2.5s ease-in-out infinite;
}
.hot-flame {
  font-size: 14px;
  animation: flame-flicker 0.8s ease-in-out infinite alternate;
}
@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,150,0,0); }
  50%       { box-shadow: 0 0 16px 2px rgba(255,150,0,0.2); }
}
@keyframes flame-flicker {
  from { transform: scale(1) rotate(-5deg); }
  to   { transform: scale(1.15) rotate(5deg); }
}

/* ── Header ── */
.upsell-header {
  margin-bottom: 20px;
}
.upsell-lock {
  margin-bottom: 10px;
}
.lock-emoji {
  font-size: 28px;
  filter: drop-shadow(0 0 10px rgba(29,185,84,0.5));
  animation: lock-bounce 3s ease-in-out infinite;
}
@keyframes lock-bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-4px); }
}
.upsell-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(20px, 5vw, 26px);
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
  line-height: 1.2;
  margin-bottom: 8px;
}
.upsell-title em {
  font-style: normal;
  background: linear-gradient(90deg, #1db954, #00c3ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.upsell-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.42);
  line-height: 1.5;
}
.upsell-desc strong {
  color: rgba(255,255,255,0.7);
}

/* ── Categories Grid ── */
.upsell-categories {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}
.upsell-cat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  animation: cat-slide-in 0.5s ease both;
  cursor: pointer;
  text-decoration: none;
}
.upsell-cat:nth-child(1) { animation-delay: 0.05s; }
.upsell-cat:nth-child(2) { animation-delay: 0.1s; }
.upsell-cat:nth-child(3) { animation-delay: 0.15s; }
.upsell-cat:nth-child(4) { animation-delay: 0.2s; }
.upsell-cat:nth-child(5) { animation-delay: 0.25s; }

@keyframes cat-slide-in {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.upsell-card:hover .upsell-cat {
  border-color: rgba(29,185,84,0.18);
  background: rgba(29,185,84,0.05);
}

.cat-icon { font-size: 22px; flex-shrink: 0; }
.cat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cat-label {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255,255,255,0.85);
  letter-spacing: -0.1px;
  line-height: 1.2;
}
.cat-cta-text {
  font-size: 11px;
  color: rgba(29,185,84,0.7);
  font-weight: 500;
  transition: color 0.2s ease;
}
.upsell-cat:hover .cat-cta-text {
  color: #1db954;
}
.cat-badge {
  font-family: 'Syne', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #000;
  background: linear-gradient(135deg, #1db954, #00c3ff);
  border-radius: 6px;
  padding: 4px 9px;
  flex-shrink: 0;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(29,185,84,0.3);
}
.upsell-cat:hover .cat-badge {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(29,185,84,0.5);
}

/* ── Teaser bar ── */
.upsell-teaser {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px 0;
}
.teaser-dots {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.tdot {
  display: block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1db954, #00c3ff);
  animation: dot-pulse 1.4s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50%       { opacity: 1;   transform: scale(1.2); }
}
.teaser-text {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: rgba(255,255,255,0.3);
  white-space: nowrap;
  flex-shrink: 0;
}



/* ── Social proof ── */
.upsell-proof {
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.upsell-proof strong { color: rgba(255,255,255,0.55); }
.proof-avatars {
  display: flex;
  gap: 2px;
}
.proof-avatar {
  font-size: 14px;
  filter: grayscale(0.3);
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .upsell-card { padding: 22px 18px 20px; }
  .upsell-categories { gap: 7px; }
  .upsell-cat { padding: 10px 13px; }
  .teaser-text { display: none; }

  .repertorio-page { padding: 36px 16px 72px; }
  .main-card { padding: 24px 20px; border-radius: 22px; }
  .card-header { gap: 12px; }
  .vinyl-disc { width: 52px; height: 52px; }
  .vinyl-inner { width: 16px; height: 16px; }
  .part-btn { padding: 12px 14px; gap: 12px; }
  .modal-box { padding: 28px 22px; }
}

@media (max-width: 360px) {
  .part-size { display: none; }
  .modal-box { border-radius: 20px; }
}
</style>