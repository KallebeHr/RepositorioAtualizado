<template>
  <!-- Modal automático (NÃO bloqueia o site, pode fechar) -->
  <v-dialog v-model="assinaturaModal" max-width="420px">
    <v-card>
      <v-card-title>🔑 Ativar Assinatura</v-card-title>

      <v-card-text>
        <p style="margin:0 0 10px; opacity:.85">
          Sua assinatura está inativa ou expirou. Ative para liberar todos os recursos.
        </p>

        <v-text-field
          v-model="chaveAssinatura"
          label="Digite sua chave"
          outlined
          dense
          @keyup.enter="ativarAssinatura"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="assinaturaModal = false">Agora não</v-btn>
        <v-btn color="primary" :loading="loadingAtivar" @click="ativarAssinatura">
          Ativar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { redeemAccessKey } from '@/services/access-keys'
import { useToast } from 'vue-toast-notification'
const user = useUserStore(), $toast=useToast(), assinaturaModal=ref(false), chaveAssinatura=ref(''), loadingAtivar=ref(false)
watch(() => [user.user?.uid,user.loadingUser,user.hasActiveSubscription], () => {
 if(user.loadingUser || !user.user || user.hasActiveSubscription || !navigator.onLine)return
 const key='repertorio:subscription-modal:'+user.user.uid, today=new Date().toISOString().slice(0,10)
 try { if(localStorage.getItem(key)===today)return;localStorage.setItem(key,today) } catch {}
 assinaturaModal.value=true
},{immediate:true})
async function ativarAssinatura(){if(loadingAtivar.value)return;loadingAtivar.value=true;try{await redeemAccessKey(chaveAssinatura.value);await user.refresh();assinaturaModal.value=false;chaveAssinatura.value='';$toast.success('Acesso ativado!')}catch(e){$toast.error(e.message)}finally{loadingAtivar.value=false}}
</script>
