<template>
 <v-app class="repertorio-app">
  <HeaderNav />
  <AppInstall />
  <div class="app-content"><router-view /></div>
  <buttonW />
  <FooterComplete />
  <MusicPlayer />
  <GlobalEqualizer />
 </v-app>
</template>
<script setup>
import MusicPlayer from '@/components/MusicPlayer.vue'
import GlobalEqualizer from '@/components/GlobalEqualizer.vue'
import AppInstall from '@/components/AppInstall.vue'
</script>
<style>html,body,#app{background:#101010}.repertorio-app{background:#101010!important}.app-content{min-height:60vh;padding-bottom:100px}button:focus-visible,a:focus-visible{outline:2px solid #5ee4a0;outline-offset:3px}</style>
