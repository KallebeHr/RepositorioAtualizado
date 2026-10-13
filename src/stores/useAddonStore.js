import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { useUserStore } from './userStore'
import { canUseEqualizer } from '@/utils/addon-policy.mjs'
import { redeemEqualizerKey } from '@/services/equalizer-keys'

export const useAddonStore = defineStore('addons', () => {
  const user = useUserStore(), owner = ref(''), grant = ref(null), verified = ref(false)
  const activationOpen = ref(false), busy = ref(false), error = ref(''), notice = ref(''), clock = ref(Date.now())
  let unsubscribe, generation = 0
  setInterval(() => { clock.value = Date.now() }, 15000)
  watch(() => user.user?.uid, uid => {
    const run = ++generation
    unsubscribe?.(); owner.value = uid || ''; grant.value = null; verified.value = false
    activationOpen.value = false; busy.value = false; error.value = ''; notice.value = ''
    if (!uid) return
    unsubscribe = onSnapshot(doc(db, 'users', uid, 'addons', 'equalizer'), { includeMetadataChanges: true }, snap => {
      if (run !== generation) return
      // Nunca trate uma escrita local pendente como liberação do servidor.
      if (snap.metadata.hasPendingWrites || snap.metadata.fromCache) return
      clock.value = Date.now()
      grant.value = snap.exists() ? snap.data() : null; verified.value = true; error.value = ''
    }, () => { if (run === generation) { verified.value = false; grant.value = null; error.value = 'Não foi possível verificar o adicional. Confira sua conexão ou fale com o suporte.' } })
  }, { immediate: true })
  const canEqualize = computed(() => owner.value === user.user?.uid && canUseEqualizer(user.user, grant.value, verified.value, clock.value))
  function requireEqualizer() {
    if (canEqualize.value) return true
    if (!activationOpen.value) { error.value = ''; notice.value = '' }
    activationOpen.value = true
    return false
  }
  async function activate(code) {
    if (busy.value) return
    const uid = owner.value, run = generation
    busy.value = true; error.value = ''; notice.value = ''
    try {
      await redeemEqualizerKey(code)
      if (run === generation && uid === user.user?.uid) notice.value = 'Código aceito. Confirmando a liberação…'
    } catch (e) {
      if (run === generation) error.value = e.code === 'permission-denied' ? 'Não foi possível ativar. Confira a assinatura, o código e as regras do Firebase com o suporte.' : e.message
    } finally { if (run === generation) busy.value = false }
  }
  watch(canEqualize, allowed => { if (allowed) { notice.value = 'Equalizador ativado para sua conta.'; activationOpen.value = false } })
  return { owner, grant, verified, canEqualize, activationOpen, busy, error, notice, requireEqualizer, activate }
})
