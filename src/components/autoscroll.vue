<template>
  <section class="z-10 pt-8 pb-8 relative">
    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-12">

      </div>

      <!-- Container -->
      <div
        class="overflow-hidden relative"
        :style="maskStyle"
      >
        <!-- Track -->
        <div class="ticker-track">
          <!-- Bloco A -->
          <div class="ticker-group">
            <span
              v-for="(brand, i) in brands"
              :key="'a-' + i"
              class="brand"
              :class="brand.class"
            >
              {{ brand.name }}
            </span>
          </div>

          <!-- Bloco B (clone) -->
          <div class="ticker-group">
            <span
              v-for="(brand, i) in brands"
              :key="'b-' + i"
              class="brand"
              :class="brand.class"
            >
              {{ brand.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const brands = [
  { name: 'Forro antigos', class: 'font-bold' },
  { name: 'Rey Vaqueiro', class: 'font-semibold' },
  { name: 'Natanzinho Lima', class: 'font-normal' },
  { name: 'Safadão', class: 'font-semibold' },
  { name: 'Passagens de som', class: 'font-normal' }
]

const maskStyle = `
  mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
`
</script>

<style scoped>
@keyframes ticker {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

/* TRACK PRINCIPAL */
.ticker-track {
  display: flex;
  width: 200%;
  animation: ticker 35s linear infinite;
}

/* PAUSA NO HOVER */
.ticker-track:hover {
  animation-play-state: paused;
}

/* CADA METADE */
.ticker-group {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: space-around;
  white-space: nowrap;
}

/* ITEM */
.brand {
  font-size: 1.125rem;
  color: #a1a1aa;
  transition: color 0.3s;
}

.brand:hover {
  color: white;
}
</style>
