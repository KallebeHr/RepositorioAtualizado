<template>
  <footer class="footer">
    <div class="footer-orb"></div>
    <div class="footer-top-line"></div>

    <div class="footer-container">
      <div class="footer-brand">
        <img src="/LogoRepertorio.png" class="logoImg" alt="Logo Repertório Atualizado">
        <p class="brand-desc">O Repertório que Cresce com Você.</p>
      </div>

      <nav class="footer-links">
        <a href="/repertorios">
          <i class="mdi mdi-playlist-music"></i>
          Entre no grupo PRIVADO
        </a>
        <a href="/repertorios">
          <i class="mdi mdi-playlist-music"></i>
          Repertório
        </a>
        <a href="/tutoriais">
          <i class="mdi mdi-information-outline"></i>
          Tutoriais
        </a>
        <a href="#">
          <i class="mdi mdi-crown"></i>
          Baixar por cantores
        </a>
        <a href="https://wa.me/5586995102595?text=Ol%C3%A1%2C%20quero%20mais%20informa%C3%A7%C3%B5es%20de%20suporte!">
          <i class="mdi mdi-email-outline"></i>
          Entrar em contato
        </a>
      </nav>

      <div class="footer-social">
        <a href="#" aria-label="Instagram">
          <i class="mdi mdi-instagram"></i>
        </a>
        <a
          href="https://wa.me/5586995102595?text=Ol%C3%A1%2C%20quero%20mais%20informa%C3%A7%C3%B5es%20de%20suporte!"
          aria-label="WhatsApp"
          target="_blank"
        >
          <i class="mdi mdi-whatsapp"></i>
        </a>
        <a href="#" aria-label="YouTube">
          <i class="mdi mdi-youtube"></i>
        </a>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="footer-divider"></div>
      <p class="credit">
        Desenvolvido por
        <a href="https://instagram.com/kallebemax" target="_blank">
          @KallebeMax
        </a>
      </p>
      <p class="copyright">
        © {{ new Date().getFullYear() }} Repertório Atualizado. Todos os direitos reservados.
      </p>
    </div>
  </footer>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');

.footer {
  position: relative;
  background: #050505; /* Fundo mais escuro para contrastar o neon */
  color: #e5e7eb;
  padding: 60px 24px 24px;
  margin-bottom: 10rem;
  font-family: 'Syne', sans-serif;
  width: 100%;
  overflow: hidden;
  z-index: 1;
}

/* ===================== EFEITOS DECORATIVOS ===================== */
.footer-top-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.4), transparent);
}

.footer-orb {
  position: absolute;
  bottom: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 200px;
  background: radial-gradient(ellipse, #22c55e, transparent 70%);
  filter: blur(90px);
  opacity: 0.12;
  z-index: -1;
  pointer-events: none;
}

/* ===================== ESTRUTURA PRINCIPAL ===================== */
.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
  position: relative;
  z-index: 2;
}

/* Marca */
.footer-brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.logoImg {
  width: auto;
  height: clamp(6rem, 10vw, 8rem);
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
}

.brand-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Links */
.footer-links {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.footer-links a {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.footer-links i {
  font-size: 1.2rem;
  color: #22c55e;
  transition: transform 0.3s ease;
}

.footer-links a:hover {
  color: #4ade80;
  transform: translateX(6px);
  text-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
}

.footer-links a:hover i {
  transform: scale(1.1);
  text-shadow: 0 0 16px rgba(34, 197, 94, 0.6);
}

/* Social */
.footer-social {
  display: flex;
  gap: 12px;
}

.footer-social a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 22px;
  text-decoration: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
}

.footer-social a:hover {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.5);
  color: #4ade80;
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.25);
}

/* ===================== BOTTOM (CRÉDITOS) ===================== */
.footer-bottom {
  margin-top: 48px;
  text-align: center;
  position: relative;
  z-index: 2;
}

.footer-divider {
  height: 1px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto 24px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
}

.credit {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 8px;
}

.credit a {
  color: #4ade80;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s, text-shadow 0.2s;
}

.credit a:hover {
  color: #22c55e;
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
}

.copyright {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

/* ===================== RESPONSIVIDADE ===================== */
@media (max-width: 768px) {
  .footer {
    padding: 48px 16px 24px;
  }
  
  .footer-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 32px;
  }

  .footer-brand {
    align-items: center;
  }

  .footer-links {
    align-items: center;
  }

  .footer-links a:hover {
    transform: translateY(-2px); /* Muda o sentido da animação no mobile para não desalinhar */
  }
}
</style>