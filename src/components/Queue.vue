<template>
  <div class="queue">
    <h3>Fila</h3>
    <ul>
      <li
        v-for="(music, index) in player.queue"
        :key="music.fileId"
        :class="{ active: index === player.currentIndex }"
        @click="player.playMusic(music)"
      >
        {{ music.title }} - {{ music.cantor }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { usePlayerStore } from "@/stores/usePlayerStore"
const player = usePlayerStore()
</script>

<style scoped>
.queue { padding: 20px; color: #fff; }
ul { list-style: none; padding: 0; }
li { padding: 6px; cursor: pointer; }
li.active { color: #1db954; font-weight: bold; }
</style>
