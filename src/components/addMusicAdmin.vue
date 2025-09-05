<template>
  <div class="upload-page">
    <header class="header">
      <h1 class="title">🚀 Upload de Música</h1>
      <p class="subtitle">Adicione suas músicas, cadastre estilos e cantores facilmente!</p>
    </header>

    <div v-for="(form, index) in musicForms" :key="index" class="upload-card">
      <div class="upload-form">
        <div class="form-group">
          <label>Arquivo da Música</label>
          <input type="file" @change="e => handleFileChange(e, index)" accept="audio/*" />
        </div>

        <div class="form-group">
          <label>Nome da Música</label>
          <input v-model="form.title" type="text" placeholder="Digite o nome da música" />
        </div>

        <div class="form-group">
          <label>Estilo</label>
          <select v-model="form.tipo" @change="handleEstiloChange(form)">
            <option disabled value="">Selecione o estilo</option>
            <option v-for="e in estilos" :key="e.id" :value="e.nome">{{ e.nome }}</option>
            <option value="__novo__">+ Adicionar novo estilo</option>
          </select>
        </div>

        <div v-if="form.tipo === '__novo__'" class="form-group">
          <label>Novo Estilo</label>
          <input v-model="novoEstilo" type="text" placeholder="Digite o novo estilo" />
          <button class="secondary" @click="addEstilo(form)">Salvar Estilo</button>
        </div>

        <div class="form-group">
          <label>Cantor</label>
          <select v-model="form.cantor" @change="handleCantorChange(form)">
            <option disabled value="">Selecione o cantor</option>
            <option v-for="c in cantores" :key="c.id" :value="c.nome">{{ c.nome }}</option>
            <option value="__novo__">+ Adicionar novo cantor</option>
          </select>
        </div>

        <div v-if="form.cantor === '__novo__'" class="form-group">
          <label>Novo Cantor</label>
          <input v-model="novoCantor" type="text" placeholder="Digite o nome do novo cantor" />
          <button class="secondary" @click="addCantor(form)">Salvar Cantor</button>
        </div>

        <div class="form-actions">
          <button
            :disabled="!form.file || !form.title || !form.tipo || !form.cantor || uploading"
            @click="uploadMusic(form, index)"
            class="primary"
          >
            {{ uploading ? "Enviando..." : "Enviar Música" }}
          </button>
        </div>

        <div v-if="uploading" class="status uploading">Enviando {{ form.file?.name }}...</div>
        <div v-if="error" class="status error">{{ error }}</div>
        <div v-if="form.success" class="status success">Música enviada com sucesso! 🎵</div>
      </div>
    </div>

    <div class="add-more">
      <button class="secondary" @click="addMoreForm">+ Adicionar mais música</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { db } from "@/firebase"
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore"
import axios from "axios"

const musicForms = ref([{ file: null, title: "", tipo: "", cantor: "", success: false }])
const cantores = ref([])
const estilos = ref([])
const novoCantor = ref("")
const novoEstilo = ref("")
const uploading = ref(false)
const error = ref("")

const cantoresColRef = collection(db, "cantores")
const estilosColRef = collection(db, "estilos")

async function fetchCantores() {
  const snapshot = await getDocs(cantoresColRef)
  cantores.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
async function fetchEstilos() {
  const snapshot = await getDocs(estilosColRef)
  estilos.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

function handleFileChange(e, index) {
  musicForms.value[index].file = e.target.files[0]
}

function handleCantorChange(form) {
  if (form.cantor !== "__novo__") novoCantor.value = ""
}
function handleEstiloChange(form) {
  if (form.tipo !== "__novo__") novoEstilo.value = ""
}

async function addCantor(form) {
  if (!novoCantor.value) return
  try {
    const docRef = await addDoc(cantoresColRef, { nome: novoCantor.value })
    cantores.value.push({ id: docRef.id, nome: novoCantor.value })
    form.cantor = novoCantor.value
    novoCantor.value = ""
  } catch (err) {
    console.error(err)
    error.value = "Erro ao salvar novo cantor."
  }
}

async function addEstilo(form) {
  if (!novoEstilo.value) return
  try {
    const docRef = await addDoc(estilosColRef, { nome: novoEstilo.value })
    estilos.value.push({ id: docRef.id, nome: novoEstilo.value })
    form.tipo = novoEstilo.value
    novoEstilo.value = ""
  } catch (err) {
    console.error(err)
    error.value = "Erro ao salvar novo estilo."
  }
}

async function uploadMusic(form, index) {
  if (!form.file || !form.title || !form.tipo || !form.cantor) return

  uploading.value = true
  error.value = ""
  form.success = false

  try {
    const formData = new FormData()
    formData.append("file", form.file)
    const { data } = await axios.post("http://localhost:3001/upload-music", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    const { fileId, downloadUrl } = data

    await addDoc(collection(db, "musicas"), {
      title: form.title,
      fileName: form.file.name,
      fileId,
      downloadUrl,
      tipo: [form.tipo],
      cantor: form.cantor,
      createdAt: serverTimestamp(),
    })

    form.success = true
  } catch (err) {
    console.error(err)
    error.value = "Erro ao enviar a música."
  } finally {
    uploading.value = false
  }
}

function addMoreForm() {
  musicForms.value.push({ file: null, title: "", tipo: "", cantor: "", success: false })
}

onMounted(() => {
  fetchCantores()
  fetchEstilos()
})
</script>

<style scoped>
.upload-page {
  width: 100%;
  min-height: 100vh;
  padding: 40px 20px;
  background: #0d0d0d;
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
  margin: 0 auto 20px;
  padding: 30px;
  border-radius: 20px;
  background: #181818;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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

.add-more {
  text-align: center;
  margin-top: 20px;
}
</style>
