<template>
  <section class="home">
    <div class="overlay"></div>

    <div class="content">
      <h1 class="title">O Repertório que <br /> Cresce com Você.</h1>
      <p class="subtitle">
        Pacotes de música perfeitos para Paredões e apaixonados por som.
      </p>

      <div class="buttons">
        <a v-if="!userStore.hasActiveSubscription" href="https://wa.me/8695102595?text=Ol%C3%A1%2C%20quero%20mais%20informa%C3%A7%C3%B5es%20de%20suporte!%20" class="btn green">Comprar assinatura</a>
        <a v-else class="btn green"> Assinatura ativada com Sucesso!</a>
        <a href="/AllMusic" class="btn green">Ouvir Agora</a>
        <a href="/Repertorios" class="btn green">Baixar Repertório</a>
      </div>
    <Autoscroll />

      <div class="platforms">
        <h3>Playlists para Todos os Seus Projetos</h3>
        <p>
          Tenha acesso a um repertório atualizado mensalmente, pronto para elevar a qualidade do seu conteúdo e
          criar experiências únicas.
        </p>
        <ul>
          <li>✔ YouTube & Shorts</li>
          <li>✔ Instagram & Reels</li>
          <li>✔ TikTok</li>
          <li>✔ Jogos e Lives</li>
          <li>✔ Comerciais & Marcas</li>
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
.home {
  position: relative;
  height: 100vh;
  width: 100%;
  background: url('/BG/BG-home.jpg') no-repeat center center/cover;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  padding: 20px;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.8); /* escurece o fundo */
}

.content {
  position: relative;
  z-index: 2;
  color: #fff;
  max-width: 900px;
  padding: 20px;
}

.title {
  font-size: 4rem;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.8;
  margin-bottom: 40px;
}

.buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 50px;
  flex-wrap: wrap;
}
a{
  text-decoration: none;
}
.btn {
  padding: 14px 28px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s;
}

.btn.green {
  background: #22c55e;
  color: #fff;
}

.btn.green:hover {
  background: #16a34a;
  transform: scale(1.05);
}

.platforms {
  background: rgba(255,255,255,0.05);
  padding: 30px;
  border-radius: 15px;
}

.platforms h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.platforms p {
  font-size: 1rem;
  margin-bottom: 20px;
  opacity: 0.9;
}

.platforms ul {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  padding: 0;
}

.platforms li {
  font-size: 1rem;
  color: #22c55e;
  transition: 0.3s;
}
.platforms li:hover{
  color: #fff;
}

/* ===================== RESPONSIVIDADE ===================== */
@media (max-width: 1024px) {
  .title {
    font-size: 3rem;
  }
  .subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .home {
    height: auto;
    padding: 40px 20px;
  }
  .title {
    font-size: 2.3rem;
  }
  .subtitle {
    font-size: 0.95rem;
    margin-bottom: 30px;
  }
  .buttons {
    flex-direction: column;
    gap: 15px;
  }
  .btn {
    width: 100%;
    font-size: 1rem;
  }
  .platforms {
    padding: 20px;
    margin-top: 30px;
  }
  .platforms h3 {
    font-size: 1.3rem;
  }
  .platforms p {
    font-size: 0.9rem;
  }
  .platforms ul {
    flex-direction: column;
    gap: 12px;
  }
  .platforms li {
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.8rem;
  }
  .subtitle {
    font-size: 0.9rem;
  }
  .btn {
    font-size: 0.9rem;
    padding: 12px 20px;
  }
  .platforms h3 {
    font-size: 1.1rem;
  }
  .platforms li {
    font-size: 0.85rem;
  }
}
</style>
