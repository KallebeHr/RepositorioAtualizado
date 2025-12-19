<template>
  <div class="keys-container">
    <header class="header">
      <h1 class="title">🔑 Gerenciamento de Chaves</h1>
      <p class="subtitle">Adicione, remova e visualize suas chaves do sistema</p>
    </header>

    <div class="add-key">
      <!-- Botão para chave aleatória -->
      <button @click="addRandomKey">Adicionar Chave Aleatória</button>

      <!-- Input para chave manual -->
      <input
        v-model="manualKey"
        type="text"
        placeholder="Digite uma chave manual"
      />
      <button @click="addManualKey">Adicionar Chave Manual</button>
    </div>

    <div class="key-list">
      <div
        class="key-card"
        v-for="(key, index) in keys"
        :key="key"
      >
        <span class="key-text">{{ key }}</span>
        <button class="delete-btn" @click="removeKey(key)">Excluir</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { db } from "@/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, setDoc  } from "firebase/firestore";

const keys = ref([]);
const manualKey = ref("");
let keysDocRef = null; 

async function fetchKeys() {
  const colRef = collection(db, "Chaves");
  const snapshot = await getDocs(colRef);

  // 👉 Se NÃO existir nenhum documento
  if (snapshot.empty) {
    const newDocRef = doc(colRef); // gera ID automático

    await setDoc(newDocRef, {
      Keys: []
    });

    keysDocRef = newDocRef;
    keys.value = [];
    return;
  }

  // 👉 Se já existir
  const docSnap = snapshot.docs[0];
  keysDocRef = doc(db, "Chaves", docSnap.id);
  keys.value = docSnap.data().Keys || [];
}

// Adiciona chave aleatória
async function addRandomKey() {
  if (!keysDocRef) return;
  const newKey = crypto.randomUUID();
  try {
    await updateDoc(keysDocRef, {
      Keys: arrayUnion(newKey)
    });
    keys.value.push(newKey);
  } catch (err) {
    console.error("Erro ao adicionar chave:", err);
  }
}

// Adiciona chave manual
async function addManualKey() {
  if (!keysDocRef) return;
  const key = manualKey.value.trim();
  console.log('entrou')
  if (!key) return;
  try {
    await updateDoc(keysDocRef, {
      Keys: arrayUnion(key)
    });
    keys.value.push(key);
    manualKey.value = "";
  } catch (err) {
    console.error("Erro ao adicionar chave manual:", err);
  }
}

// Remove chave
async function removeKey(keyToRemove) {
  if (!keysDocRef) return;
  try {
    await updateDoc(keysDocRef, {
      Keys: arrayRemove(keyToRemove)
    });
    keys.value = keys.value.filter(k => k !== keyToRemove);
  } catch (err) {
    console.error("Erro ao remover chave:", err);
  }
}

onMounted(fetchKeys);
</script>

<style scoped>
.keys-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Orbitron", sans-serif;
  color: #fff;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(90deg, #ff00ff, #00fff0, #ff00ff);
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

.add-key {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 25px;
}

.add-key input {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #00ffd5;
  background: #121212;
  color: #fff;
  font-size: 14px;
}

.add-key input::placeholder {
  color: #fff;
}

.add-key button {
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  background: #1db954;

  color: #121212;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s, transform 0.2s;
}

.add-key button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px #ff00ff2a, 0 0 10px #00fff0;
}

.key-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.key-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-radius: 14px;
  background: #1a1a1a;
  border: 1px solid #00ffd5;
  transition: transform 0.2s, box-shadow 0.3s;
}

.key-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 10px #00ffd5;
}

.key-text {
  font-weight: 600;
  color: #00ffd5;
}

.delete-btn {
  padding: 6px 12px;
  border-radius: 10px;
  border: none;
  background: #ff4c4c;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s, transform 0.2s;
}

.delete-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px #ff4c4c2a;
}

/* Mobile */
@media (max-width: 768px) {
  .add-key {
    flex-direction: column;
    align-items: center;
  }

  .add-key input,
  .add-key button {
    width: 100%;
    flex: 1;
  }
}
</style>
