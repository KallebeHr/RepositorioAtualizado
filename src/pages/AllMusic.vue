<template><div class='legacy-music-home'><CentraDeBuscas/><Autoscroll/><MusicasAleatorias/><TopMusicas/><Autoscroll/><TopCantores/></div></template>
<script setup>
import CentraDeBuscas from '@/components/CentraDeBuscas.vue'
import Autoscroll from '@/components/autoscroll.vue'
import MusicasAleatorias from '@/components/MusicasAleatorias.vue'
import TopMusicas from '@/components/TopMusicas.vue'
import TopCantores from '@/components/TopCantores.vue'
</script>
<style scoped>.legacy-music-home{display:flex;align-items:center;flex-direction:column;background:#111;min-height:100vh}.legacy-music-home>:deep(*){max-width:100%}</style>