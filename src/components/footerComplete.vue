<template>
  <footer class="footer">
    <div class="footer-container">
      <!-- Logo / Nome -->
      <div class="footer-brand">
        <h2>🎶 Repertorio Atualizado</h2>
        <p>Seu repertório digital de músicas</p>
      </div>

      <!-- Links rápidos -->
      <nav class="footer-links">
        <a href="#">Repertório</a>
        <a href="#">Planos</a> 
        <a href="#">Contato</a>
        <a href="#">Sobre</a>
      </nav>

      <!-- Redes sociais -->
      <div class="footer-social">
        <a href="#" aria-label="Instagram">📸</a>
        <a href="https://wa.me/5586994227005?text=Ol%C3%A1%2C%20quero%20mais%20informa%C3%A7%C3%B5es%20de%20suporte!%20" aria-label="WhatsApp">💬</a>
        <a href="#" aria-label="YouTube">▶</a>
      </div>
    </div>

    <!-- Créditos -->
    <div class="footer-bottom">
      <p class="credit">Desenvolvido por <a href="https://instagram.com/kallebemax" target="_blank">@KallebeMax</a>, entrar em contato</p>
      <p>© {{ new Date().getFullYear() }} RepertorioAtualizado. Todos os direitos reservados.</p>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.footer {
  background: #111;
  color: #eee;
  padding: 40px 24px 20px;
  font-family: Inter, system-ui, sans-serif;
}
.footer-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}
.footer-brand h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #1db954;
}
.footer-brand p {
  font-size: 14px;
  color: #aaa;
}
.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 15px;
}
.footer-links a {
  color: #ccc;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-links a:hover {
  color: #1db954;
}
.footer-social {
  display: flex;
  gap: 16px;
  font-size: 22px;
}
.footer-social a {
  color: #ccc;
  text-decoration: none;
  transition: color 0.2s, transform 0.2s;
}
.footer-social a:hover {
  color: #1db954;
  transform: scale(1.2);
}
.footer-bottom {
  margin-top: 32px;
  text-align: center;
  font-size: 13px;
  color: #888;
}
.footer-bottom a {
  color: #1db954;
  text-decoration: none;
}
.footer-bottom a:hover {
  text-decoration: underline;
}
.credit {
  margin-top: 6px;
  font-size: 13px;
}

/* Responsividade */
@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .footer-links {
    justify-content: center;
  }
  .footer-social {
    justify-content: center;
  }
}
</style>
