<template><v-app><a class="skip-link" href="#main-content">Ir para o conteúdo</a><HeaderNav/><main id="main-content" tabindex="-1"><router-view/></main><FooterComplete/><MusicPlayer/></v-app></template>
<script setup>
import HeaderNav from '@/components/HeaderNav.vue'
import FooterComplete from '@/components/footerComplete.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'
</script>
