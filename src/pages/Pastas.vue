<template><MusicExplorer mode="genres" heading="Gêneros"/></template>
<script setup>
import MusicExplorer from '@/components/MusicExplorer.vue'
import {useRoute} from 'vue-router'
const route=useRoute()
</script>
