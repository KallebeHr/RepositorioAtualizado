<template>
  <div class='container'>
    <CentraDeBuscas />
    <MusicasAleatorias />
    <!-- <MusicList style="background-color: 121212;" /> -->
    <TopMusicas />
    <TopCantores />
  </div>
</template>

<script setup>
import MusicList from '@/components/MusicList.vue';

</script>

<style scoped>

.container{
    display:flex;
    align-items: center;
    flex-direction: column;
  background: #111;

    min-height: 100vh;
    height: auto;  
  }
    
</style>