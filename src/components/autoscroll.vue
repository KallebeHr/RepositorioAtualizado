<template>
  <section class="ticker-section">
    <div class="max-w-7xl mx-auto px-4">

      <!-- VIEWPORT -->
      <div class="ticker-viewport" :style="maskStyle">
        <!-- TRACK -->
        <div class="ticker-track">
          <div class="ticker-group">
            <span v-for="(b, i) in brands" :key="'a' + i" class="brand">
              {{ b }}
            </span>
          </div>
          <div class="ticker-group">
            <span v-for="(b, i) in brands" :key="'b' + i" class="brand">
              {{ b }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const brands = [
  'Rey Vaqueiro',
  'Passagens de Som',
  'Forro Antigos',
  'Natanzinho Lima',
  'Reggaes',
  'Medio Alterados'
]

const maskStyle = `
  mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
`
</script>

<style scoped>
/* BLOQUEIA QUALQUER SCROLL */
.ticker-section {
  overflow-x: hidden;
}

/* TÍTULO */
.title {
  text-align: center;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: #a1a1aa;
  margin-bottom: 3rem;
  letter-spacing: 0.08em;
}

/* VIEWPORT PRECISA DE ALTURA */
.ticker-viewport {
  position: relative;
  overflow: hidden;
  width: 15rem;
  height: 48px; /* 🔥 ISSO É O QUE FALTAVA */
}

/* TRACK CENTRALIZADO */
.ticker-track {
  position: absolute;
  top: 50%;
  left: 0;
  display: flex;
  white-space: nowrap;
  transform: translateY(-50%);
  animation: ticker 10s linear infinite;
  will-change: transform;
}

/* PAUSA */
.ticker-track:hover {
  animation-play-state: paused;
}

/* GRUPOS */
.ticker-group {
  display: flex;
  gap: 4rem;
  padding-right: 4rem;
}

/* ITEM */
.brand {
  font-size: 1.125rem;
  color: #9ca3af;
  transition: color 0.3s;
}

.brand:hover {
  color: white;
}

/* ANIMAÇÃO */
@keyframes ticker {
  from {
    transform: translate(0, -50%);
  }
  to {
    transform: translate(-50%, -50%);
  }
}
</style>
