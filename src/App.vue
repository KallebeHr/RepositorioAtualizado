<template><v-app><a class="skip-link" href="#main-content">Ir para o conteúdo</a><HeaderNav/><main id="main-content" tabindex="-1"><router-view/></main><footer class="site-footer"><p>Repertório Atualizado</p><router-link to="/Tutoriais">Ajuda para ouvir, ativar e baixar</router-link><router-link to="/Conta">Minha conta</router-link></footer><MusicPlayer/></v-app></template>
<script setup>
import HeaderNav from '@/components/HeaderNav.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'
</script>
