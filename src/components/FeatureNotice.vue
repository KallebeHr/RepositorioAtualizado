<template>
  <v-dialog :model-value="!!featureNotice" @update:model-value="value => { if (!value) featureNotice = '' }" max-width="480" :z-index="17000" aria-labelledby="feature-notice-title">
    <section class="release-notice">
      <button class="notice-close" @click="featureNotice = ''" aria-label="Fechar aviso"><i aria-hidden="true" class="mdi mdi-close"/></button>
      <span class="release-icon"><i aria-hidden="true" class="mdi" :class="featureNotice==='install'?'mdi-cellphone-arrow-down':'mdi-cloud-download-outline'"/></span>
      <span class="eyebrow">NOVIDADES CHEGANDO</span>
      <h2 id="feature-notice-title">{{ featureNotice==='install'?'Instalação do aplicativo':'Ouvir offline' }}</h2>
      <p>Este recurso será liberado em breve. Acompanhe as novidades do Repertório Atualizado!</p>
      <a :href="supportLink('Olá! Quero saber quando a instalação do app e o modo offline serão liberados.')" target="_blank" rel="noopener noreferrer">Conversar com o suporte <i aria-hidden="true" class="mdi mdi-whatsapp"/></a>
      <button class="notice-dismiss" @click="featureNotice = ''">Entendi</button>
    </section>
  </v-dialog>
</template>
<script setup>
import { featureNotice, supportLink } from '@/services/feature-release'
</script>
<style scoped>
.release-notice{position:relative;padding:32px 26px;text-align:center;border:1px solid #376b50;border-radius:24px;background:radial-gradient(ellipse at top,#204a34,#111e17 65%);color:#f3fbf6}.notice-close{position:absolute;right:12px;top:12px;min-width:44px;min-height:44px;border-radius:12px;background:#233d2e;color:white}.release-icon{display:grid;place-items:center;width:72px;height:72px;margin:8px auto 24px;background:#6de5a51a;border:1px solid #6de5a54d;border-radius:22px;font-size:36px;color:#87eeb7}.eyebrow{display:block;font-size:10px;letter-spacing:2px;color:#90e9b6}h2{font-size:26px;line-height:1.2;margin:12px 0}p{font-size:14px;line-height:1.7;color:#bed2c5;margin:18px 0 24px}a,.notice-dismiss{display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;border-radius:12px;padding:12px;text-decoration:none}a{color:#0f2a1a;background:#7aebb0;font-size:14px;font-weight:700}.notice-dismiss{width:100%;margin-top:10px;color:#c5d9cc;border:1px solid #345c43;font-size:13px}@media(max-width:400px){.release-notice{padding:28px 18px}h2{font-size:23px}}
</style>
