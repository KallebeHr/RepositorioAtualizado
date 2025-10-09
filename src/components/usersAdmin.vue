<template>
  <div class="admin-container">
    <header class="header">
      <h1 class="title">🔍 Administração de Usuários</h1>
      <p class="subtitle">
        Gerencie contas, status de assinatura e envie mensagens diretas.
      </p>

      
    </header>

    <!-- Painel de estatísticas -->
    <section class="stats-panel">
      <div
        class="stat-card total"
        :class="{ active: selectedFilter === 'todos' }"
        @click="setFilter('todos')"
      >
        <h3>Total</h3>
        <p>{{ users.length }}</p> 
      </div>

      <div
        class="stat-card active"
        :class="{ active: selectedFilter === 'ativos' }"
        @click="setFilter('ativos')"
      >
        <h3>Ativos</h3>
        <p>{{ activeUsers }}</p>
      </div>

      <div
        class="stat-card normal"
        :class="{ active: selectedFilter === 'normais' }"
        @click="setFilter('normais')"
      >
        <h3>Normais</h3>
        <p>{{ normalUsers }}</p>
      </div>
    </section>

    <!-- Busca -->
    <div class="search-box">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar por nome, email, ID ou data (YYYY-MM-DD)"
      />
    </div>

    <!-- Lista de usuários -->
    <div class="user-list">
      <div v-for="user in filteredUsers" :key="user.uid" class="user-card">
        <div class="user-info">
          <p class="name">{{ user.firstName }} {{ user.lastName }}</p>
          <p class="email">{{ user.email }}</p>
          <p class="id">ID: {{ user.customID || user.uid }}</p>
          <p class="createdAt">Inscrito: {{ formatDate(user.createdAt) }}</p>
          <p v-if="user.subscription === 'ativa'" class="subscription-dates">
            Início: {{ formatDate(user.subscriptionStart) }} <br />
            Expira em: {{ formatDate(user.subscriptionEnd) }}
          </p>
        </div>

        <div class="user-actions">
          <select v-model="user.subscription" @change="updateSubscription(user)">
            <option value="" disabled>Selecionar status</option>
            <option value="normal">Normal</option>
            <option value="ativa">Ativa</option>
          </select>

          <button class="message-btn" @click="openMessageModal(user)">
            Mensagem
          </button>
        </div>
      </div>

      <div v-if="filteredUsers.length === 0" class="no-results">
        Nenhum usuário encontrado.
      </div>
    </div>

    <!-- Modal de mensagem -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeMessageModal">
      <div class="modal-content">
        <h3>Enviar mensagem para {{ selectedUser.firstName }}</h3>
        <textarea
          v-model="messageText"
          placeholder="Digite sua mensagem aqui..."
        ></textarea>
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
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useUserStore } from "@/stores/userStore";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const users = ref([]);
const search = ref("");
const selectedFilter = ref("todos");
const showModal = ref(false);
const selectedUser = ref(null);
const messageText = ref("");

// Observa se o admin está logado e carrega usuários
watch(
  () => userStore.user,
  async (val) => {
    if (val) {
      if (val.role !== "admin") router.replace("/");
      else await fetchUsers();
    }
  },
  { immediate: true }
);

// Busca usuários e atualiza assinaturas expiradas
async function fetchUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  const now = new Date();

  const fetchedUsers = [];
  for (const d of snapshot.docs) {
    const data = d.data();
    let subscription = data.subscription || "normal";
    let start = data.subscriptionStart
      ? new Date(data.subscriptionStart.seconds * 1000)
      : null;
    let end = data.subscriptionEnd
      ? new Date(data.subscriptionEnd.seconds * 1000)
      : null;

    // Expiração automática
    if (subscription === "ativa" && end && end < now) {
      const userRef = doc(db, "users", d.id);
      await updateDoc(userRef, {
        subscription: "normal",
        subscriptionStart: null,
        subscriptionEnd: null,
      });
      subscription = "normal";
      start = null;
      end = null;
    }

    fetchedUsers.push({
      uid: d.id,
      subscription,
      subscriptionStart: start,
      subscriptionEnd: end,
      ...data,
    });
  }

  users.value = fetchedUsers;
}

// Estatísticas
const activeUsers = computed(() =>
  users.value.filter((u) => u.subscription === "ativa").length
);
const normalUsers = computed(() =>
  users.value.filter((u) => u.subscription === "normal").length
);

// Função para mudar o filtro
function setFilter(type) {
  selectedFilter.value = type;
}

// Filtro principal (busca + tipo)
const filteredUsers = computed(() => {
  let list = [...users.value];

  if (selectedFilter.value === "ativos") {
    list = list.filter((u) => u.subscription === "ativa");
  } else if (selectedFilter.value === "normais") {
    list = list.filter((u) => u.subscription === "normal");
  }

  if (search.value) {
    const s = search.value.toLowerCase();
    list = list.filter((u) => {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = u.email?.toLowerCase() || "";
      const customID = u.customID?.toLowerCase() || "";
      const uid = u.uid?.toLowerCase() || "";
      const dateStr = u.createdAt ? formatDate(u.createdAt) : "";
      return (
        fullName.includes(s) ||
        email.includes(s) ||
        customID.includes(s) ||
        uid.includes(s) ||
        dateStr.includes(s)
      );
    });
  }

  return list;
});

// Formata datas
function formatDate(timestamp) {
  if (!timestamp) return "-";
  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
  return date.toLocaleDateString();
}

// Atualiza status de assinatura (ativa/normal)
async function updateSubscription(user) {
  try {
    const userRef = doc(db, "users", user.uid);

    if (user.subscription === "ativa") {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      await updateDoc(userRef, {
        subscription: "ativa",
        subscriptionStart: startDate,
        subscriptionEnd: endDate,
      });
      toast.success(
        `Assinatura ativada para ${user.firstName} até ${endDate.toLocaleDateString()}`
      );
    } else {
      await updateDoc(userRef, {
        subscription: "normal",
        subscriptionStart: null,
        subscriptionEnd: null,
      });
      toast.info(`Assinatura de ${user.firstName} foi removida.`);
    }

    await fetchUsers();
  } catch (err) {
    console.error(err);
    toast.error("Erro ao atualizar assinatura!");
  }
}

// Atribuir 30 dias a todos os usuários ativos
async function assignDatesToActiveUsers() {
  try {
    const activeList = users.value.filter(
      (u) => u.subscription === "ativa"
    );

    if (activeList.length === 0) {
      toast.info("Nenhum usuário ativo encontrado.");
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    for (const u of activeList) {
      const userRef = doc(db, "users", u.uid);
      await updateDoc(userRef, {
        subscriptionStart: startDate,
        subscriptionEnd: endDate,
      });
    }

    toast.success(`Datas aplicadas a ${activeList.length} usuários ativos!`);
    await fetchUsers();
  } catch (err) {
    console.error(err);
    toast.error("Erro ao atribuir datas!");
  }
}

// Modal de mensagem
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
    await updateDoc(userRef, {
      messages: arrayUnion(messageText.value.trim()),
    });
    toast.success(`Mensagem enviada para ${selectedUser.value.firstName}!`);
    closeMessageModal();
  } catch (err) {
    console.error(err);
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

/* Painel de estatísticas */
.stats-panel {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}.admin-container {
  padding: 20px;
}
.header {
  margin-bottom: 20px;
}
.stats-panel {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}
.stat-card {
  cursor: pointer;
  background: #f2f2f2;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  flex: 1;
  transition: 0.2s;
}
.stat-card.active {
  background: #d0e8ff;
}
.search-box {
  margin-bottom: 20px;
}
.user-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.user-card {
  display: flex;
  justify-content: space-between;
  background: #fafafa;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #eee;
}
.user-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
}
.modal-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
.subscription-dates {
  font-size: 0.9rem;
  color: #555;
  margin-top: 6px;
}

.stat-card {
  flex: 1 1 200px;
  background: #1a1a1a;
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  border: 1px solid #00ffd5;
  transition: transform 0.2s, box-shadow 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  transform: scale(1.05);
}



.stat-card h3 {
  color: #00ffd5;
  font-size: 16px;
  margin-bottom: 8px;
}

.stat-card p {
  font-size: 22px;
  font-weight: 700;
}

.stat-card.total p { color: #00c3ff; }
.stat-card.active p { color: #1db954; }
.stat-card.normal p { color: #ffb84d; }

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

.search-box input:focus {
  outline: none;
  border-color: #00ffd5;
  box-shadow: 0 0 10px #00ffd5;
}

/* Lista de usuários */
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

.user-info .createdAt {
  font-size: 12px;
  color: #00d1b2;
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
  box-shadow: 0 0 10px #00fff0;
}

.no-results {
  text-align: center;
  color: #bbb;
  margin-top: 20px;
  font-style: italic;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
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
}
</style>
