<template>
  <footer class="footer">
    <div class="footer-container">

      <!-- Marca -->
      <div class="footer-brand">
        <img src="/LogoRepertorio.png"  class="logoImg" alt="">
      </div>

      <!-- Navegação -->
      <nav class="footer-links">
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

      <!-- Redes sociais -->
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

    <!-- Rodapé inferior -->
    <div class="footer-bottom">
      <p class="credit">
        Desenvolvido por
        <a href="https://instagram.com/kallebemax" target="_blank">
          @KallebeMax
        </a>
      </p>

      <p>
        © {{ new Date().getFullYear() }} Repertório Atualizado.
        Todos os direitos reservados.
      </p>
    </div>
  </footer>
</template>
<style scoped>
  .footer {
  background: #111;
  color: #e5e7eb;
  padding: 48px 24px 24px;
  margin-bottom: 10rem;
  font-family: Inter, system-ui, sans-serif;
  width: 100%;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}

/* Marca */
.footer-brand h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 800;
  color: #1db954;
}
.logoImg{
width: auto;
height: 10rem;
}
.footer-brand p {
  margin-top: 6px;
  font-size: 14px;
  color: #9ca3af;
}

/* Links */
.footer-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-links a {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #d1d5db;
  text-decoration: none;
  font-size: 15px;
  transition: color 0.2s, transform 0.2s;
}

.footer-links a:hover {
  color: #1db954;
  transform: translateX(4px);
}

/* Social */
.footer-social {
  display: flex;
  gap: 18px;
  font-size: 26px;
}

.footer-social a {
  color: #d1d5db;
  transition: color 0.2s, transform 0.2s;
}

.footer-social a:hover {
  color: #1db954;
  transform: scale(1.15);
}

/* Bottom */
.footer-bottom {
  margin-top: 36px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

.footer-bottom a {
  color: #1db954;
  text-decoration: none;
}

.footer-bottom a:hover {
  text-decoration: underline;
}

.credit {
  margin-bottom: 6px;
}

/* Responsivo */
@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .footer-links {
    align-items: center;
  }
}

</style>