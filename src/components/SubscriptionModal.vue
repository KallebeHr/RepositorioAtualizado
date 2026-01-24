<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="sub-overlay" @click.self="allowClose ? close() : null">
        <transition name="pop">
          <div class="sub-modal" role="dialog" aria-modal="true" aria-label="Ativar assinatura">
            <button v-if="allowClose" class="sub-close" @click="close()" aria-label="Fechar">
              <span class="mdi mdi-close"></span>
            </button>

            <div class="sub-wrap">
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

                  <div class="sub-badges">
                    <span class="badge"><span class="mdi mdi-download"></span> Downloads</span>
                    <span class="badge"><span class="mdi mdi-play-circle"></span> Player</span>
                    <span class="badge"><span class="mdi mdi-playlist-music"></span> Fila</span>
                  </div>
                </div>
              </aside>

              <!-- RIGHT CONTENT -->
              <main class="sub-right">
                <h3 class="sub-title">Como funciona?</h3>
                <p class="sub-desc">
                  Para tocar músicas, baixar em pastas e adicionar na fila, sua conta precisa estar com a assinatura ativa.
                  É rapidinho:
                </p>

                <div class="sub-steps">
                  <div class="step">
                    <div class="n">1</div>
                    <div class="txt">
                      <p class="t">Ative seu acesso</p>
                      <p class="d">Digite sua chave e confirme em poucos cliques.</p>
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
                      <p class="t">Tudo liberado</p>
                      <p class="d">Acesse os conteúdos premium sem limites.</p>
                    </div>
                  </div>
                </div>

                <!-- KEY INPUT -->
                <div class="sub-keybox">
                  <label class="sub-label">Chave de ativação</label>
                  <div class="sub-input-row">
                    <input
                      v-model="key"
                      class="sub-input"
                      type="text"
                      placeholder="Ex: MAX-1234-ABCD"
                      autocomplete="off"
                      @keydown.enter.prevent="handleActivate"
                      :disabled="busy"
                    />
                    <button class="sub-btn" @click="handleActivate" :disabled="busy || !key">
                      <span v-if="!busy" class="mdi mdi-lock-open-variant"></span>
                      <span v-else class="mdi mdi-loading mdi-spin"></span>
                      Ativar
                    </button>
                  </div>
                  <p v-if="error" class="sub-error">
                    <span class="mdi mdi-alert-circle"></span> {{ error }}
                  </p>
                  <p v-if="success" class="sub-success">
                    <span class="mdi mdi-check-circle"></span> {{ success }}
                  </p>
                </div>

                <div class="sub-divider"></div>

                <!-- CTA -->
                <a class="sub-cta" :href="ctaLink" target="_blank" rel="noopener">
                  <span class="mdi mdi-whatsapp"></span>
                  SOLICITAR AGORA
                </a>

                <p class="sub-foot">Fale diretamente com nossa equipe</p>
              </main>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/stores/userStore"

const props = defineProps({
  allowClose: { type: Boolean, default: false }, // true = deixa fechar; false = força ativar/solicitar
  ctaLink: { type: String, default: "https://wa.me/55SEUNUMEROAQUI?text=Quero%20ativar%20o%20acesso%20premium." },
})

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const open = ref(false)
const key = ref("")
const busy = ref(false)
const error = ref("")
const success = ref("")

const mustShow = computed(() => {
  return !!userStore.user && !userStore.loadingUser && !userStore.hasActiveSubscription
})

// abre automaticamente quando o user logar sem assinatura
watch(
  mustShow,
  (val) => {
    if (val) {
      open.value = true
    } else {
      open.value = false
      key.value = ""
      error.value = ""
      success.value = ""
      busy.value = false
    }
  },
  { immediate: true }
)

// se navegar, mantém aberto enquanto precisar
watch(
  () => route.fullPath,
  () => {
    if (mustShow.value) open.value = true
  }
)

function close() {
  open.value = false
}

async function handleActivate() {
  error.value = ""
  success.value = ""

  if (!key.value) {
    error.value = "Digite sua chave."
    return
  }

  busy.value = true
  try {
    const msg = await userStore.ativarAssinaturaComChave(key.value.trim(), router)
    success.value = msg || "Ativado com sucesso!"
    // se ativou mesmo, o computed vai virar true e o watch fecha o modal automaticamente
  } catch (e) {
    error.value = e?.message || "Chave inválida ou erro ao ativar."
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.sub-overlay{
  position:fixed; inset:0;
  background: rgba(0,0,0,.55);
  display:flex; align-items:center; justify-content:center;
  z-index: 9999;
  padding: 16px;
}

.sub-modal{
  width: min(980px, 100%);
  border-radius: 18px;
  overflow:hidden;
  background:#0b1220;
  box-shadow: 0 22px 70px rgba(0,0,0,.55);
  position:relative;
}

.sub-close{
  position:absolute; top:12px; right:12px;
  border:0; background: rgba(255,255,255,.08);
  color:#fff; width:40px; height:40px; border-radius: 12px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer;
}

.sub-wrap{ display:grid; grid-template-columns: 360px 1fr; min-height: 420px; }

.sub-left{
  background: radial-gradient(1200px 400px at 30% 10%, rgba(124,194,66,.25), transparent 55%),
              radial-gradient(900px 400px at 20% 90%, rgba(1,195,255,.18), transparent 55%),
              linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
  padding: 28px;
  border-right: 1px solid rgba(255,255,255,.06);
}

.sub-left-inner{ height:100%; display:flex; flex-direction:column; gap:14px; justify-content:center; }

.sub-icon{
  width:54px; height:54px; border-radius:16px;
  background: rgba(255,255,255,.08);
  display:flex; align-items:center; justify-content:center;
  color:#fff; font-size:26px;
}

.sub-left-title{ margin:0; color:#fff; font-size:26px; font-weight:800; }
.sub-left-sub{ margin:0; color: rgba(255,255,255,.75); line-height:1.4; }

.sub-badges{ display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
.badge{
  display:inline-flex; align-items:center; gap:8px;
  padding:10px 12px; border-radius: 999px;
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.88);
  font-size: 13px;
}

.sub-right{ padding: 28px; background: rgba(255,255,255,.02); }
.sub-title{ margin:0 0 8px 0; color:#fff; font-size:20px; font-weight:800; }
.sub-desc{ margin:0 0 18px 0; color: rgba(255,255,255,.75); line-height:1.5; }

.sub-steps{ display:grid; gap:12px; margin-bottom:18px; }
.step{
  display:flex; gap:12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.06);
}
.n{
  width:34px; height:34px; border-radius: 12px;
  background: rgba(124,194,66,.18);
  color:#fff;
  display:flex; align-items:center; justify-content:center;
  font-weight:800;
}
.txt .t{ margin:0; color:#fff; font-weight:700; }
.txt .d{ margin:2px 0 0 0; color: rgba(255,255,255,.72); font-size: 13px; }

.sub-keybox{
  margin-top: 6px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
}
.sub-label{ display:block; margin-bottom: 8px; color: rgba(255,255,255,.85); font-weight:700; }
.sub-input-row{ display:flex; gap:10px; }
.sub-input{
  flex:1;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.25);
  color:#fff;
  padding: 0 12px;
  outline:none;
}
.sub-input::placeholder{ color: rgba(255,255,255,.40); }

.sub-btn{
  height:44px;
  padding: 0 14px;
  border:0;
  border-radius: 12px;
  cursor:pointer;
  background: rgba(124,194,66,.95);
  color:#0b1220;
  font-weight:900;
  display:inline-flex;
  align-items:center;
  gap:8px;
}
.sub-btn:disabled{ opacity:.55; cursor:not-allowed; }

.sub-error, .sub-success{
  margin:10px 0 0 0;
  display:flex; align-items:center; gap:8px;
  font-size: 13px;
}
.sub-error{ color: #ffb3b3; }
.sub-success{ color: #bff7c0; }

.sub-divider{
  height:1px; background: rgba(255,255,255,.08);
  margin: 16px 0;
}

.sub-cta{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  height:48px;
  border-radius: 14px;
  text-decoration:none;
  font-weight:900;
  letter-spacing:.5px;
  background: rgba(1,195,255,.95);
  color:#06101a;
}
.sub-foot{ margin:10px 0 0 0; text-align:center; color: rgba(255,255,255,.55); font-size: 13px; }

@media (max-width: 860px){
  .sub-wrap{ grid-template-columns: 1fr; }
  .sub-left{ border-right:0; border-bottom: 1px solid rgba(255,255,255,.06); }
}

/* Animations */
.fade-enter-active, .fade-leave-active{ transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to{ opacity:0; }

.pop-enter-active{ transition: transform .22s ease, opacity .22s ease; }
.pop-enter-from{ transform: translateY(10px) scale(.985); opacity:0; }
.pop-leave-active{ transition: transform .18s ease, opacity .18s ease; }
.pop-leave-to{ transform: translateY(8px) scale(.99); opacity:0; }
</style>
