<template>
  <section class="tutorials">
    <h1 class="title">📖 Tutorial</h1>
    <p class="subtitle">
      Aprenda em poucos passos como aproveitar tudo da sua assinatura.
    </p>

    <div class="cards">
      <div class="card">
        <div class="icon">💻</div>
        <h2>Baixar pelo Computador</h2>
        <p>
          Clique no botão de download disponível no site. O arquivo será salvo na
          sua pasta de Downloads.
        </p>
      </div>

      <div class="card">
        <div class="icon">🗂️</div>
        <h2>Extrair Arquivo</h2>
        <p>
          Localize o arquivo baixado e use programas como
          <strong>WinRAR</strong> ou <strong>7-Zip</strong> para extrair.
        </p>
      </div>

      <div class="card">
        <div class="icon">✨</div>
        <h2>Ativar Assinatura</h2>
        <p>
          Após a compra, volte ao site e clique em
          <strong>Ativar Assinatura</strong>. Aproveite todo o conteúdo!
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
// Nenhuma lógica necessária agora, é só tutorial visual
</script>

<style scoped>
.tutorials {
  min-height: 100vh;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
      background-color: #121212;


  color: #fff;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;
  color: #00d1b2;
}

.subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1000px;
}

.card {
  background: #1e1e1e;
  padding: 25px;
  border-radius: 16px;
  border: 1px solid #333;
  transition: transform 0.3s, box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(0, 209, 178, 0.3);
}

.icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}
</style>
