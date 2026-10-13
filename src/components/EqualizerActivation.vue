<template>
  <v-dialog v-model="addons.activationOpen" max-width="520" :z-index="16500" aria-labelledby="eq-activation-title">
    <section class="activation-panel">
      <header><span class="activation-icon"><i aria-hidden="true" class="mdi mdi-tune-vertical"/></span><button @click="addons.activationOpen=false" aria-label="Fechar ativação do equalizador"><i aria-hidden="true" class="mdi mdi-close"/></button></header>
      <span class="eyebrow">ADICIONAL DA SUA CONTA</span><h2 id="eq-activation-title">Ative seu equalizador</h2>
      <p>A mesa está aberta para você conhecer. Para ajustar as bandas e usar os efeitos, ative este adicional com o código fornecido pelo suporte.</p>
      <p class="price">R$ 5 a mais pelo adicional <span>Consulte as condições com o suporte.</span></p>
      <p v-if="!user.user" class="activation-status">Entre na sua conta para informar o código.</p>
      <p v-else-if="!user.hasActiveSubscription" class="activation-status">Sua assinatura precisa estar ativa antes de liberar o equalizador.</p>
      <form v-else @submit.prevent="addons.activate(code.trim())">
        <label for="equalizer-code">Código do equalizador</label>
        <input id="equalizer-code" v-model="code" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="120" placeholder="Cole o código fornecido pelo suporte" :disabled="addons.busy"/>
        <button class="activate-button" :disabled="addons.busy || code.trim().length<6">{{ addons.busy?'Validando código…':'Ativar equalizador' }}</button>
      </form>
      <p v-if="addons.error" role="alert" class="activation-error">{{ addons.error }}</p><p v-if="addons.notice" role="status" class="activation-status">{{ addons.notice }}</p>
      <router-link v-if="!user.user" to="/RegisterAndLogin?mode=login" @click="addons.activationOpen=false" class="support">Entrar na conta</router-link>
      <a :href="supportLink('Olá! Quero ativar o adicional do equalizador por R$ 5. Quais são as condições?')" target="_blank" rel="noopener noreferrer" class="support"><i aria-hidden="true" class="mdi mdi-whatsapp"/> Solicitar código ao suporte</a>
      <small>A liberação fica vinculada à sua conta. O código do equalizador é diferente da chave da assinatura.</small>
    </section>
  </v-dialog>
</template>
<script setup>
import { ref, watch } from 'vue'
import { useAddonStore } from '@/stores/useAddonStore'
import { useUserStore } from '@/stores/userStore'
import { supportLink } from '@/services/feature-release'
const addons=useAddonStore(),user=useUserStore(),code=ref('')
watch(()=>addons.owner,()=>{code.value=''})
</script>
<style scoped>
.activation-panel{padding:26px;background:linear-gradient(145deg,#213249,#101b29);border:1px solid #4d6987;border-radius:22px;color:#eef5ff;max-height:85dvh;overflow:auto}header{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}header button{min-width:44px;min-height:44px;border-radius:12px;background:#304056;color:#cfdef0}.activation-icon{display:grid;place-items:center;width:56px;height:56px;border-radius:16px;background:#92c6ff21;color:#b6d7ff;font-size:28px}.eyebrow{font-size:10px;letter-spacing:1.7px;color:#a0c6f2}h2{margin:10px 0;font-size:27px;line-height:1.2}p{font-size:14px;line-height:1.7;color:#bbcee4;margin:14px 0}.price{padding:13px;border:1px solid #536c8d;border-radius:12px;color:#dfecfc}.price span{display:block;font-size:11px;color:#a3bad4}label{font-size:13px;display:block;margin:18px 0 8px}input{width:100%;min-height:48px;border:1px solid #6b85a5;border-radius:10px;background:#101a28;color:white;padding:12px;font-size:14px}.activate-button{width:100%;min-height:46px;border-radius:10px;background:#afd2ff;color:#122945;font-weight:700;margin-top:12px}.activate-button:disabled{opacity:.5}.support{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;margin-top:14px;border:1px solid #4d6987;border-radius:10px;color:#d4e6ff;text-decoration:none;font-size:13px}small{display:block;line-height:1.6;color:#90a7c3;font-size:11px;margin-top:16px}.activation-error{color:#ffbcbc}.activation-status{color:#9bdac4}@media(max-width:420px){.activation-panel{padding:20px}h2{font-size:23px}}
</style>
