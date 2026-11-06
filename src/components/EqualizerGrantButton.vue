<template>
  <button
    class="btn-eq"
    :class="liberado ? 'eq-on' : 'eq-off'"
    :disabled="ocupado"
    @click="alternar"
  >
    <span class="eq-dot" />
    {{ ocupado ? 'Aguarde…' : (liberado ? '🎚 Equalizador 30d' : '🎚 Liberar equalizador') }}
  </button>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { db } from '@/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useToast } from 'vue-toast-notification'
import { dateMillis } from '@/utils/access-policy.mjs'

// Adicional do equalizador por conta. Cada liberação dá 30 dias.
export const EQUALIZER_GRANT_DAYS = 30

const props = defineProps({
  uid: { type: String, required: true },
  nome: { type: String, default: '' },
})

const toast = useToast()
const grant = ref(null)
const ocupado = ref(false)

const liberado = computed(() => {
  const atual = grant.value
  if (!atual?.active) return false
  if (atual.lifetime === true) return true
  return dateMillis(atual.endAt) > Date.now()
})

async function carregar() {
  grant.value = null
  if (!props.uid) return
  try {
    const snap = await getDoc(doc(db, 'users', props.uid, 'addons', 'equalizer'))
    grant.value = snap.exists() ? snap.data() : null
  } catch (err) {
    console.error('[Equalizador] não foi possível ler o adicional', err?.code, err?.message)
  }
}

async function alternar() {
  if (ocupado.value) return
  const alvo = !liberado.value
  const quem = props.nome || props.uid
  const pergunta = alvo
    ? `Liberar o equalizador para ${quem} por ${EQUALIZER_GRANT_DAYS} dias?`
    : `Revogar o equalizador de ${quem}? A assinatura de músicas continua funcionando.`
  if (!window.confirm(pergunta)) return

  ocupado.value = true
  try {
    const ref = doc(db, 'users', props.uid, 'addons', 'equalizer')
    if (alvo) {
      // Sempre 30 dias a partir de agora: o vencimento anterior não é somado.
      await setDoc(ref, {
        feature: 'equalizer',
        active: true,
        lifetime: false,
        endAt: new Date(Date.now() + EQUALIZER_GRANT_DAYS * 24 * 60 * 60 * 1000),
        grantedAt: serverTimestamp(),
        keyId: 'admin',
        receiptId: `admin_${props.uid}`,
      }, { merge: true })
      toast.success(`Equalizador liberado por ${EQUALIZER_GRANT_DAYS} dias para ${quem}.`)
    } else {
      await setDoc(ref, { active: false }, { merge: true })
      toast.info(`Equalizador revogado de ${quem}.`)
    }
    await carregar()
  } catch (err) {
    console.error('[Equalizador] falha ao gravar o adicional', err?.code, err?.message)
    toast.error(err?.code === 'permission-denied'
      ? 'O Firebase negou a gravação. Confira o papel admin da conta e as regras publicadas.'
      : 'Não foi possível alterar o equalizador desta conta.')
  } finally {
    ocupado.value = false
  }
}

onMounted(carregar)
watch(() => props.uid, carregar)
</script>

<style scoped>
.btn-eq {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #41624a;
  background: #1a2b1f;
  color: #cbebd6;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-eq:disabled { opacity: .6; cursor: not-allowed; }
.btn-eq.eq-on { border-color: #6f8fd6; color: #cfe0ff; background: #1a2438; }
.btn-eq.eq-off:hover { border-color: #7fb894; color: #e6fff0; }
.eq-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #7f8f86;
  flex-shrink: 0;
}
.btn-eq.eq-on .eq-dot { background: #7ea2ff; box-shadow: 0 0 8px #7ea2ff; }
</style>
