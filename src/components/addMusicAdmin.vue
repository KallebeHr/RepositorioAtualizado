<template>
  <div class="upload-container">
    <h2>Upload de Músicas</h2>

    <!-- Loop para múltiplas músicas -->
    <div 
      v-for="(music, index) in musicas" 
      :key="index" 
      class="music-card"
    >
      <h3>Música {{ index + 1 }}</h3>

      <input type="file" @change="e => handleFileChange(e, index)" accept="audio/*" />
      <input v-model="music.title" type="text" placeholder="Nome da música" />

      <!-- Select de cantor -->
      <div class="select-container">
        <select v-model="music.cantor">
          <option disabled value="">Selecione o cantor</option>
          <option v-for="c in cantores" style="color: black;" :key="c.id" :value="c.nome">{{ c.nome }}</option>
        </select>
        <!-- Botão para adicionar novo cantor -->
        <button type="button" class="btn-secondary" @click="abrirModalCantor = true">
          + Novo Cantor
        </button>
      </div>

      <!-- Ritmos (múltiplos) -->
      <div class="tags">
        <label v-for="tipo in tipos" :key="tipo">
          <input 
            type="checkbox" 
            :value="tipo" 
            v-model="music.tipos" 
          />
          {{ tipo }}
        </label>
      </div>
    </div>

    <!-- Botão para adicionar mais músicas -->
    <button type="button" class="btn-secondary" @click="adicionarMusica">
      + Adicionar mais música
    </button>

    <!-- Botão de envio -->
    <button 
      :disabled="uploading || musicas.length === 0" 
      @click="uploadMusics" 
      class="btn-primary"
    >
      {{ uploading ? "Enviando..." : "Enviar todas as músicas" }}
    </button>

    <!-- Status -->
    <div v-if="uploading" class="status">Enviando músicas...</div>
    <div v-if="error" class="status error">{{ error }}</div>
    <div v-if="success" class="status success">Todas músicas foram enviadas! 🎶</div>

    <!-- Modal para novo cantor -->
    <div v-if="abrirModalCantor" class="modal">
      <div class="modal-content">
        <h3>Novo Cantor</h3>
        <input v-model="novoCantor" type="text" placeholder="Nome do cantor" />
        <div class="modal-actions">
          <button class="btn-primary" @click="adicionarCantor">Salvar</button>
          <button class="btn-secondary" @click="abrirModalCantor = false">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { db } from "@/firebase"
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore"
import axios from "axios"

const musicas = ref([{ file: null, title: "", cantor: "", tipos: [] }])
const cantores = ref([])
const novoCantor = ref("")
const abrirModalCantor = ref(false)

const uploading = ref(false)
const success = ref(false)
const error = ref("")

const tipos = ["Pagode", "Agosto", "Menos é mais", "Romance"]

// Buscar lista de cantores do Firestore
async function carregarCantores() {
  const snapshot = await getDocs(collection(db, "cantores"))
  cantores.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

onMounted(() => {
  carregarCantores()
})

// Adicionar novo cantor
async function adicionarCantor() {
  if (!novoCantor.value.trim()) return
  const docRef = await addDoc(collection(db, "cantores"), {
    nome: novoCantor.value,
    createdAt: serverTimestamp(),
  })
  cantores.value.push({ id: docRef.id, nome: novoCantor.value })
  novoCantor.value = ""
  abrirModalCantor.value = false
}

// Manipular arquivos
function handleFileChange(e, index) {
  musicas.value[index].file = e.target.files[0]
}

// Adicionar mais músicas
function adicionarMusica() {
  musicas.value.push({ file: null, title: "", cantor: "", tipos: [] })
}

// Upload múltiplo
async function uploadMusics() {
  uploading.value = true
  error.value = ""
  success.value = false

  try {
    for (const music of musicas.value) {
      if (!music.file || !music.title || !music.cantor || music.tipos.length === 0) {
        throw new Error("Preencha todos os campos antes de enviar.")
      }

      const formData = new FormData()
      formData.append("file", music.file)

      const { data } = await axios.post("http://localhost:3001/upload-music", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const { fileId, downloadUrl } = data

      await addDoc(collection(db, "musicas"), {
        title: music.title,
        cantor: music.cantor,
        tipos: music.tipos,
        fileName: music.file.name,
        fileId,
        downloadUrl,
        createdAt: serverTimestamp(),
      })
    }

    success.value = true
    musicas.value = [{ file: null, title: "", cantor: "", tipos: [] }]
  } catch (err) {
    console.error(err)
    error.value = err.message || "Erro ao enviar músicas."
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.upload-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  border-radius: 12px;
  background: #111;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.music-card {
  padding: 15px;
  border: 1px solid #333;
  border-radius: 10px;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input, select {
  padding: 10px;
  border-radius: 6px;
  border: none;
  outline: none;
  width: 100%;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-primary {
  background: #00d1b2;
  color: #111;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
}
.btn-primary:hover { background: #00b894; }

.btn-secondary {
  background: transparent;
  border: 1px solid #444;
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: 0.2s;
}
.btn-secondary:hover { background: #333; }

.status.success { color: #27ae60; }
.status.error { color: #e74c3c; }

/* Modal minimalista */
.modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
  background: rgba(0,0,0,0.6);
}
.modal-content {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
  display: flex; flex-direction: column; gap: 15px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
