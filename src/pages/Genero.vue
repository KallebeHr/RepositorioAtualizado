<template><MusicExplorer mode="all" :heading="String(route.query.nome || route.query.mes || 'Catálogo')"/></template>
<script setup>
import MusicExplorer from '@/components/MusicExplorer.vue'
import {useRoute} from 'vue-router'
const route=useRoute()
</script>
