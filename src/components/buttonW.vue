<template>
  <div class="support-buttons">
    <!-- WhatsApp -->
    <button class="Btn" @click="openWhatsApp">
      <div class="sign">
        <svg class="socialSvg whatsappSvg" viewBox="0 0 16 16">
          <path
            d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"
          ></path>
        </svg>
      </div>
      <div class="text">Suporte</div>
    </button>




  </div>
</template>

<script setup>              
const openWhatsApp = () => {
  window.open('https://wa.me/8695102595?text=Ol%C3%A1%2C%20quero%20mais%20informa%C3%A7%C3%B5es%20de%20suporte!%20', '_blank')
}
</script>

<style scoped>
.support-buttons {
  position: fixed;
  bottom: 300px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
}

.Btn {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* ícones à direita */
  width: 50px;
  height: 45px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
  background-color: #00d757;
  transition: width 0.3s;
}

.Btn.instagram { background-color: #E1306C; }
.Btn.tutorials { background-color: #FFB800; }

.sign {
  width: 45px; /* ícone fixo */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sign svg {
  width: 25px;
  height: 25px;
}

.sign svg path {
  fill: white;
}

.text {
  position: absolute;
  left: 0;
  opacity: 0;
  width: 0;
  color: white;
  font-size: 1.2em;
  font-weight: 600;
  text-align: right;
  transition: width 0.3s, opacity 0.3s, padding 0.3s;
}

.Btn:hover {
  width: 150px;
  border-radius: 40px;
}

.Btn:hover .text {
  opacity: 1;
  width: calc(100% - 45px); /* ocupa o restante do botão */
  padding-left: 10px;
}

.Btn:active {
  transform: translate(2px, 2px);
}
</style>
