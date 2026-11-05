<template>
  <section class="home">
    <div class="overlay"></div>

    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <div class="content">
      <div class="badge">
        <span class="badge-dot"></span>
        Atualizado mensalmente
      </div>

      <h1 class="title">
        O Repertório que
        <span class="title-accent">Cresce com Você.</span>
      </h1>

      <p class="subtitle">
        Pacotes de música perfeitos para <strong>Paredões</strong> e apaixonados por som.
      </p>

      <div class="buttons">
        <a
          v-if="!userStore.hasActiveSubscription"
          href="https://wa.me/5586995102595?text=Ol%C3%A1!%20tenho%20interesse%20no%20*REPERTORIO%20ATUALIZADO*"
          class="btn btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.114 1.532 5.836L.057 23.887l6.24-1.638A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.784 9.784 0 01-4.988-1.365l-.358-.213-3.713.976.992-3.624-.233-.373A9.77 9.77 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/></svg>
          Comprar Assinatura
        </a>
        <a v-else class="btn btn-success-inactive">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          Assinatura Ativa!
        </a>

        <RouterLink to="/AllMusic" class="btn btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          Ouvir Agora
        </RouterLink>

        <RouterLink to="/Repertorios" class="btn btn-outline">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Baixar Repertório
        </RouterLink>

        <RouterLink to="/Pastas" class="btn btn-outline">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          Ver Pastas
        </RouterLink>
      </div>

      <!-- Novidades, em versão compacta -->
      <section class="news" aria-label="Novidades do repertório">
        <header class="news-head">
          <h2>Novidades</h2>
          <RouterLink to="/Novidades" class="news-more">Ver tudo <span aria-hidden="true">→</span></RouterLink>
        </header>

        <div class="news-grid">
          <article class="news-card">
            <span class="news-icon" aria-hidden="true"><i class="mdi mdi-folder-zip-outline" /></span>
            <div class="news-body">
              <span class="news-tag">DISPONÍVEL</span>
              <h3>Repertórios em ZIP</h3>
              <p>As partes do repertório ficam na página Repertório, com senha opcional e download liberado para assinantes.</p>
            </div>
          </article>

          <article class="news-card">
            <span class="news-icon" aria-hidden="true"><i class="mdi mdi-tune-vertical" /></span>
            <div class="news-body">
              <span class="news-tag">ATIVAÇÃO POR CÓDIGO</span>
              <h3>Equalizador pessoal</h3>
              <p>Ajuste grave, voz e agudo e guarde sua combinação favorita. Adicional de R$ 5.</p>
            </div>
          </article>

          <article class="news-card">
            <span class="news-icon" aria-hidden="true"><i class="mdi mdi-play-box-outline" /></span>
            <div class="news-body">
              <span class="news-tag muted">EM BREVE</span>
              <h3>Videoclipes</h3>
              <p>Liberação de videoclipes para baixar ou ouvir offline. Consulte o suporte.</p>
            </div>
          </article>

          <article class="news-card">
            <span class="news-icon" aria-hidden="true"><i class="mdi mdi-cloud-download-outline" /></span>
            <div class="news-body">
              <span class="news-tag muted">{{ releasedFeatures.offline ? 'DISPONÍVEL' : 'EM BREVE' }}</span>
              <h3>Ouvir offline</h3>
              <p>Salve suas músicas no aparelho para ouvir quando estiver sem internet.</p>
            </div>
          </article>
        </div>
      </section>

      <Autoscroll />

      <!-- Plataformas -->
      <div class="platforms">
        <div class="platforms-header">
          <div class="platforms-divider"></div>
          <h3>Playlists para Todos os Seus Projetos</h3>
          <div class="platforms-divider"></div>
        </div>

        <p class="platforms-desc">
          Repertório atualizado mensalmente, pronto para elevar a qualidade do seu conteúdo
          e criar experiências únicas.
        </p>

        <ul class="platforms-list">
          <li><span class="platform-icon">▶</span> YouTube &amp; Shorts</li>
          <li><span class="platform-icon">◈</span> Instagram &amp; Reels</li>
          <li><span class="platform-icon">♪</span> TikTok</li>
          <li><span class="platform-icon">◉</span> Jogos e Lives</li>
          <li><span class="platform-icon">★</span> Comerciais &amp; Marcas</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import Autoscroll from '@/components/autoscroll.vue'
import { useUserStore } from '@/stores/userStore'
import { releasedFeatures } from '@/services/feature-release'

const userStore = useUserStore()
</script>

<style scoped>
/* ===================== BASE ===================== */
.home {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background: url('/BG/BG-home.jpg') no-repeat center center / cover;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  text-align: center;
  overflow-x: hidden;
  padding: clamp(52px, 6vw, 76px) clamp(14px, 4vw, 28px) clamp(36px, 5vw, 56px);
  font-family: 'Syne', sans-serif;
}

.overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 100%, rgba(34, 197, 94, 0.12) 0%, transparent 70%),
    linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.88) 60%, rgba(0,0,0,0.97) 100%);
  z-index: 1;
}

/* ===================== ORBS ===================== */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.16;
  animation: floatOrb 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}
.orb-1 { width: 380px; height: 380px; background: radial-gradient(circle, #22c55e, transparent 70%); top: -140px; left: -140px; }
.orb-2 { width: 280px; height: 280px; background: radial-gradient(circle, #00c3ff, transparent 70%); bottom: -90px; right: -90px; animation-delay: 2s; }
.orb-3 { width: 220px; height: 220px; background: radial-gradient(circle, #22c55e, transparent 70%); top: 45%; left: 55%; animation-delay: 4s; }

@keyframes floatOrb {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-22px) scale(1.06); }
}

/* ===================== CONTEÚDO ===================== */
.content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 660px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.66rem;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 999px;
  padding: 5px 13px;
  margin-bottom: 18px;
}
.badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px #22c55e;
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(0.8); }
}

.title {
  font-size: clamp(1.9rem, 5vw, 3.4rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -1px;
  color: #fff;
  margin-bottom: 12px;
}
.title-accent {
  display: block;
  background: linear-gradient(100deg, #22c55e, #00c3ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-style: italic;
}

.subtitle {
  font-size: clamp(0.82rem, 2vw, 0.98rem);
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.6;
  max-width: 420px;
  margin-bottom: 22px;
}
.subtitle strong { color: #22c55e; }

/* ===================== BOTÕES ===================== */
.buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px;
  width: 100%;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 40px;
  padding: 10px 16px;
  border-radius: 11px;
  font-size: 0.79rem;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  white-space: nowrap;
}
.btn svg { width: 15px; height: 15px; flex-shrink: 0; }
.btn:hover { transform: translateY(-2px); }
.btn:active { transform: translateY(0); }

.btn-primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #052e16;
  box-shadow: 0 6px 18px rgba(34, 197, 94, 0.3);
}
.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.16);
}
.btn-success-inactive {
  background: rgba(34, 197, 94, 0.14);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.4);
}
.btn-outline {
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
}
.btn-outline:hover {
  border-color: rgba(34, 197, 94, 0.6);
  color: #fff;
}

/* ===================== NOVIDADES ===================== */
.news {
  width: 100%;
  margin-top: 26px;
  text-align: left;
}

.news-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.news-head h2 {
  font-size: clamp(1rem, 2.4vw, 1.2rem);
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.3px;
}
.news-more {
  font-size: 0.72rem;
  font-weight: 600;
  color: #4ade80;
  text-decoration: none;
  white-space: nowrap;
}
.news-more:hover { text-decoration: underline; }

.news-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.news-card {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 13px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 14px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.news-card:hover {
  border-color: rgba(34, 197, 94, 0.4);
  transform: translateY(-2px);
}

.news-icon {
  display: grid;
  place-items: center;
  width: 32px; height: 32px;
  flex-shrink: 0;
  border-radius: 10px;
  background: rgba(34, 197, 94, 0.14);
  color: #4ade80;
  font-size: 17px;
}
.news-icon i { line-height: 1; }

.news-body { min-width: 0; }
.news-tag {
  display: block;
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 1.1px;
  color: #4ade80;
  margin-bottom: 3px;
}
.news-tag.muted { color: rgba(255, 255, 255, 0.42); }
.news-body h3 {
  font-size: 0.84rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 3px;
  line-height: 1.25;
}
.news-body p {
  font-size: 0.71rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.5);
}

/* ===================== PLATAFORMAS ===================== */
.platforms {
  width: 100%;
  margin-top: 26px;
}
.platforms-header {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 10px;
}
.platforms-divider {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.5), transparent);
}
.platforms-header h3 {
  font-size: clamp(0.82rem, 2vw, 0.95rem);
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}
.platforms-desc {
  font-size: 0.73rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.45);
  max-width: 460px;
  margin: 0 auto 14px;
}
.platforms-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.platforms-list li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  padding: 5px 12px;
}
.platform-icon { font-size: 0.75rem; color: #4ade80; }

/* ===================== RESPONSIVO ===================== */
@media (max-width: 720px) {
  .news-grid { grid-template-columns: 1fr; }
  .content { max-width: 520px; }
}

@media (max-width: 480px) {
  .home { padding: 44px 13px 34px; }
  .buttons { gap: 8px; }
  .btn { flex: 1 1 calc(50% - 8px); padding: 10px 12px; font-size: 0.75rem; }
  .btn:first-child { flex-basis: 100%; }
  .news-card { padding: 12px; }
  .news-body p { font-size: 0.69rem; }
  .platforms-list li { font-size: 0.66rem; padding: 4px 10px; }
}

@media (max-width: 360px) {
  .title { font-size: 1.65rem; }
  .btn { flex-basis: 100%; }
  .news-icon { width: 28px; height: 28px; font-size: 15px; }
}

@media (prefers-reduced-motion: reduce) {
  .orb, .badge-dot { animation: none; }
  .news-card:hover, .btn:hover { transform: none; }
}
</style>
