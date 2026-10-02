<template><MusicExplorer mode="all" heading="Todas as músicas"/></template>
<script setup>
import MusicExplorer from '@/components/MusicExplorer.vue'
import {useRoute} from 'vue-router'
const route=useRoute()
</script>
