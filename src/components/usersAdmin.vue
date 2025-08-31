<template>
  <div class="admin-container">
    <h1>Painel de Administração</h1>

    <!-- Busca -->
    <div class="search-box">
      <input
        v-model="search"
        type="text"
        placeholder="Procurar por nome, email ou ID"
      />
    </div>

    <!-- Lista de usuários -->
    <div class="user-list">
      <div
        class="user-card"
        v-for="user in filteredUsers"
        :key="user.uid"
      >
        <div class="user-info">
          <p><strong>{{ user.firstName }} {{ user.lastName }}</strong></p>
          <p>{{ user.email }}</p>
          <p>ID: {{ user.customID || user.uid }}</p>
        </div>

        <div class="user-actions">
          <select v-model="user.subscription" @change="updateSubscription(user)">
            <option value="nenhuma">Nenhuma</option>
            <option value="prata">Prata</option>
            <option value="ouro">Ouro</option>
            <option value="diamante">Diamante</option>
          </select>

          <button
            :class="user.disabled ? 'activate-btn' : 'disable-btn'"
            @click="toggleUserActive(user)"
          >
            <i :class="user.disabled ? 'fas fa-user-check' : 'fas fa-user-slash'"></i>
            {{ user.disabled ? 'Ativar' : 'Desativar' }}
          </button>

          <button class="message-btn" @click="sendMessage(user)">
            <i class="fas fa-envelope"></i> Mensagem
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import { db } from "@/firebase"
import { collection, getDocs, doc, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore"
import { useUserStore } from "@/stores/userStore"
import { useRouter } from "vue-router"

const router = useRouter()
const userStore = useUserStore()

const users = ref([])
const search = ref("")

// ✅ Espera o user carregar antes de verificar role
watch(
  () => userStore.user,
  async (val) => {
    if (val) {
      if (val.role !== "admin") {
        router.replace("/") // não é admin
      } else {
        await fetchUsers()
      }
    }
  },
  { immediate: true }
)

// Busca usuários
async function fetchUsers() {
  const snapshot = await getDocs(collection(db, "users"))
  users.value = snapshot.docs.map(doc => ({
    uid: doc.id,
    subscription: "nenhuma",
    ...doc.data()
  }))
}

// Filtrar usuários
const filteredUsers = computed(() => {
  if (!search.value) return users.value
  return users.value.filter(u =>
    (u.firstName?.toLowerCase() + " " + u.lastName?.toLowerCase()).includes(search.value.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.value.toLowerCase()) ||
    u.customID?.toLowerCase().includes(search.value.toLowerCase()) ||
    u.uid.includes(search.value)
  )
})

// Toggle ativo/desativado
async function toggleUserActive(user) {
  try {
    const userRef = doc(db, "users", user.uid)
    await updateDoc(userRef, { disabled: !user.disabled })
    user.disabled = !user.disabled
  } catch (err) {
    console.error("Erro ao atualizar status:", err)
  }
}

// Atualizar assinatura
async function updateSubscription(user) {
  try {
    const userRef = doc(db, "users", user.uid)
    await updateDoc(userRef, { subscription: user.subscription })
  } catch (err) {
    console.error("Erro ao atualizar assinatura:", err)
  }
}

// Enviar mensagem
async function sendMessage(user) {
  const msg = prompt(`Enviar mensagem para ${user.firstName}:`)
  if (!msg) return
  try {
    const userRef = doc(db, "users", user.uid)
    await updateDoc(userRef, { messages: arrayUnion(msg) })
    alert("Mensagem enviada!")
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err)
  }
}

// Excluir usuário
async function deleteUser(user) {
  const confirmDelete = confirm(`Deseja realmente excluir ${user.firstName}?`)
  if (!confirmDelete) return
  try {
    await deleteDoc(doc(db, "users", user.uid))
    users.value = users.value.filter(u => u.uid !== user.uid)
    alert("Usuário excluído!")
  } catch (err) {
    console.error("Erro ao excluir usuário:", err)
  }
}
</script>

<style scoped>
.admin-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  
}

.search-box {
  margin-bottom: 20px;
  text-align: center;
  
}

.search-box input {
  width: 60%;
  max-width: 400px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  
}

/* Lista */
.user-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  color: black;
  font-weight: 700;
  margin: 10px;
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #ccc;
  border-radius: 10px;
  background: #fff;
  transition: box-shadow 0.2s;

}

.user-card:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.user-info{
    margin: 10px;
}
.user-info p {
  margin: 2px 0;
}

/* Ações */
.user-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  color: #00d1b2;

}
.user-actions select{
    color: #00d1b2;

}
.user-actions select,
.user-actions button {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;

}

/* Botões */
.disable-btn {
  background-color: #e74c3c;
  color: #fff;
}
.disable-btn:hover {
  background-color: #c0392b;
}

.activate-btn {
  background-color: #27ae60;
  color: #fff;
}
.activate-btn:hover {
  background-color: #1e8449;
}

.message-btn {
  background-color: #3498db;
  color: #fff;
}
.message-btn:hover {
  background-color: #2980b9;
}

.delete-btn {
  background-color: #7f8c8d;
  color: #fff;
}
.delete-btn:hover {
  background-color: #606c70;
}

/* Mobile */
@media (max-width: 768px) {
  .user-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .user-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  .user-actions button,
  .user-actions select {
    flex: 1 1 45%;
    margin-bottom: 5px;
  }
}
</style>
