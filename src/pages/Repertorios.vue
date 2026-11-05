<template>
  <div class="repertorio-page">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>
    <div class="bg-orb orb-3"></div>
    <div class="noise-overlay"></div>

    <header class="header">
      <div class="logo-badge">
        <span class="logo-icon">♪</span>
      </div>
      <h1 class="title">Repertório</h1>
      <p class="subtitle">Acesse e baixe todas as músicas do seu plano</p>
      <div class="divider-line"></div>
    </header>

    <div v-if="carregandoPartes" class="status-state">
      <div class="spinner"></div>
      <p>Carregando repertórios...</p>
    </div>

    <div v-if="error" class="status-state error-state">
      <span class="state-icon">⚠</span>
      <p>{{ error }}</p>
    </div>

    <div v-if="!carregandoPartes && partes.length" class="main-card">
      <div class="card-header">
        <div class="card-header-left">
          <div class="month-badge">REPERTÓRIO</div>
          <h2 class="card-title">Repertório Completo</h2>
          <p class="card-subtitle">
            <span class="count-badge">{{ partes.length }}</span>
            {{ partes.length === 1 ? 'parte disponível' : 'partes disponíveis' }}
          </p>
        </div>
        <div class="card-header-right">
          <div class="vinyl-disc">
            <div class="vinyl-inner"></div>
          </div>
        </div>
      </div>

      <div class="card-divider"></div>

      <div class="downloads-label">
        <span class="label-icon">⬇</span>
        Selecione uma parte para baixar
      </div>

      <div class="parts-grid">
        <button
          v-for="(parte, i) in partes"
          :key="parte.id"
          class="part-btn"
          @click="baixarParte(parte)"
        >
          <div class="part-number">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="part-info">
            <span class="part-label">{{ parte.nome }}</span>
            <span class="part-size">
              <template v-if="parte.senha">🔒 </template>
              {{ tipoDaParte(parte) === 'link' ? 'Link externo' : (tamanhoLegivel(parte.tamanho) || 'Tamanho não informado') }}
            </span>
          </div>
          <div class="part-arrow">→</div>
        </button>
      </div>
    </div>

    <div v-if="!carregandoPartes && !partes.length && !error" class="status-state">
      <span class="state-icon">🎵</span>
      <p>Nenhum repertório disponível no momento.</p>
    </div>

    <div class="upsell-wrapper">
      <div class="upsell-card">
        <div class="upsell-hot-badge">
          <span class="hot-flame">🔥</span>
          <span>CONTEÚDO EXCLUSIVO</span>
        </div>

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

        <div class="upsell-teaser">
          <div class="teaser-dots">
            <span v-for="n in 5" :key="n" class="tdot" :style="{ animationDelay: n * 0.1 + 's' }"></span>
          </div>
          <span class="teaser-text">+2.000 músicas extras disponíveis</span>
          <div class="teaser-dots">
            <span v-for="n in 5" :key="n" class="tdot" :style="{ animationDelay: n * 0.1 + 's' }"></span>
          </div>
        </div>

        <p class="upsell-proof">
          <span class="proof-avatars">
            <span v-for="n in 4" :key="n" class="proof-avatar">{{ proofEmojis[n-1] }}</span>
          </span>
          Mais de <strong>350 Usuarios</strong> já adquiriram esses pacotes
        </p>
      </div>
    </div>

    <p class="footer-note">
      🔒 Disponível apenas para assinantes ativos
    </p>

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
import { ref, onMounted } from "vue"
import { db } from "@/firebase"
import { collection, getDocs } from "firebase/firestore"
import { partesVisiveis, tamanhoLegivel, tipoDaParte } from "@/services/repertorio-model.mjs"
import { useUserStore } from "@/stores/userStore"
import { useToast } from "vue-toast-notification"

const toast = useToast()
const userStore = useUserStore()

const partes = ref([])
const carregandoPartes = ref(true)
const error = ref("")
const showModalSenha = ref(false)
const senhaDigitada = ref("")
let resolverSenha
let partePendente = null

const extraCategories = [
  { icon: "🪗", label: "Forró das Antigas" },
  { icon: "🤠", label: "Sertanejo" },
  { icon: "🎬", label: "Video Clip" },
  { icon: "🎤", label: "Funk" },
  { icon: "🚛", label: "Caminhoneiro" },
]

const proofEmojis = ["😄", "🎧", "🎵", "🔥"]

async function fetchPartes() {
  try {
    carregandoPartes.value = true
    const qs = await getDocs(collection(db, "repertorios"))
    partes.value = partesVisiveis(qs.docs.map(d => ({ id: d.id, ...d.data() })))
  } catch (err) {
    console.error("[Repertorio] erro ao buscar partes:", err)
    error.value = "Erro ao buscar os repertórios."
  } finally {
    carregandoPartes.value = false
  }
}

function teste() {
  toast.warning("Indisponivel no momento, volte mais tarde.")
}

function solicitarSenha(parte) {
  return new Promise((resolve) => {
    partePendente = parte
    resolverSenha = resolve
    senhaDigitada.value = ""
    showModalSenha.value = true
  })
}

function confirmarSenha() {
  const digitada = senhaDigitada.value
  const esperada = String(partePendente?.senha ?? "")
  senhaDigitada.value = ""
  showModalSenha.value = false
  resolverSenha(!esperada || digitada === esperada)
}

function cancelarSenha() {
  showModalSenha.value = false
  resolverSenha(false)
}

async function baixarParte(parte) {
  // Vale para o ZIP nosso e para o link externo: só assinante ativo baixa.
  if (!userStore.hasActiveSubscription) {
    toast.warning("Você precisa de uma assinatura ativa para baixar o repertório 🎶")
    return
  }
  if (parte.senha) {
    const liberado = await solicitarSenha(parte)
    if (!liberado) {
      toast.error("Senha incorreta! ❌")
      return
    }
  }
  toast.info(`Abrindo "${parte.nome}" para download...`)
  try {
    window.open(parte.url, "_blank", "noopener")
  } catch (err) {
    toast.error("Erro ao abrir o link de download")
  }
}

onMounted(() => fetchPartes())
</script>

<style scoped>
.header, .main-card, .status-state, .footer-note { position: relative; z-index: 2; }
.repertorio-page { position: relative; min-height: 100vh; width: 100%; background: #0a0a0a; color: #fff; font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; align-items: center; padding: 48px 20px 80px; overflow-x: hidden; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(100px); pointer-events: none; z-index: 0; animation: floatOrb 12s ease-in-out infinite alternate; }
.orb-1 { width: 520px; height: 520px; background: radial-gradient(circle, rgba(29,185,84,0.18) 0%, transparent 70%); top: -120px; left: -120px; }
.orb-2 { width: 420px; height: 420px; background: radial-gradient(circle, rgba(0,195,255,0.14) 0%, transparent 70%); bottom: 80px; right: -100px; }
.orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(29,185,84,0.08) 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); }
@keyframes floatOrb { from { transform: translate(0, 0) scale(1); } to { transform: translate(30px, 20px) scale(1.08); } }
.noise-overlay { position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.03; background-size: 128px; }
.header { text-align: center; margin-bottom: 48px; width: 100%; max-width: 500px; }
.logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #1db954, #00c3ff); margin-bottom: 20px; box-shadow: 0 0 32px rgba(29,185,84,0.4); }
.logo-icon { font-size: 28px; line-height: 1; }
.title { font-family: 'Syne', sans-serif; font-size: clamp(36px, 8vw, 56px); font-weight: 800; letter-spacing: -1.5px; background: linear-gradient(100deg, #1db954 0%, #00c3ff 50%, #1db954 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 12px; line-height: 1.1; }
.subtitle { font-size: clamp(13px, 3vw, 15px); color: rgba(255,255,255,0.38); margin-bottom: 28px; }
.divider-line { height: 1px; width: 60px; margin: 0 auto; background: linear-gradient(90deg, transparent, #1db954, #00c3ff, transparent); opacity: 0.5; }
.main-card { width: 100%; max-width: 480px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; padding: 32px; backdrop-filter: blur(20px); box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 32px 80px rgba(0,0,0,0.5); }
.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
.month-badge { display: inline-block; font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #1db954; background: rgba(29,185,84,0.12); border: 1px solid rgba(29,185,84,0.25); border-radius: 6px; padding: 4px 10px; margin-bottom: 10px; }
.card-title { font-family: 'Syne', sans-serif; font-size: clamp(20px, 5vw, 26px); font-weight: 700; color: #fff; line-height: 1.2; margin-bottom: 8px; }
.card-subtitle { font-size: 13px; color: rgba(255,255,255,0.45); display: flex; align-items: center; gap: 8px; }
.count-badge { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; color: #00c3ff; background: rgba(0,195,255,0.1); border: 1px solid rgba(0,195,255,0.2); border-radius: 6px; padding: 2px 8px; }
.vinyl-disc { flex-shrink: 0; width: 64px; height: 64px; border-radius: 50%; background: conic-gradient(from 0deg, #1a1a1a 0%, #2a2a2a 10%, #1a1a1a 20%, #2a2a2a 30%, #1a1a1a 40%, #2a2a2a 50%, #1a1a1a 60%, #2a2a2a 70%, #1a1a1a 80%, #2a2a2a 90%, #1a1a1a 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px rgba(29,185,84,0.3); }
.vinyl-inner { width: 20px; height: 20px; border-radius: 50%; background: radial-gradient(circle, #1db954 0%, #00c3ff 100%); }
.card-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent); margin-bottom: 24px; }
.downloads-label { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.label-icon { width: 20px; height: 20px; border-radius: 6px; background: linear-gradient(135deg, #1db954, #00c3ff); display: inline-flex; align-items: center; justify-content: center; font-size: 11px; }
.parts-grid { display: flex; flex-direction: column; gap: 10px; }
.part-btn { width: 100%; display: flex; align-items: center; gap: 16px; padding: 14px 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; color: #fff; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); text-align: left; }
.part-btn:hover { border-color: rgba(29,185,84,0.3); transform: translateX(4px); }
.part-number { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800; color: #1db954; min-width: 28px; }
.part-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.part-label { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); }
.part-size { font-size: 11px; color: rgba(255,255,255,0.3); }
.part-arrow { font-size: 16px; color: rgba(255,255,255,0.25); }
.status-state { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 12px; color: rgba(255,255,255,0.35); font-size: 14px; margin: 40px 0; }
.state-icon { font-size: 32px; }
.error-state { color: rgba(255,100,100,0.7); }
.spinner { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.08); border-top-color: #1db954; border-right-color: #00c3ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.footer-note { position: relative; z-index: 2; margin-top: 28px; font-size: 12px; color: rgba(255,255,255,0.2); text-align: center; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
.modal-box { background: #161616; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 36px 32px; width: 100%; max-width: 360px; text-align: center; }
.modal-icon { font-size: 36px; margin-bottom: 16px; }
.modal-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px; }
.modal-desc { font-size: 13px; color: rgba(255,255,255,0.38); margin-bottom: 24px; }
.modal-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 16px; color: #fff; font-size: 16px; outline: none; text-align: center; letter-spacing: 4px; margin-bottom: 20px; }
.modal-actions { display: flex; gap: 10px; }
.modal-btn { flex: 1; height: 46px; border-radius: 12px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; }
.modal-btn.cancel { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); }
.modal-btn.confirm { background: linear-gradient(135deg, #1db954, #00c3ff); color: #000; font-weight: 700; }
.upsell-wrapper { position: relative; width: 100%; max-width: 480px; margin-top: 24px; z-index: 2; }
.upsell-card { position: relative; width: 100%; background: #0f0f0f; border-radius: 28px; padding: 28px 28px 24px; }
.upsell-hot-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,107,0,0.2); border: 1px solid rgba(255,150,0,0.3); border-radius: 999px; padding: 5px 14px; margin-bottom: 20px; font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #ffa040; }
.upsell-header { margin-bottom: 20px; }
.upsell-lock { margin-bottom: 10px; }
.lock-emoji { font-size: 28px; }
.upsell-title { font-family: 'Syne', sans-serif; font-size: clamp(20px, 5vw, 26px); font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 8px; }
.upsell-title em { font-style: normal; background: linear-gradient(90deg, #1db954, #00c3ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.upsell-desc { font-size: 13px; color: rgba(255,255,255,0.42); line-height: 1.5; }
.upsell-desc strong { color: rgba(255,255,255,0.7); }
.upsell-categories { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.upsell-cat { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; }
.cat-icon { font-size: 22px; flex-shrink: 0; }
.cat-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.cat-label { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.85); line-height: 1.2; }
.cat-cta-text { font-size: 11px; color: rgba(29,185,84,0.7); font-weight: 500; }
.cat-badge { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #000; background: linear-gradient(135deg, #1db954, #00c3ff); border-radius: 6px; padding: 4px 9px; flex-shrink: 0; }
.upsell-teaser { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 10px 0; }
.teaser-dots { display: flex; gap: 4px; flex-shrink: 0; }
.tdot { display: block; width: 5px; height: 5px; border-radius: 50%; background: linear-gradient(135deg, #1db954, #00c3ff); }
.teaser-text { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; color: rgba(255,255,255,0.3); white-space: nowrap; flex-shrink: 0; }
.upsell-proof { text-align: center; font-size: 12px; color: rgba(255,255,255,0.28); display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
.upsell-proof strong { color: rgba(255,255,255,0.55); }
.proof-avatars { display: flex; gap: 2px; }
.proof-avatar { font-size: 14px; }
@media (max-width: 480px) { .upsell-card { padding: 22px 18px 20px; } .teaser-text { display: none; } .repertorio-page { padding: 36px 16px 72px; } .main-card { padding: 24px 20px; border-radius: 22px; } .vinyl-disc { width: 52px; height: 52px; } .part-btn { padding: 12px 14px; gap: 12px; } .modal-box { padding: 28px 22px; } }
@media (max-width: 360px) { .part-size { display: none; } }
</style>
