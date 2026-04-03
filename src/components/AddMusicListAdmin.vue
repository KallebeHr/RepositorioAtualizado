<template>
  <div class="upload-page">
    <header class="header">
      <h1 class="title">🚀 Upload de Músicas em Lote</h1>
      <p class="subtitle">Selecione várias músicas, escolha cantor e estilo, e envie tudo!</p>
    </header>

    <div class="upload-card">
      <div class="form-group">
        <label>Arquivos das Músicas</label>
        <input type="file" multiple @change="handleMultipleFiles" accept="audio/*" />
      </div>

      <div class="form-group">
        <label>Estilo</label>
        <div class="input-with-action">
          <select v-model="selectedEstilo" @change="handleEstiloChange">
            <option disabled value="">Selecione o estilo</option>
            <option v-for="e in estilos" :key="e.id" :value="e.nome">{{ e.nome }}</option>
            <option value="__novo__">+ Adicionar novo estilo</option>
          </select>
          <button class="action-btn" @click="openEditModal('estilos')">✏️ Alterar</button>
        </div>
      </div>

      <div v-if="selectedEstilo === '__novo__'" class="form-group">
        <input v-model="novoEstilo" type="text" placeholder="Digite o novo estilo" />
        <button class="secondary" @click="addEstilo">Salvar Estilo</button>
      </div>

      <div class="form-group">
        <label>Cantor</label>
        <div class="input-with-action">
          <select v-model="selectedCantor" @change="handleCantorChange">
            <option disabled value="">Selecione o cantor</option>
            <option v-for="c in cantores" :key="c.id" :value="c.nome">{{ c.nome }}</option>
            <option value="__novo__">+ Adicionar novo cantor</option>
          </select>
          <button class="action-btn" @click="openEditModal('cantores')">✏️ Alterar</button>
        </div>
      </div>

      <div v-if="selectedCantor === '__novo__'" class="form-group">
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
        <li v-for="(m, i) in musicForms" :key="i" class="music-item">
          <div class="music-info"><strong>{{ m.title }}</strong><span v-if="m.success">✅</span></div>
          <v-progress-linear :model-value="m.progress" height="8" color="blue" rounded striped></v-progress-linear>
          <small>{{ m.progress }}%</small>
        </li>
      </ul>
    </div>

    <div v-if="isEditingModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h2>Alterar {{ editingType === 'cantores' ? 'Cantor' : 'Estilo' }}</h2>
        <p v-if="isUpdatingAll" class="updating-warning">⚠️ Atualizando todas as músicas vinculadas... Aguarde.</p>
        
        <div v-if="!editingItem">
          <ul class="edit-list">
            <li v-for="item in currentEditList" :key="item.id" @click="selectItemToEdit(item)">{{ item.nome }}</li>
          </ul>
        </div>

        <div v-else class="edit-form">
          <label>Novo nome para "{{ editingItem.oldName }}":</label>
          <input v-model="newEditName" type="text" :disabled="isUpdatingAll" />
          <div class="modal-actions">
            <button class="primary" @click="saveEdit" :disabled="isUpdatingAll">Salvar em Tudo</button>
            <button class="secondary" @click="editingItem = null" :disabled="isUpdatingAll">Voltar</button>
          </div>
        </div>
        <button class="close-modal-btn" @click="closeModal" :disabled="isUpdatingAll">❌ Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import { db } from "@/firebase"
import { 
  collection, addDoc, getDocs, serverTimestamp, doc, 
  updateDoc, query, where, writeBatch 
} from "firebase/firestore"
import axios from "axios"

// Estados
const musicForms = ref([])
const cantores = ref([])
const estilos = ref([])
const selectedCantor = ref("")
const selectedEstilo = ref("")
const novoCantor = ref("")
const novoEstilo = ref("")
const uploading = ref(false)
const isUpdatingAll = ref(false) // Trava o modal enquanto atualiza tudo

// Modal
const isEditingModalOpen = ref(false)
const editingType = ref("")
const editingItem = ref(null)
const newEditName = ref("")

const cantoresColRef = collection(db, "cantores")
const estilosColRef = collection(db, "estilos")
const musicasColRef = collection(db, "musicas")

// Carregar Dados
async function fetchCantores() {
  const snapshot = await getDocs(cantoresColRef)
  cantores.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
async function fetchEstilos() {
  const snapshot = await getDocs(estilosColRef)
  estilos.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const currentEditList = computed(() => editingType.value === 'cantores' ? cantores.value : estilos.value)

function openEditModal(type) {
  editingType.value = type
  isEditingModalOpen.value = true
  editingItem.value = null
}

function selectItemToEdit(item) {
  editingItem.value = { ...item, oldName: item.nome }
  newEditName.value = item.nome
}

// ==========================================
// LÓGICA PRINCIPAL: ATUALIZAÇÃO EM CASCATA
// ==========================================
async function saveEdit() {
  if (!newEditName.value || !editingItem.value || newEditName.value === editingItem.value.oldName) return

  isUpdatingAll.value = true
  const batch = writeBatch(db)
  const oldName = editingItem.value.oldName
  const newName = newEditName.value

  try {
    // 1. Atualizar o nome na coleção mestre (Cantores ou Estilos)
    const masterDocRef = doc(db, editingType.value, editingItem.value.id)
    batch.update(masterDocRef, { nome: newName })

    // 2. Buscar músicas que usam esse nome
    let q;
    if (editingType.value === 'cantores') {
      // Busca músicas onde o campo 'cantor' é igual ao antigo
      q = query(musicasColRef, where("cantor", "==", oldName))
    } else {
      // Busca músicas onde o array 'tipo' contém o antigo
      q = query(musicasColRef, where("tipo", "array-contains", oldName))
    }

    const musicSnap = await getDocs(q)
    
    musicSnap.forEach((musicDoc) => {
      const musicRef = doc(db, "musicas", musicDoc.id)
      
      if (editingType.value === 'cantores') {
        batch.update(musicRef, { cantor: newName })
      } else {
        // Para array de estilos, precisamos remover o antigo e colocar o novo
        const tiposAtuais = musicDoc.data().tipo || []
        const novosTipos = tiposAtuais.map(t => t === oldName ? newName : t)
        batch.update(musicRef, { tipo: novosTipos })
      }
    })

    // 3. Executar todas as mudanças de uma vez no Firebase
    await batch.commit()

    // 4. Atualizar interface local
    if (editingType.value === 'cantores') {
      await fetchCantores()
      if (selectedCantor.value === oldName) selectedCantor.value = newName
    } else {
      await fetchEstilos()
      if (selectedEstilo.value === oldName) selectedEstilo.value = newName
    }

    alert("Sucesso! O nome foi alterado em todos os registros.")
    closeModal()
  } catch (err) {
    console.error("Erro ao atualizar em cascata:", err)
    alert("Erro ao atualizar documentos.")
  } finally {
    isUpdatingAll.value = false
  }
}

function closeModal() {
  if (isUpdatingAll.value) return
  isEditingModalOpen.value = false
  editingItem.value = null
}

// Restante das funções (handleMultipleFiles, uploadAll, etc) permanecem iguais...
function handleMultipleFiles(e) {
  const files = Array.from(e.target.files)
  musicForms.value = files.map(file => ({
    file, title: file.name.replace(/\.[^/.]+$/, ""), success: false, progress: 0
  }))
}

function handleCantorChange() { if (selectedCantor.value !== "__novo__") novoCantor.value = "" }
function handleEstiloChange() { if (selectedEstilo.value !== "__novo__") novoEstilo.value = "" }

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
  if (!selectedCantor.value || !selectedEstilo.value) return
  uploading.value = true
  try {
    for (const form of musicForms.value) {
      const formData = new FormData()
      formData.append("file", form.file)
      const { data } = await axios.post("http://localhost:3001/upload-music", formData, {
        onUploadProgress: (event) => {
          if (event.total) form.progress = Math.round((event.loaded * 100) / event.total)
        }
      })
      await addDoc(collection(db, "musicas"), {
        title: form.title,
        fileId: data.fileId,
        downloadUrl: data.downloadUrl,
        tipo: [selectedEstilo.value],
        cantor: selectedCantor.value,
        createdAt: serverTimestamp(),
      })
      form.success = true
    }
  } catch (err) { console.error(err) } finally { uploading.value = false }
}

onMounted(() => { fetchCantores(); fetchEstilos(); })
</script>

<style scoped>
/* Reutilize os estilos anteriores e adicione estes: */
.updating-warning {
  background: #f1c40f;
  color: #000;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
}

.modal-content button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ... (demais estilos do CSS anterior) ... */
.upload-page { width: 100%; min-height: 100vh; padding: 40px 0px; color: #fff; font-family: Inter, system-ui, sans-serif; }
.header { text-align: center; margin-bottom: 30px; }
.title { font-size: 36px; font-weight: 900; background: linear-gradient(90deg, #1db954, #00c3ff, #1db954); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.upload-card { max-width: 600px; margin: 0 auto 20px; padding: 30px; border-radius: 20px; background: #181818; }
.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.input-with-action { display: flex; gap: 10px; }
input, select { padding: 12px; border-radius: 10px; background: #202020; color: #fff; border: 1px solid #2a2a2a; width: 100%; }
.action-btn { background: #333; color: #fff; padding: 0 15px; border-radius: 10px; cursor: pointer; border: none; }
button.primary { background: #1db954; color: #000; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; border: none; width: 100%; }
button.secondary { background: #333; color: #fff; padding: 10px; border-radius: 10px; cursor: pointer; border: none; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: #181818; padding: 30px; border-radius: 15px; width: 400px; position: relative; }
.edit-list { list-style: none; padding: 0; max-height: 200px; overflow-y: auto; border: 1px solid #333; }
.edit-list li { padding: 10px; border-bottom: 1px solid #333; cursor: pointer; }
.edit-list li:hover { background: #222; color: #1db954; }
.modal-actions { display: flex; gap: 10px; margin-top: 15px; }
</style>