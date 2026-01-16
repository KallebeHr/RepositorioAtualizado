<template>
  <div class='container'>
    <CentraDeBuscas />
    <Autoscroll />
    <MusicasAleatorias />
    <!-- <MusicList style="background-color: 121212;" /> -->
    <TopMusicas />
    <Autoscroll />
    <TopCantores />
  </div>
</template>

<script setup>
import Autoscroll from '@/components/autoscroll.vue';
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