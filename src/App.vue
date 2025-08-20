<template>
  <v-app>
    <transition name="fade" mode="out-in">
      <div v-if="!isLoaded" key="preloader">
        <Preloader />
      </div>
      <div v-else key="content">
        <router-view />
      </div>
    </transition>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from "vue";

const isLoaded = ref(false);

onMounted(() => {
  document.onreadystatechange = () => {
    if (document.readyState === "complete") {
      setTimeout(() => {
        isLoaded.value = true;
      }, 3000); // tempo do preloader
    }
  };
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
