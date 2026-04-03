<template>
  <section class="home">
    <div class="overlay"></div>

    <!-- Elementos decorativos animados -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <!-- Linhas de grade decorativas -->
    <div class="grid-lines">
      <span v-for="n in 5" :key="n" class="grid-line"></span>
    </div>

    <div class="content">
      <!-- Badge superior -->
      <div class="badge">
        <span class="badge-dot"></span>
        Atualizado mensalmente
      </div>

      <h1 class="title">
        O Repertório que
        <span class="title-accent">Cresce<br />com Você.</span>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.114 1.532 5.836L.057 23.887l6.24-1.638A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.784 9.784 0 01-4.988-1.365l-.358-.213-3.713.976.992-3.624-.233-.373A9.77 9.77 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/></svg>
          Comprar Assinatura
        </a>
        <a v-else class="btn btn-success-inactive">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Assinatura Ativa!
        </a>

        <a href="/AllMusic" class="btn btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Ouvir Agora
        </a>

        <a href="/Repertorios" class="btn btn-outline">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Baixar Repertório
        </a>

        <a href="/Pastas" class="btn btn-outline">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          Ver Pastas
        </a>
      </div>

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
          <li>
            <span class="platform-icon">▶</span>
            YouTube & Shorts
          </li>
          <li>
            <span class="platform-icon">◈</span>
            Instagram & Reels
          </li>
          <li>
            <span class="platform-icon">♪</span>
            TikTok
          </li>
          <li>
            <span class="platform-icon">◉</span>
            Jogos e Lives
          </li>
          <li>
            <span class="platform-icon">★</span>
            Comerciais & Marcas
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useUserStore } from "@/stores/userStore";
const userStore = useUserStore();
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

/* ===================== BASE ===================== */
.home {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background: url('/BG/BG-home.jpg') no-repeat center center / cover;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  padding: clamp(80px, 10vw, 120px) clamp(16px, 5vw, 40px) clamp(40px, 6vw, 60px);
  font-family: 'Syne', sans-serif;
}

/* ===================== OVERLAY ===================== */
.overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 100%, rgba(34, 197, 94, 0.12) 0%, transparent 70%),
    linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.88) 60%, rgba(0,0,0,0.97) 100%);
  z-index: 1;
}

/* ===================== ORBS DECORATIVOS ===================== */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
  animation: floatOrb 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}
.orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #22c55e, transparent 70%);
  top: -150px; left: -150px;
  animation-delay: 0s;
}
.orb-2 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, #4ade80, transparent 70%);
  bottom: -100px; right: -80px;
  animation-delay: -3s;
}
.orb-3 {
  width: 200px; height: 200px;
  background: radial-gradient(circle, #86efac, transparent 70%);
  top: 40%; left: 60%;
  animation-delay: -5s;
}

@keyframes floatOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, -20px) scale(1.05); }
  66%       { transform: translate(-20px, 15px) scale(0.97); }
}

/* ===================== GRADE DECORATIVA ===================== */
.grid-lines {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-evenly;
  pointer-events: none;
  z-index: 1;
  opacity: 0.04;
}
.grid-line {
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent, #22c55e, transparent);
}

/* ===================== CONTEÚDO ===================== */
.content {
  position: relative;
  z-index: 2;
  color: #fff;
  width: 100%;
  max-width: 860px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  animation: fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ===================== BADGE ===================== */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #4ade80;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 6px 16px;
  border-radius: 100px;
  margin-bottom: 28px;
  animation: fadeUp 0.9s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.badge-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 6px #22c55e; }
  50%       { box-shadow: 0 0 16px #22c55e, 0 0 30px rgba(34,197,94,0.4); }
}

/* ===================== TÍTULO ===================== */
.title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(3rem, 8vw, 6.5rem);
  font-weight: 400;
  line-height: 1.0;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  margin: 0 0 20px;
  animation: fadeUp 0.9s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.title-accent {
  color: #22c55e;
  display: inline-block;
  text-shadow: 0 0 60px rgba(34, 197, 94, 0.4);
}

/* ===================== SUBTÍTULO ===================== */
.subtitle {
  font-size: clamp(0.9rem, 2.2vw, 1.15rem);
  color: rgba(255,255,255,0.65);
  max-width: 500px;
  line-height: 1.7;
  margin: 0 0 40px;
  animation: fadeUp 0.9s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.subtitle strong {
  color: #4ade80;
  font-weight: 700;
}

/* ===================== BOTÕES ===================== */
.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 48px;
  animation: fadeUp 0.9s 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
}

a { text-decoration: none; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 24px;
  border-radius: 12px;
  font-family: 'Syne', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  white-space: nowrap;
}

/* Primário - CTA principal */
.btn-primary {
  background: #22c55e;
  color: #000;
  box-shadow: 0 4px 24px rgba(34, 197, 94, 0.4);
}
.btn-primary:hover {
  background: #16a34a;
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(34, 197, 94, 0.5);
}

/* Sucesso inativo */
.btn-success-inactive {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
  cursor: default;
}

/* Secundário */
.btn-secondary {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
}
.btn-secondary:hover {
  background: rgba(255,255,255,0.18);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.3);
}

/* Outline */
.btn-outline {
  background: transparent;
  color: rgba(255,255,255,0.75);
  border: 1px solid rgba(255,255,255,0.18);
}
.btn-outline:hover {
  border-color: rgba(34, 197, 94, 0.5);
  color: #4ade80;
  transform: translateY(-2px);
}

/* ===================== PLATAFORMAS ===================== */
.platforms {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(16px);
  padding: clamp(24px, 4vw, 36px) clamp(20px, 4vw, 40px);
  border-radius: 20px;
  width: 100%;
  animation: fadeUp 0.9s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
  position: relative;
  overflow: hidden;
}
.platforms::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(34,197,94,0.05) 0%, transparent 60%);
  pointer-events: none;
}

.platforms-header {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  margin-bottom: 14px;
}
.platforms-divider {
  height: 1px;
  flex: 1;
  background: linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent);
  max-width: 80px;
}
.platforms-header h3 {
  font-size: clamp(0.95rem, 2.2vw, 1.25rem);
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #fff;
  margin: 0;
  white-space: nowrap;
}

.platforms-desc {
  font-size: clamp(0.8rem, 1.8vw, 0.95rem);
  color: rgba(255,255,255,0.55);
  max-width: 560px;
  margin: 0 auto 24px;
  line-height: 1.6;
}

.platforms-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.platforms-list li {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #4ade80;
  font-size: clamp(0.78rem, 1.6vw, 0.9rem);
  font-weight: 600;
  padding: 7px 16px;
  border-radius: 100px;
  transition: background 0.2s, color 0.2s, transform 0.2s, box-shadow 0.2s;
  cursor: default;
}
.platforms-list li:hover {
  background: rgba(34, 197, 94, 0.18);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.2);
}
.platform-icon {
  font-size: 0.7rem;
  opacity: 0.7;
}

/* ===================== RESPONSIVIDADE ===================== */
@media (max-width: 640px) {
  .home {
    padding: 72px 16px 40px;
  }
  .content {
    gap: 0;
  }
  .buttons {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }
  .btn {
    width: 100%;
    justify-content: center;
    padding: 14px 20px;
    font-size: 0.9rem;
  }
  .platforms-header {
    flex-direction: column;
    gap: 8px;
  }
  .platforms-divider { display: none; }
  .platforms-header h3 {
    white-space: normal;
    text-align: center;
  }
  .platforms-list {
    gap: 8px;
  }
  .orb-1 { width: 280px; height: 280px; }
  .orb-2 { width: 200px; height: 200px; }
  .orb-3 { display: none; }
}

@media (max-width: 380px) {
  .title { font-size: 2.6rem; }
  .btn { font-size: 0.85rem; }
}
</style>