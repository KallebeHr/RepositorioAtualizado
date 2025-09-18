<template>
  <div class="upload-page">
    <header class="header">
      <h1 class="title">🚀 Upload de Músicas em Lote</h1>
      <p class="subtitle">Selecione várias músicas de uma vez, escolha cantor e estilo, e envie tudo!</p>
    </header>

    <div class="upload-card">
      <div class="form-group">
        <label>Arquivos das Músicas</label>
        <input type="file" multiple @change="handleMultipleFiles" accept="audio/*" />
      </div>

      <div class="form-group">
        <label>Estilo</label>
        <select v-model="selectedEstilo" @change="handleEstiloChange">
          <option disabled value="">Selecione o estilo</option>
          <option v-for="e in estilos" :key="e.id" :value="e.nome">{{ e.nome }}</option>
          <option value="__novo__">+ Adicionar novo estilo</option>
        </select>
      </div>

      <div v-if="selectedEstilo === '__novo__'" class="form-group">
        <label>Novo Estilo</label>
        <input v-model="novoEstilo" type="text" placeholder="Digite o novo estilo" />
        <button class="secondary" @click="addEstilo">Salvar Estilo</button>
      </div>

      <div class="form-group">
        <label>Cantor</label>
        <select v-model="selectedCantor" @change="handleCantorChange">
          <option disabled value="">Selecione o cantor</option>
          <option v-for="c in cantores" :key="c.id" :value="c.nome">{{ c.nome }}</option>
          <option value="__novo__">+ Adicionar novo cantor</option>
        </select>
      </div>

      <div v-if="selectedCantor === '__novo__'" class="form-group">
        <label>Novo Cantor</label>
        <input v-model="novoCantor" type="text" placeholder="Digite o novo cantor" />
        <button class="secondary" @click="addCantor">Salvar Cantor</button>
      </div>

      <div class="form-actions" v-if="musicForms.length">
        <button class="primary" :disabled="uploading" @click="uploadAll">
          {{ uploading ? "Enviando todas..." : "Enviar Todas as Músicas" }}
        </button>
      </div>
    </div>

    <div v-if="musicForms.length" class="preview">
      <h3>🎶 Músicas selecionadas:</h3>
      <ul>
        <li v-for="(m, i) in musicForms" :key="i">
          {{ m.title }} <span v-if="m.success">✅</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { db } from "@/firebase"
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore"
import axios from "axios"

const musicForms = ref([])
const cantores = ref([])
const estilos = ref([])
const selectedCantor = ref("")
const selectedEstilo = ref("")
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

function handleMultipleFiles(e) {
  const files = Array.from(e.target.files)
  musicForms.value = files.map(file => ({
    file,
    title: file.name.replace(/\.[^/.]+$/, ""), // remove extensão
    success: false
  }))
}

function handleCantorChange() {
  if (selectedCantor.value !== "__novo__") novoCantor.value = ""
}
function handleEstiloChange() {
  if (selectedEstilo.value !== "__novo__") novoEstilo.value = ""
}

async function addCantor() {
  if (!novoCantor.value) return
  const docRef = await addDoc(cantoresColRef, { nome: novoCantor.value })
  cantores.value.push({ id: docRef.id, nome: novoCantor.value })
  selectedCantor.value = novoCantor.value
  novoCantor.value = ""
}
async function addEstilo() {
  if (!novoEstilo.value) return
  const docRef = await addDoc(estilosColRef, { nome: novoEstilo.value })
  estilos.value.push({ id: docRef.id, nome: novoEstilo.value })
  selectedEstilo.value = novoEstilo.value
  novoEstilo.value = ""
}

async function uploadAll() {
  if (!selectedCantor.value || !selectedEstilo.value) {
    error.value = "Selecione cantor e estilo antes de enviar."
    return
  }
  uploading.value = true
  error.value = ""
  try {
    for (const form of musicForms.value) {
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
        tipo: [selectedEstilo.value],
        cantor: selectedCantor.value,
        createdAt: serverTimestamp(),
      })
      form.success = true
    }
  } catch (err) {
    console.error(err)
    error.value = "Erro ao enviar músicas."
  } finally {
    uploading.value = false
  }
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
  padding: 40px 0px;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
  .overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.8); /* escurece o fundo */
}
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
