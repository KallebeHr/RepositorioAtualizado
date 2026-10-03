<template>
  <section class="music-start-root">
    <div class="music-start-container">
      <header class="music-header">
        <h1 v-if="!userStore.loadingUser">Olá, {{ userStore.user?.name || userStore.user?.firstName || 'visitante' }}</h1>
        <h1 v-else>Olá...</h1>
          <div class="subti">
            <span class="subtitle">AS 56 MÚSICAS MAIS TOCADAS PARA VOCÊ COMEÇAR</span>  
<button class="Documents-btn">
  <span class="folderContainer">
    <svg
      class="fileBack"
      width="146"
      height="113"
      viewBox="0 0 146 113"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 4C0 1.79086 1.79086 0 4 0H50.3802C51.8285 0 53.2056 0.627965 54.1553 1.72142L64.3303 13.4371C65.2799 14.5306 66.657 15.1585 68.1053 15.1585H141.509C143.718 15.1585 145.509 16.9494 145.509 19.1585V109C145.509 111.209 143.718 113 141.509 113H3.99999C1.79085 113 0 111.209 0 109V4Z"
        fill="url(#paint0_linear_117_4)"
      ></path>
      <defs>
        <linearGradient
          id="paint0_linear_117_4"
          x1="0"
          y1="0"
          x2="72.93"
          y2="95.4804"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#8F88C2"></stop>
          <stop offset="1" stop-color="#5C52A2"></stop>
        </linearGradient>
      </defs>
    </svg>
    <svg
      class="filePage"
      width="88"
      height="99"
      viewBox="0 0 88 99"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="88" height="99" fill="url(#paint0_linear_117_6)"></rect>
      <defs>
        <linearGradient
          id="paint0_linear_117_6"
          x1="0"
          y1="0"
          x2="81"
          y2="160.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="white"></stop>
          <stop offset="1" stop-color="#686868"></stop>
        </linearGradient>
      </defs>
    </svg>

    <svg
      class="fileFront"
      width="160"
      height="79"
      viewBox="0 0 160 79"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.29306 12.2478C0.133905 9.38186 2.41499 6.97059 5.28537 6.97059H30.419H58.1902C59.5751 6.97059 60.9288 6.55982 62.0802 5.79025L68.977 1.18034C70.1283 0.410771 71.482 0 72.8669 0H77H155.462C157.87 0 159.733 2.1129 159.43 4.50232L150.443 75.5023C150.19 77.5013 148.489 79 146.474 79H7.78403C5.66106 79 3.9079 77.3415 3.79019 75.2218L0.29306 12.2478Z"
        fill="url(#paint0_linear_117_5)"
      ></path>
      <defs>
        <linearGradient
          id="paint0_linear_117_5"
          x1="38.7619"
          y1="8.71323"
          x2="66.9106"
          y2="82.8317"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#C3BBFF"></stop>
          <stop offset="1" stop-color="#51469A"></stop>
        </linearGradient>
      </defs>
    </svg>
  </span>
  <p class="text"><router-link to="/Pastas" class="texte">Clique aqui para ver todas as Pastas</router-link></p>
</button>

          </div>

        <div class="hint-row">
          
          <p class="indicador">Arraste para o lado</p>
          <i class="mdi mdi-chevron-right"></i>
        </div>
      </header>

      <Swiper
        class="music-swiper"
        :slides-per-view="1"
        :space-between="12"
        :breakpoints="{
          768: { slidesPerView: 2 },
          1200: { slidesPerView: 3 }
        }"
        :modules="[Pagination, Navigation]"
        :pagination="{ clickable: true }"
        navigation
      >
        <SwiperSlide v-for="(page, index) in pages" :key="index">
          <ul class="music-list">
            <li
              v-for="m in page"
              :key="m.id"
              class="music-row"
              @click="handleCardTap(m)"
            >
              <!-- CAPA -->
              <div class="left">
                <div class="cover-wrapper">
                  <img :src="m.cover || '/LogoMusic.jpg'" class="cover" />
                  <span class="mdi mdi-play play-icon"></span>
                </div>
              </div>

              <!-- INFO -->
              <div class="center">
                <p class="title">{{ m.title }}</p>
                <p class="artist">{{ m.artist }}</p>
              </div>

              <!-- AÇÕES (SÓ DESKTOP) -->
              <div class="right">
                <button
                  class="icon-btn"
                  :class="{ active: isFavorite(m.id) }"
                  @click.stop="toggleFavorite(m)"
                  aria-label="Favoritar"
                >
                  <span class="mdi mdi-heart"></span>
                </button>

                <button class="icon-btn" @click.stop="downloadMusic(m)" aria-label="Baixar">
                  <span class="mdi mdi-download"></span>
                </button>

                <button class="icon-btn" @click.stop="addToQueue(m)" aria-label="Adicionar à fila">
                  <span class="mdi mdi-playlist-plus"></span>
                </button>
              </div>
            </li>
          </ul>
        </SwiperSlide>
      </Swiper>
    </div>

    <!-- BOTÃO FLUTUANTE (EQUALIZADOR) -->
    <button
      class="eq-fab"
      :class="{ on: eqEnabled }"
      @click="toggleEqUI"
      aria-label="Abrir equalizador"
      title="Equalizador"
    >
      <span class="mdi mdi-tune-vertical"></span>
    </button>

    <!-- UI DO EQUALIZADOR -->
    

    <!-- MODAL ASSINATURA -->
    
  </section>
</template>
<script setup>
import {computed,ref,nextTick} from 'vue'
import {useLegacyMusic} from '@/composables/useLegacyMusic'
import {Swiper,SwiperSlide} from 'swiper/vue'
import {Pagination,Navigation} from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
const {tracks,player,userStore,play:playMusic,addQueue:addToQueue,download:downloadMusic,isFavorite,toggleFavorite,showSubModal,modalRef,ctaLink,closeSubModal}=useLegacyMusic()
const musicas=computed(()=>[...tracks.value].sort((a,b)=>(b.plays || b.playCount || 0)-(a.plays || a.playCount || 0)).slice(0,56).map(t=>({...t,artist:t.cantor,cover:t.coverUrl})))
const pages=computed(()=>{const p=[];for(let i=0;i<musicas.value.length;i+=8)p.push(musicas.value.slice(i,i+8));return p})
const handleCardTap=playMusic
const eqUIOpen=ref(false),eqPanelRef=ref(null),amEl=ref(null),bands=computed(()=>player.eq.bands.map(b=>({...b,label:b.key}))),eqEnabled=computed({get:()=>player.eq.enabled,set:v=>player.eqSetEnabled(v)})
function toggleEqUI(){window.dispatchEvent(new Event('repertorio:player-settings'))}
function applyEqEnabled(){player.eqSetEnabled(eqEnabled.value)}
function onBandChange(){for(const b of bands.value)player.eqSetBandGain(b.key,b.gain)}
function resetEq(){player.eqReset()}
function formatDb(v){return Number(v).toFixed(1)}
function applyPreset(name){const gains=name==='bass'?[6,4,1,-1,-1,0]:name==='vocal'?[-2,-1,2,4,3,1]:[0,-1,-1,1,3,5];player.eq.bands.forEach((b,i)=>player.eqSetBandGain(b.key,gains[i]))}
</script>
<style scoped>
/* ======================
        LAYOUT
====================== */
.music-start-root {
  width: 100%;
  background: #111;
}

.music-start-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
}

/* HEADER */
.music-header { margin-bottom: 24px; }
.music-header h1 { font-size: 1rem; font-weight: 800; }
.subti{
  display: flex;
  flex-direction: column;
}
.subtitle {
  font-size: 12px;
  letter-spacing: 0.14em;
  color: #94a3b8;
  font-weight: 700;
}

.hint-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

.indicador { font-size: 0.85rem; color: #777; text-align: center; }
.hint-row .mdi { font-size: 22px; opacity: 0.8; }

/* ======================
        LISTA
====================== */
.music-list {
  width: 100%;
  max-width: 380px;
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.music-row {
  position: relative;
  display: flex;
  align-items: center;
  height: 76px;
  padding: 0 12px;
  border-radius: 14px;
  background: #0f0f0f;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.music-row:hover { background: #171717; transform: translateY(-1px); }

.cover-wrapper { width: 54px; height: 54px; position: relative; }
.cover { width: 54px; height: 54px; border-radius: 10px; object-fit: cover; }

.play-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}
.music-row:hover .play-icon { opacity: 1; }

.center { flex: 1; min-width: 0; margin-left: 12px; }
.title {
  font-size: 14px;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.artist {
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 6px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
@media (hover: hover) and (pointer: fine) {
  .music-row:hover .right { opacity: 1; pointer-events: auto; }
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: #aaa;
  cursor: pointer;
  transition: transform 0.15s, color 0.15s, background 0.15s;
}
.icon-btn:hover {
  color: #fff;
  background: rgba(0, 0, 0, 0.65);
  transform: translateY(-1px);
}
.icon-btn.active { color: #ff4d6d; }

@keyframes swipe-hint {
  0% { transform: translateX(0); }
  50% { transform: translateX(-10px); }
  100% { transform: translateX(0); }
}
.music-swiper { animation: swipe-hint 1.5s ease-in-out 2; }

@media (max-width: 640px) {
  .music-start-container { padding: 20px; }
  .right { display: none; }
}

/* ======================
   FLOATING EQ BUTTON
====================== */
.eq-fab {
  position: fixed;
  right: 18px;
  bottom: 10rem;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 15, 15, 0.78);
  backdrop-filter: blur(10px);
  color: #fff;
  display: grid;
  place-items: center;
  z-index: 9998;
  cursor: pointer;
  box-shadow: 0 18px 50px rgba(0,0,0,0.45);
  transition: transform 0.18s ease, background 0.18s ease, border 0.18s ease;
}
.eq-fab .mdi { font-size: 26px; }
.eq-fab:hover { transform: translateY(-2px); }
.eq-fab.on {
  border-color: rgba(0, 207, 208, 0.55);
  background: rgba(0, 207, 208, 0.16);
}

/* ======================
        EQ MODAL (FODÃO)
====================== */
.eq-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(1200px 600px at 50% 10%, rgba(0,207,208,0.12), transparent 55%),
              rgba(0,0,0,0.72);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 9999;
}

.eq-panel {
  width: min(1040px, 100%);
  max-height: calc(100vh - 24px);
  background: rgba(10,10,12,0.92);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 26px;
  overflow: hidden;
  outline: none;
  box-shadow: 0 40px 120px rgba(0,0,0,0.65);
  backdrop-filter: blur(10px);
}

/* header fixo + corpo scroll */
.eq-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: radial-gradient(900px 260px at 12% -40%, rgba(0,207,208,0.22), transparent 60%),
              rgba(10,10,12,0.96);
}

.eq-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
/* From Uiverse.io by vinodjangid07 */ 
.Documents-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: fit-content;
  height: 45px;
  border: none;
  padding: 0px 15px;
  border-radius: 5px;
  background-color: rgb(49, 49, 83);
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s;
}
.folderContainer {
  width: 40px;
  height: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}
.fileBack {
  z-index: 1;
  width: 80%;
  height: auto;
}
.filePage {
  width: 50%;
  height: auto;
  position: absolute;
  z-index: 2;
  transition: all 0.3s ease-out;
}
.fileFront {
  width: 85%;
  height: auto;
  position: absolute;
  z-index: 3;
  opacity: 0.95;
  transform-origin: bottom;
  transition: all 0.3s ease-out;
}
.text {
  color: white;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.texte{
  text-decoration: none;

}
.Documents-btn:hover .filePage {
  transform: translateY(-5px);
}
.Documents-btn:hover {
  background-color: rgb(58, 58, 94);
}
.Documents-btn:active {
  transform: scale(0.95);
}
.Documents-btn:hover .fileFront {
  transform: rotateX(30deg);
}

.eq-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  font-weight: 950;
  letter-spacing: 0.10em;
  font-size: 11px;
}
.eq-badge .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6b7280;
  box-shadow: 0 0 0 7px rgba(255,255,255,0.03);
}
.eq-badge.on .dot {
  background: #00cfd0;
  box-shadow: 0 0 0 7px rgba(0,207,208,0.18);
}

.eq-close {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.15s ease, background 0.15s ease;
}
.eq-close:hover { transform: translateY(-1px); background: rgba(255,255,255,0.09); }
.eq-close .mdi { font-size: 20px; }

.eq-sub {
  margin: 10px 0 0;
  color: rgba(255,255,255,0.72);
  font-weight: 650;
  line-height: 1.5;
  font-size: 13px;
}

/* SCROLL */
.eq-scroll {
  max-height: calc(100vh - 160px);
  overflow: auto;
  padding: 16px 16px 0;
}
.eq-scroll::-webkit-scrollbar { width: 10px; }
.eq-scroll::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border-radius: 999px;
}
.eq-scroll::-webkit-scrollbar-track { background: transparent; }

.eq-footer-space { height: 18px; }

/* HERO layout */
.eq-hero{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items: start;
}

@media (max-width: 900px){
  .eq-hero{ grid-template-columns: 1fr; }
}

/* ======================
   VISUALIZER CIRCULAR
====================== */
.am-card{
  padding: 14px;
  border-radius: 20px;
  background:
    radial-gradient(900px 300px at 20% -60%, rgba(0,207,208,0.22), transparent 60%),
    rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
}

.am-ring{
  position: relative;
  width: min(360px, 100%);
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 999px;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.07), rgba(0,0,0,0.60));
  box-shadow:
    0 30px 90px rgba(0,0,0,0.60),
    inset 0 0 0 2px rgba(255,255,255,0.10),
    inset 0 0 60px rgba(0,207,208,0.10);
}

.am-canvas{ width: 100%; height: 100%; }
.am-canvas canvas{
  width: 100% !important;
  height: 100% !important;
  display:block;
}

.am-center{
  position:absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  width: 44%;
  height: 44%;
  border-radius: 999px;
  display:grid;
  place-items:center;
  text-align:center;
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.18), rgba(0,0,0,0.86));
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: inset 0 0 28px rgba(0,0,0,0.62);
  pointer-events:none;
}

.am-center-dot{
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: rgba(107,114,128,0.9);
  box-shadow: 0 0 0 12px rgba(255,255,255,0.05);
  margin-bottom: 6px;
}
.am-center-dot.on{
  background: rgba(0,207,208,0.95);
  box-shadow: 0 0 0 12px rgba(0,207,208,0.12);
}

.am-center-title{
  margin:0;
  font-weight: 950;
  letter-spacing: .18em;
  font-size: 12px;
  opacity: .95;
}
.am-center-sub{
  margin:2px 0 0;
  font-weight: 850;
  font-size: 11px;
  opacity: .70;
}

.am-hint{
  margin-top: 12px;
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
}
.am-hint .mdi{ font-size: 18px; margin-top: 1px; }
.am-hint p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
   CONTROLE RÁPIDO (CARD)
====================== */
.eq-control-card{
  padding: 14px;
  border-radius: 20px;
  background:
    radial-gradient(800px 260px at 20% -60%, rgba(255,255,255,0.08), transparent 60%),
    rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
}

.eq-control-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap: 12px;
  margin-bottom: 12px;
}

.eq-control-title .t{
  margin:0;
  font-weight: 950;
  letter-spacing: -0.01em;
  font-size: 16px;
}
.eq-control-title .d{
  margin: 4px 0 0;
  color: rgba(255,255,255,0.65);
  font-weight: 650;
  font-size: 13px;
}

/* switch futurista */
.switch { position: relative; width: 52px; height: 30px; }
.switch input { display:none; }
.slider{
  position:absolute;
  inset:0;
  border-radius:999px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.14);
  transition: background .16s ease;
}
.slider::after{
  content:"";
  position:absolute;
  top:50%;
  left:4px;
  width: 22px;
  height: 22px;
  border-radius:999px;
  background:#fff;
  transform: translateY(-50%);
  transition: left .16s ease, background .16s ease;
  box-shadow: 0 10px 28px rgba(0,0,0,0.45);
}
.switch input:checked + .slider{
  background: rgba(0,207,208,0.34);
}
.switch input:checked + .slider::after{
  left: 26px;
  background: #00cfd0;
}

/* presets */
.eq-presets{
  display:flex;
  flex-wrap:wrap;
  gap: 10px;
  margin: 10px 0 12px;
}

.pill{
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
  cursor: pointer;
  display:inline-flex;
  align-items:center;
  gap: 8px;
  transition: transform .15s ease, background .15s ease, border-color .15s ease;
}
.pill:hover{ transform: translateY(-1px); background: rgba(255,255,255,0.09); }
.pill:active{ transform: translateY(0) scale(0.98); }
.pill.primary{
  border-color: rgba(0,207,208,0.34);
  background: rgba(0,207,208,0.12);
}

.eq-mini-note{
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px;
  border-radius: 16px;
  background: rgba(0,207,208,0.08);
  border: 1px solid rgba(0,207,208,0.18);
  color: rgba(255,255,255,0.82);
}
.eq-mini-note .mdi{ font-size: 18px; margin-top: 1px; }
.eq-mini-note p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
   BANDS
====================== */
.eq-bands{
  margin-top: 14px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.09);
}

.eq-bands-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 12px;
  flex-wrap:wrap;
  margin-bottom: 10px;
}

.eq-h3{
  margin:0;
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.01em;
}
.eq-p{
  margin: 6px 0 0;
  color: rgba(255,255,255,0.66);
  font-weight: 650;
  font-size: 13px;
  line-height: 1.45;
}

.eq-chip{
  display:inline-flex;
  align-items:center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.78);
  font-weight: 800;
  font-size: 12px;
}

/* grid ultra responsivo */
.eq-sliders{
  display:grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

@media (max-width: 920px){
  .eq-sliders{ grid-template-columns: repeat(3, minmax(0,1fr)); }
}
@media (max-width: 520px){
  .eq-sliders{ grid-template-columns: repeat(2, minmax(0,1fr)); }
  .eq-scroll{ padding: 14px 12px 0; }
}

.band{
  position: relative;
  border-radius: 18px;
  padding: 12px 10px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.10);
  overflow:hidden;
}
.band::before{
  content:"";
  position:absolute;
  inset:-50px -80px auto;
  height: 160px;
  background: radial-gradient(240px 90px at 18% 55%, rgba(0,207,208,0.16), transparent 60%);
  pointer-events:none;
}

.band-top{
  position: relative;
  z-index: 1;
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.hz{
  margin:0;
  font-weight: 950;
  font-size: 12px;
  color: rgba(255,255,255,0.92);
}
.db{
  margin:0;
  font-weight: 950;
  font-size: 12px;
  color: rgba(0,207,208,0.95);
}

.range-wrap{
  position: relative;
  z-index: 1;
}
.range{ width: 100%; }
.range-glow{
  --p: .5;
  position:absolute;
  inset: -6px -6px -10px -6px;
  border-radius: 16px;
  background: radial-gradient(220px 120px at 50% 50%, rgba(0,207,208,0.18), transparent 60%);
  opacity: calc(0.25 + var(--p) * 0.45);
  filter: blur(10px);
  pointer-events:none;
}

.band-hint{
  position: relative;
  z-index: 1;
  margin: 8px 0 0;
  font-size: 12px;
  opacity: 0.70;
  text-align:center;
  font-weight: 800;
}

/* info note */
.eq-note{
  margin-top: 8rem;
  display:flex;
  gap:10px;
  align-items:flex-start;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.72);
}
.eq-note .mdi{ font-size: 18px; margin-top: 2px; }
.eq-note p{ margin:0; font-weight:650; line-height:1.45; font-size: 13px; }

/* ======================
        MODAL ASSINATURA (igual seu)
====================== */
.sub-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999;
}

.sub-modal {
  width: min(980px, 100%);
  min-height: 360px;
  background: #fff;
  border-radius: 22px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 340px 1fr;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.45);
  position: relative;
  outline: none;
}

.sub-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: grid;
  place-items: center;
}
.sub-close .mdi { font-size: 20px; }

.sub-left {
  background: #00cfd0;
  display: grid;
  place-items: center;
  padding: 28px;
}

.sub-left-inner { text-align: center; color: #fff; }

.sub-icon {
  width: 86px;
  height: 86px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.18);
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
}
.sub-icon .mdi { font-size: 44px; }

.sub-left-title {
  font-size: 30px;
  line-height: 1.1;
  margin: 0 0 10px;
  font-weight: 850;
  letter-spacing: -0.02em;
}
.sub-left-sub { margin: 0; opacity: 0.95; font-weight: 600; }

.sub-right { padding: 34px 34px 26px; color: #111; }

.sub-title {
  margin: 0 0 10px;
  font-size: 30px;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.sub-desc {
  margin: 0 0 18px;
  color: #4b5563;
  font-weight: 600;
  line-height: 1.55;
}

.sub-steps { display: grid; gap: 14px; margin-bottom: 22px; }

.step {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  align-items: start;
}
.step .n {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #00cfd0;
  color: #fff;
  font-weight: 900;
  display: grid;
  place-items: center;
}
.step .t { margin: 0; font-weight: 850; color: #111; }
.step .d { margin: 2px 0 0; color: #6b7280; font-weight: 600; }

.sub-cta {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 999px;
  background: #00cfd0;
  color: #111;
  text-decoration: none;
  font-weight: 900;
  letter-spacing: 0.08em;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s, filter 0.15s;
}
.sub-cta:hover { transform: translateY(-1px); filter: brightness(0.98); }
.sub-cta .mdi { font-size: 22px; }

.sub-foot {
  margin: 14px 0 0;
  text-align: center;
  color: #9ca3af;
  font-weight: 650;
}

@media (max-width: 860px) {
  .sub-modal { grid-template-columns: 1fr; }
  .sub-left { padding: 22px; }
}

/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.pop-enter-active,
.pop-leave-active { transition: transform 0.18s ease, opacity 0.18s ease; }
.pop-enter-from,
.pop-leave-to { transform: translateY(10px) scale(0.985); opacity: 0; }
</style>
