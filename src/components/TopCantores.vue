<template>
  <section class="top-cantores-root">
    <div class="top-cantores">
      <header class="header">
        <h2>🔥 Top 10 Cantores 🔥</h2>
        <p>Os cantores mais baixados da plataforma</p>
        <p class="indicador">Arraste para o lado <i class="mdi mdi-chevron-right"></i></p>
      </header>

      <Swiper
        :slides-per-view="1"
        :space-between="12"
        :breakpoints="{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }"
        :modules="[Pagination, Navigation]"
        :pagination="{ clickable: true }"
        navigation
        class="swiper"
      >
        <SwiperSlide v-for="(c, index) in topCantores" :key="c.id" class="slide">
          <article class="card" @click="handleCardTap(c.nome)">
            <div class="top">
              <span class="rank">
                <span class="badge">#{{ index + 1 }}</span>
                <span class="hint">Top downloads</span>
              </span>
            </div>

            <div class="cover-wrap">
              <img :src="c.coverUrl || '/LogoMusic.jpg'" class="cover" alt="Capa do cantor" />
            </div>

            <div class="body">
              <h3 class="nome">{{ c.nome }}</h3>
              <p class="meta">
                {{ c.downloads || 0 }} downloads • {{ countMusicas(c.nome) }} músicas
              </p>
            </div>

            <div class="actions">
              <button
                class="primary"
                :disabled="progress[c.nome] !== undefined && progress[c.nome] < 100"
                @click.stop="handleDownload(c.nome)"
              >
                <span class="mdi mdi-download"></span>
                <span class="btnText">
                  {{
                    progress[c.nome] !== undefined && progress[c.nome] < 100
                      ? progress[c.nome] + "%"
                      : "Baixar tudo"
                  }}
                </span>
              </button>

              <v-progress-linear
                v-if="progress[c.nome] !== undefined"
                :model-value="progress[c.nome]"
                height="6"
                rounded
              />
            </div>
          </article>
        </SwiperSlide>
      </Swiper>
    </div>

    <!-- MODAL (ASSINATURA) -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="showSubModal"
          class="sub-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Assinatura necessária"
          @click.self="closeSubModal"
        >
          <transition name="pop">
            <div class="sub-modal" tabindex="-1" ref="modalRef" @keydown.esc="closeSubModal">
              <button class="sub-close" @click="closeSubModal" aria-label="Fechar">
                <span class="mdi mdi-close"></span>
              </button>

              <aside class="sub-left">
                <div class="sub-left-inner">
                  <div class="sub-icon">
                    <span class="mdi mdi-music-circle"></span>
                  </div>
                  <h2 class="sub-left-title">Acesso Premium</h2>
                  <p class="sub-left-sub">Baixe álbuns completos em ZIP, sem limites.</p>
                </div>
              </aside>

              <main class="sub-right">
                <h3 class="sub-title">Como funciona?</h3>
                <p class="sub-desc">
                  Para baixar “todas as músicas” de um cantor, sua conta precisa estar com a assinatura ativa.
                </p>

                <div class="sub-steps">
                  <div class="step">
                    <div class="n">1</div>
                    <div class="txt">
                      <p class="t">Ative seu acesso</p>
                      <p class="d">Confirme o plano rapidinho.</p>
                    </div>
                  </div>

                  <div class="step">
                    <div class="n">2</div>
                    <div class="txt">
                      <p class="t">Liberação imediata</p>
                      <p class="d">Downloads e player desbloqueados na hora.</p>
                    </div>
                  </div>

                  <div class="step">
                    <div class="n">3</div>
                    <div class="txt">
                      <p class="t">Baixe em ZIP</p>
                      <p class="d">Tudo organizado por cantor, com progresso.</p>
                    </div>
                  </div>
                </div>

                <a class="sub-cta" :href="ctaLink" target="_blank" rel="noopener">
                  <span class="mdi mdi-whatsapp"></span>
                  SOLICITAR AGORA
                </a>

                <p class="sub-foot">Fale diretamente com nossa equipe</p>
              </main>
            </div>
          </transition>
        </div>
      </transition>
    </Teleport>
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
const {tracks,showSubModal,modalRef,ctaLink,closeSubModal,packageTracks}=useLegacyMusic()
const progress=ref({})
const topCantores=computed(()=>{const map=new Map();for(const t of tracks.value){const c=map.get(t.cantor)||{id:t.cantor,nome:t.cantor,coverUrl:t.coverUrl,downloads:0};c.downloads+=t.downloads || t.downloadCount || 0;map.set(t.cantor,c)}return [...map.values()].sort((a,b)=>b.downloads-a.downloads).slice(0,10)})
function countMusicas(name){return tracks.value.filter(t=>t.cantor===name).length}
function handleDownload(name){return packageTracks(tracks.value.filter(t=>t.cantor===name))}
const handleCardTap=handleDownload
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

.top-cantores-root {
  width: 100%;
}

.top-cantores {
  width: 100%;
  padding: 16px 0 22px;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
}

.header {
  display: flex;
  padding: 0 16px;
  margin-bottom: 16px;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.header h2 {
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
}

.header p {
  font-size: 14px;
  color: #6b7280;
}

.indicador {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #777;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
}

/* Swiper */
.swiper {
  padding: 6px 0 10px;
}

.slide {
  display: flex;
  justify-content: center;
  height: auto;
}

/* Card */
.card {
  width: 100%;
  max-width: 270px;
  height: 372px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  background: linear-gradient(180deg, #ffffff, #f9fafb);
  border-radius: 18px;
  padding: 16px;
  box-sizing: border-box;

  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6);

  border: 1px solid rgba(17, 24, 39, 0.06);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  padding: 5px 10px;
  border-radius: 999px;
}

.hint {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

/* Cover */
.cover-wrap {
  width: 100%;
  margin: 12px 0;
}

.cover {
  width: 100%;
  height: 165px;
  object-fit: cover;
  border-radius: 14px;
}

/* Texto */
.body {
  margin-top: 2px;
}

.nome {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.meta {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

/* Botão */
.actions {
  margin-top: 6px;
}

.primary {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 800;
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35);
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Progress */
.v-progress-linear {
  margin-top: 10px;
  border-radius: 999px;
}

/* ======================
        MODAL
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
.sub-close .mdi {
  font-size: 20px;
}

/* LEFT */
.sub-left {
  background: #00cfd0;
  display: grid;
  place-items: center;
  padding: 28px;
}

.sub-left-inner {
  text-align: center;
  color: #fff;
}

.sub-icon {
  width: 86px;
  height: 86px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.18);
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
}

.sub-icon .mdi {
  font-size: 44px;
}

.sub-left-title {
  font-size: 30px;
  line-height: 1.1;
  margin: 0 0 10px;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.sub-left-sub {
  margin: 0;
  opacity: 0.95;
  font-weight: 700;
}

/* RIGHT */
.sub-right {
  padding: 34px 34px 26px;
  color: #111;
}

.sub-title {
  margin: 0 0 10px;
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.sub-desc {
  margin: 0 0 18px;
  color: #4b5563;
  font-weight: 650;
  line-height: 1.55;
}

.sub-steps {
  display: grid;
  gap: 14px;
  margin-bottom: 22px;
}

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

.step .t {
  margin: 0;
  font-weight: 900;
  color: #111;
}

.step .d {
  margin: 2px 0 0;
  color: #6b7280;
  font-weight: 650;
}

/* CTA */
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

.sub-cta:hover {
  transform: translateY(-1px);
  filter: brightness(0.98);
}

.sub-cta .mdi {
  font-size: 22px;
}

.sub-foot {
  margin: 14px 0 0;
  text-align: center;
  color: #9ca3af;
  font-weight: 700;
}

/* Responsivo modal */
@media (max-width: 860px) {
  .sub-modal {
    grid-template-columns: 1fr;
  }
  .sub-left {
    padding: 22px;
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pop-enter-active,
.pop-leave-active {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.pop-enter-from,
.pop-leave-to {
  transform: translateY(10px) scale(0.985);
  opacity: 0;
}
</style>
