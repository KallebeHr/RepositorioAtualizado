<template>
  <div class="upload-page">
    <header class="header">
      <h1 class="title">🚀 Upload de Música</h1>
      <p class="subtitle">Adicione suas músicas, cadastre cantores e mantenha o repertório sempre atualizado!</p>
    </header>

    <div class="upload-card">
      <div class="upload-form">
        <div class="form-group">
          <label>Arquivo da Música</label>
          <input type="file" @change="handleFileChange" accept="audio/*" />
        </div>

        <div class="form-group">
          <label>Nome da Música</label>
          <input v-model="title" type="text" placeholder="Digite o nome da música" />
        </div>

        <div class="form-group">
          <label>Ritmo</label>
          <select v-model="tipo">
            <option disabled value="">Selecione o ritmo</option>
            <option value="pagode">Pagode</option>
            <option value="agosto">Agosto</option>
            <option value="menos é mais">Menos é mais</option>
            <option value="romance">Romance</option>
          </select>
        </div>

        <div class="form-group">
          <label>Cantor</label>
          <select v-model="cantor" @change="handleCantorChange">
            <option disabled value="">Selecione o cantor</option>
            <option v-for="c in cantores" :key="c.id" :value="c.nome">{{ c.nome }}</option>
            <option value="__novo__">+ Adicionar novo cantor</option>
          </select>
        </div>

        <div v-if="cantor === '__novo__'" class="form-group">
          <label>Novo Cantor</label>
          <input v-model="novoCantor" type="text" placeholder="Digite o nome do novo cantor" />
          <button class="secondary" @click="addCantor">Salvar Cantor</button>
        </div>

        <div class="form-actions">
          <button
            :disabled="!file || !title || !tipo || !cantor || uploading"
            @click="uploadMusic"
            class="primary"
          >
            {{ uploading ? "Enviando..." : "Enviar Música" }}
          </button>

          <button v-if="file" @click="addMoreMusic" class="secondary">
            Adicionar Mais
          </button>
        </div>

        <div v-if="uploading" class="status uploading">Enviando {{ file?.name }}...</div>
        <div v-if="error" class="status error">{{ error }}</div>
        <div v-if="success" class="status success">Música enviada com sucesso! 🎵</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { db } from "@/firebase"
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore"
import axios from "axios"

const file = ref(null)
const title = ref("")
const tipo = ref("")
const cantor = ref("")
const novoCantor = ref("")
const uploading = ref(false)
const success = ref(false)
const error = ref("")
const cantores = ref([])

function handleFileChange(e) {
  file.value = e.target.files[0]
}

async function fetchCantores() {
  const snapshot = await getDocs(collection(db, "cantores"))
  cantores.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

function handleCantorChange() {
  if (cantor.value !== "__novo__") novoCantor.value = ""
}

async function addCantor() {
  if (!novoCantor.value) return
  try {
    const docRef = await addDoc(collection(db, "cantores"), { nome: novoCantor.value })
    cantores.value.push({ id: docRef.id, nome: novoCantor.value })
    cantor.value = novoCantor.value
    novoCantor.value = ""
  } catch (err) {
    console.error(err)
    error.value = "Erro ao salvar novo cantor."
  }
}

async function uploadMusic() {
  if (!file.value || !title.value || !tipo.value || !cantor.value) return

  uploading.value = true
  error.value = ""
  success.value = false

  try {
    const formData = new FormData()
    formData.append("file", file.value)
    const { data } = await axios.post("http://localhost:3001/upload-music", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    const { fileId, downloadUrl } = data

    await addDoc(collection(db, "musicas"), {
      title: title.value,
      fileName: file.value.name,
      fileId,
      downloadUrl,
      tipo: [tipo.value],
      cantor: cantor.value,
      createdAt: serverTimestamp(),
    })

    success.value = true
    addMoreMusic()
  } catch (err) {
    console.error(err)
    error.value = "Erro ao enviar a música."
  } finally {
    uploading.value = false
  }
}

function addMoreMusic() {
  file.value = null
  title.value = ""
  tipo.value = ""
  cantor.value = ""
  success.value = false
}

onMounted(fetchCantores)
</script>

<style scoped>
.upload-page {
  width: 100%;
  min-height: 100vh;
  padding: 40px 20px;
  background: #111;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
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

.upload-card {
  max-width: 600px;
  margin: 0 auto;
  padding: 30px;
  border-radius: 20px;
  background: #181818;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #ccc;
}
input, select {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  background: #202020;
  color: #fff;
  font-size: 15px;
}
input:focus, select:focus {
  outline: none;
  border-color: #1db954;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}
button.primary, button.secondary {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
button.primary {
  background: #1db954;
  color: #0b0b0b;
}
button.primary:hover {
  filter: brightness(1.1);
}
button.secondary {
  background: #333;
  color: #eee;
}
button.secondary:hover {
  background: #444;
}

.status {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
}
.status.uploading { color: #f1c40f; }
.status.success { color: #1db954; }
.status.error { color: #e74c3c; }
</style>
