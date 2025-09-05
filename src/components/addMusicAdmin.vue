<template>
  <div class="upload-page">
    <!-- Header -->
    <header class="header">
      <h1 class="title">🚀 Upload de Música</h1>
      <p class="subtitle">
        Adicione músicas, cadastre novos cantores e estilos para deixar o repertório sempre atualizado!
      </p>
    </header>

    <!-- Lista de formulários -->
    <div v-for="(form, index) in forms" :key="index" class="upload-card">
      <div class="upload-form">
        <!-- Arquivo -->
        <div class="form-group">
          <label>Arquivo da Música</label>
          <input type="file" @change="e => handleFileChange(e, index)" accept="audio/*" />
        </div>

        <!-- Nome da música -->
        <div class="form-group">
          <label>Nome da Música</label>
          <input v-model="form.title" type="text" placeholder="Digite o nome da música" />
        </div>

        <!-- Estilo -->
        <div class="form-group">
          <label>Estilo</label>
          <select v-model="form.tipo" @change="() => handleTipoChange(index)">
            <option disabled value="">Selecione o estilo</option>
            <option v-for="e in estilos" :key="e.id" :value="e.nome">{{ e.nome }}</option>
            <option value="__novo__">+ Adicionar novo estilo</option>
          </select>
        </div>

        <!-- Novo estilo -->
        <div v-if="form.tipo === '__novo__'" class="form-group">
          <label>Novo Estilo</label>
          <input v-model="form.novoTipo" type="text" placeholder="Digite o novo estilo" />
          <button class="secondary" @click="addEstilo(index)">Salvar Estilo</button>
        </div>

        <!-- Cantor -->
        <div class="form-group">
          <label>Cantor</label>
          <select v-model="form.cantor" @change="() => handleCantorChange(index)">
            <option disabled value="">Selecione o cantor</option>
            <option v-for="c in cantores" :key="c.id" :value="c.nome">{{ c.nome }}</option>
            <option value="__novo__">+ Adicionar novo cantor</option>
          </select>
        </div>

        <!-- Novo cantor -->
        <div v-if="form.cantor === '__novo__'" class="form-group">
          <label>Novo Cantor</label>
          <input v-model="form.novoCantor" type="text" placeholder="Digite o nome do novo cantor" />
          <button class="secondary" @click="addCantor(index)">Salvar Cantor</button>
        </div>

        <!-- Botões -->
        <div class="form-actions">
          <button
            :disabled="!form.file || !form.title || !form.tipo || !form.cantor || form.uploading"
            @click="uploadMusic(index)"
            class="primary"
          >
            {{ form.uploading ? "Enviando..." : "Enviar Música" }}
          </button>

          <button v-if="index === forms.length - 1" @click="addMoreMusic" class="secondary">
            + Adicionar Mais
          </button>
        </div>

        <!-- Status -->
        <div v-if="form.uploading" class="status uploading">Enviando {{ form.file?.name }}...</div>
        <div v-if="form.error" class="status error">{{ form.error }}</div>
        <div v-if="form.success" class="status success">Música enviada com sucesso! 🎵</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { db } from "@/firebase"
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore"
import axios from "axios"

const cantores = ref([])
const estilos = ref([])

const forms = ref([
  {
    file: null,
    title: "",
    tipo: "",
    cantor: "",
    novoCantor: "",
    novoTipo: "",
    uploading: false,
    success: false,
    error: "",
  },
])

function handleFileChange(e, index) {
  forms.value[index].file = e.target.files[0]
}

function handleCantorChange(index) {
  if (forms.value[index].cantor !== "__novo__") forms.value[index].novoCantor = ""
}

function handleTipoChange(index) {
  if (forms.value[index].tipo !== "__novo__") forms.value[index].novoTipo = ""
}

async function addCantor(index) {
  const form = forms.value[index]
  if (!form.novoCantor) return
  try {
    const docRef = await addDoc(collection(db, "cantores"), { nome: form.novoCantor })
    cantores.value.push({ id: docRef.id, nome: form.novoCantor })
    form.cantor = form.novoCantor
    form.novoCantor = ""
  } catch (err) {
    console.error(err)
    form.error = "Erro ao salvar novo cantor."
  }
}

async function addEstilo(index) {
  const form = forms.value[index]
  if (!form.novoTipo) return
  try {
    const docRef = await addDoc(collection(db, "estilos"), { nome: form.novoTipo })
    estilos.value.push({ id: docRef.id, nome: form.novoTipo })
    form.tipo = form.novoTipo
    form.novoTipo = ""
  } catch (err) {
    console.error(err)
    form.error = "Erro ao salvar novo estilo."
  }
}

async function uploadMusic(index) {
  const form = forms.value[index]
  if (!form.file || !form.title || !form.tipo || !form.cantor) return

  form.uploading = true
  form.error = ""
  form.success = false

  try {
    const formData = new FormData()
    formData.append("file", form.file)
    const { data } = await axios.post("/api/upload-music", formData, {
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
    form.error = "Erro ao enviar a música."
  } finally {
    form.uploading = false
  }
}

function addMoreMusic() {
  forms.value.push({
    file: null,
    title: "",
    tipo: "",
    cantor: "",
    novoCantor: "",
    novoTipo: "",
    uploading: false,
    success: false,
    error: "",
  })
}

async function fetchCantores() {
  const snapshot = await getDocs(collection(db, "cantores"))
  cantores.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

async function fetchEstilos() {
  const snapshot = await getDocs(collection(db, "estilos"))
  estilos.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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
  background: #111;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
}

/* Header */
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
  from {
    background-position: -200px;
  }
  to {
    background-position: 200px;
  }
}
.subtitle {
  font-size: 16px;
  color: #9aa0a6;
}

/* Card */
.upload-card {
  max-width: 600px;
  margin: 0 auto 20px;
  padding: 30px;
  border-radius: 20px;
  background: #181818;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* Formulário */
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
input,
select {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #2a2a2a;
  background: #202020;
  color: #fff;
  font-size: 15px;
}
input:focus,
select:focus {
  outline: none;
  border-color: #1db954;
}

/* Botões */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}
button.primary,
button.secondary {
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

/* Status */
.status {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
}
.status.uploading {
  color: #f1c40f;
}
.status.success {
  color: #1db954;
}
.status.error {
  color: #e74c3c;
}
</style>
