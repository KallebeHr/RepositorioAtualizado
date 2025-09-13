<template>
  <div class="admin-container">
    <header class="header">
      <h1 class="title">🔍 Administração de usuários</h1>
      <p class="subtitle">Verifique contas, ative ou desative contas ou envie mensagens!</p>
    </header>

    <div class="search-box">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar por nome, email, ID ou data (YYYY-MM-DD)"
      />
    </div>

    <div class="user-list">
      <div
        class="user-card"
        v-for="user in filteredUsers"
        :key="user.uid"
      >
        <div class="user-info">
          <p class="name">{{ user.firstName }} {{ user.lastName }}</p>
          <p class="email">{{ user.email }}</p>
          <p class="id">ID: {{ user.customID || user.uid }}</p>
          <p class="createdAt">Inscrito: {{ formatDate(user.createdAt) }}</p>
        </div>

        <div class="user-actions">
          <select v-model="user.subscription" @change="updateSubscription(user)">
            <option value="" disabled selected>Selecionar status</option>
            <option value="normal">Normal</option>
            <option value="ativa">Ativa</option>
          </select>

          <button class="message-btn" @click="openMessageModal(user)">
            Mensagem
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de envio de mensagem -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeMessageModal">
      <div class="modal-content">
        <h3>Enviar mensagem para {{ selectedUser.firstName }}</h3>
        <textarea v-model="messageText" placeholder="Digite sua mensagem aqui..."></textarea>
        <div class="modal-buttons">
          <button @click="sendMessage">Enviar</button>
          <button class="cancel" @click="closeMessageModal">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { db } from "@/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useUserStore } from "@/stores/userStore";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const users = ref([]);
const search = ref("");

const showModal = ref(false);
const selectedUser = ref(null);
const messageText = ref("");

watch(
  () => userStore.user,
  async (val) => {
    if (val) {
      if (val.role !== "admin") {
        router.replace("/");
      } else {
        await fetchUsers();
      }
    }
  },
  { immediate: true }
);

async function fetchUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  users.value = snapshot.docs.map(doc => ({
    uid: doc.id,
    subscription: "normal",
    ...doc.data()
  }));
}

function formatDate(timestamp) {
  if (!timestamp) return "-";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString();
}

const filteredUsers = computed(() => {
  if (!search.value) return users.value;

  return users.value.filter(u => {
    const fullName = (u.firstName?.toLowerCase() + " " + u.lastName?.toLowerCase());
    const email = u.email?.toLowerCase() || "";
    const customID = u.customID?.toLowerCase() || "";
    const uid = u.uid || "";
    const dateStr = u.createdAt ? formatDate(u.createdAt) : "";

    const s = search.value.toLowerCase();
    return fullName.includes(s) || email.includes(s) || customID.includes(s) || uid.includes(s) || dateStr.includes(s);
  });
});

async function updateSubscription(user) {
  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { subscription: user.subscription });
    toast.success(`Assinatura de ${user.firstName} atualizada!`);
  } catch (err) {
    console.error("Erro ao atualizar assinatura:", err);
    toast.error("Erro ao atualizar assinatura!");
  }
}

// Funções do modal
function openMessageModal(user) {
  selectedUser.value = user;
  messageText.value = "";
  showModal.value = true;
}

function closeMessageModal() {
  showModal.value = false;
  selectedUser.value = null;
  messageText.value = "";
}

async function sendMessage() {
  if (!messageText.value.trim()) {
    toast.warning("Digite uma mensagem antes de enviar!");
    return;
  }
  try {
    const userRef = doc(db, "users", selectedUser.value.uid);
    await updateDoc(userRef, { messages: arrayUnion(messageText.value.trim()) });
    toast.success(`Mensagem enviada para ${selectedUser.value.firstName}!`);
    closeMessageModal();
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    toast.error("Erro ao enviar a mensagem!");
  }
}
</script>

<style scoped>
.admin-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Orbitron", sans-serif;
  color: #fff;
  margin-bottom: 5rem;
}
.header {
  text-align: center;
  margin-bottom: 30px;
}
.user-info .createdAt {
  font-size: 12px;
  color: #00d1b2;
}
.title {
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(90deg, #1db954, #00c3ff, #1db954);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 4s infinite linear;
}
@keyframes shine {
  from { background-position: -200px; }
  to { background-position: 200px; }
}
.subtitle {
  font-size: 16px;
  color: #9aa0a6;
}

.search-box {
  margin-bottom: 25px;
  text-align: center;
}

.search-box input {
  width: 60%;
  max-width: 400px;
  padding: 12px 18px;
  border-radius: 14px;
  border: 1px solid #00ffd5;
  background: #121212;
  color: #ffffff;
  font-size: 16px;
  transition: box-shadow 0.3s, border 0.3s;
}

.search-box input::placeholder {
  color: #ffffff;
  font-weight: 500;
}

.search-box input:focus {
  outline: none;
  border-color: #00ffd5;
  box-shadow: 0 0 10px #00ffd5;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-radius: 18px;
  background: #1a1a1a;
  border: 1px solid #00ffd5;
  transition: transform 0.2s, box-shadow 0.3s;
}

.user-card:hover {
  transform: translateY(-3px);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-info .name {
  font-weight: 700;
  font-size: 16px;
  color: #00ffd5;
}

.user-info .email {
  font-size: 14px;
  color: #bbb;
}

.user-info .id {
  font-size: 12px;
  color: #777;
}

.user-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-actions select {
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid #00ffd5;
  background: #121212;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-actions select:focus {
  outline: none;
  border-color: #00ffee24;
  box-shadow: 0 0 8px #00fff0;
}

.user-actions button {
  padding: 8px 14px;
  border-radius: 12px;
  border: none;
  background: #1db954;
  color: #121212;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s, transform 0.2s;
}

.user-actions button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px #ff00ff2a, 0 0 10px #00fff0;
}

@media (max-width: 768px) {
  .user-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .user-actions {
    width: 100%;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .user-actions button,
  .user-actions select {
    flex: 1 1 45%;
    margin-bottom: 6px;
  }
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.modal-content {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 14px;
  max-width: 400px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-content textarea {
  width: 100%;
  min-height: 100px;
  background: #121212;
  border: 1px solid #00ffd5;
  border-radius: 12px;
  padding: 10px;
  color: #fff;
  resize: none;
  font-size: 14px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-buttons button {
  padding: 8px 14px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.modal-buttons button.cancel {
  background: #ff4d4d;
  color: #fff;
}

.modal-buttons button:not(.cancel) {
  background: #1db954;
  color: #121212;
}
</style>
