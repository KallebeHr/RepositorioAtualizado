<template>
  <div class='container'>
    <MusicList style="background-color: 121212;" />
  </div>
</template>

<script setup>
import MusicList from '@/components/MusicList.vue';

</script>

<style scoped>
.container{
    display:flex;
    background-color: #121212;
    min-height: 200vh;

    }
</style>