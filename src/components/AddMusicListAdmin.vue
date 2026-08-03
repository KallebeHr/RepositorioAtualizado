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
        <small class="hint">Você pode selecionar várias músicas de uma vez.</small>
      </div>

      <!-- ESTILO com busca -->
      <div class="form-group">
        <label>Estilo</label>
        <div class="input-with-action">
          <div class="searchable-select" v-click-outside="closeEstiloDropdown">
            <div class="searchable-select__control" @click="openEstiloDropdown">
              <span :class="{ placeholder: !selectedEstilo || selectedEstilo === '__novo__' }">
                {{ selectedEstilo && selectedEstilo !== '__novo__' ? selectedEstilo : 'Selecione o estilo' }}
              </span>
              <span class="arrow">▾</span>
            </div>

            <div v-if="estiloDropdownOpen" class="searchable-select__panel">
              <input
                ref="estiloSearchInput"
                v-model="searchEstilo"
                type="text"
                class="searchable-select__search"
                placeholder="🔎 Buscar estilo..."
                @click.stop
              />
              <ul class="searchable-select__list">
                <li
                  v-for="e in filteredEstilos"
                  :key="e.id"
                  @click="pickEstilo(e.nome)"
                  :class="{ active: e.nome === selectedEstilo }"
                >
                  {{ e.nome }}
                </li>
                <li v-if="!filteredEstilos.length" class="empty">
                  Nenhum estilo encontrado para "{{ searchEstilo }}"
                </li>
                <li class="new-option" @click="pickEstilo('__novo__')">
                  + Adicionar novo estilo
                </li>
              </ul>
            </div>
          </div>
          <button class="action-btn" @click="openEditModal('estilos')">✏️ Alterar</button>
        </div>
      </div>

      <div v-if="selectedEstilo === '__novo__'" class="form-group">
        <input v-model="novoEstilo" type="text" placeholder="Digite o novo estilo" />
        <button class="secondary" @click="addEstilo">Salvar Estilo</button>
      </div>

      <!-- CANTOR com busca -->
      <div class="form-group">
        <label>Cantor</label>
        <div class="input-with-action">
          <div class="searchable-select" v-click-outside="closeCantorDropdown">
            <div class="searchable-select__control" @click="openCantorDropdown">
              <span :class="{ placeholder: !selectedCantor || selectedCantor === '__novo__' }">
                {{ selectedCantor && selectedCantor !== '__novo__' ? selectedCantor : 'Selecione o cantor' }}
              </span>
              <span class="arrow">▾</span>
            </div>

            <div v-if="cantorDropdownOpen" class="searchable-select__panel">
              <input
                ref="cantorSearchInput"
                v-model="searchCantor"
                type="text"
                class="searchable-select__search"
                placeholder="🔎 Buscar cantor..."
                @click.stop
              />
              <ul class="searchable-select__list">
                <li
                  v-for="c in filteredCantores"
                  :key="c.id"
                  @click="pickCantor(c.nome)"
                  :class="{ active: c.nome === selectedCantor }"
                >
                  {{ c.nome }}
                </li>
                <li v-if="!filteredCantores.length" class="empty">
                  Nenhum cantor encontrado para "{{ searchCantor }}"
                </li>
                <li class="new-option" @click="pickCantor('__novo__')">
                  + Adicionar novo cantor
                </li>
              </ul>
            </div>
          </div>
          <button class="action-btn" @click="openEditModal('cantores')">✏️ Alterar</button>
        </div>
      </div>

      <div v-if="selectedCantor === '__novo__'" class="form-group">
        <input v-model="novoCantor" type="text" placeholder="Digite o novo cantor" />
        <button class="secondary" @click="addCantor">Salvar Cantor</button>
      </div>

      <div class="form-actions" v-if="musicForms.length">
        <button class="primary" :disabled="uploading || !selectedCantor || !selectedEstilo" @click="uploadAll">
          {{ uploading ? "Enviando todas..." : "Enviar Todas as Músicas" }}
        </button>
        <small v-if="!selectedCantor || !selectedEstilo" class="hint warn">
          Selecione um cantor e um estilo para poder enviar.
        </small>
      </div>
    </div>

    <div v-if="musicForms.length" class="preview">
      <h3>🎶 Músicas selecionadas ({{ musicForms.length }}):</h3>
      <ul>
        <li v-for="(m, i) in musicForms" :key="i" class="music-item">
          <div class="music-info"><strong>{{ m.title }}</strong><span v-if="m.success">✅</span></div>
          <v-progress-linear :model-value="m.progress" height="8" color="blue" rounded striped></v-progress-linear>
          <small>{{ m.progress }}%</small>
        </li>
      </ul>
    </div>

    <!-- MODAL DE EDIÇÃO com busca -->
    <div v-if="isEditingModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h2>Alterar {{ editingType === 'cantores' ? 'Cantor' : 'Estilo' }}</h2>
        <p v-if="isUpdatingAll" class="updating-warning">⚠️ Atualizando todas as músicas vinculadas... Aguarde.</p>

        <div v-if="!editingItem">
          <input
            v-model="searchEditItem"
            type="text"
            class="modal-search"
            :placeholder="editingType === 'cantores' ? '🔎 Buscar cantor...' : '🔎 Buscar estilo...'"
          />
          <ul class="edit-list">
            <li v-for="item in filteredEditList" :key="item.id" @click="selectItemToEdit(item)">{{ item.nome }}</li>
            <li v-if="!filteredEditList.length" class="empty">Nenhum resultado para "{{ searchEditItem }}"</li>
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
import { ref, onMounted, computed, nextTick } from "vue"
import { db } from "@/firebase"
import { 
  collection, addDoc, getDocs, serverTimestamp, doc, 
  updateDoc, query, where, writeBatch 
} from "firebase/firestore"
import axios from "axios"

// ==========================================
// Estados originais (NÃO alterados)
// ==========================================
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

// ==========================================
// NOVO: estados apenas de UI para a busca
// (não interferem em nenhuma função original)
// ==========================================
const estiloDropdownOpen = ref(false)
const cantorDropdownOpen = ref(false)
const searchEstilo = ref("")
const searchCantor = ref("")
const searchEditItem = ref("")
const estiloSearchInput = ref(null)
const cantorSearchInput = ref(null)

// Carregar Dados (função original, intacta)
async function fetchCantores() {
  const snapshot = await getDocs(cantoresColRef)
  cantores.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
async function fetchEstilos() {
  const snapshot = await getDocs(estilosColRef)
  estilos.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

const currentEditList = computed(() => editingType.value === 'cantores' ? cantores.value : estilos.value)

// NOVO: lista filtrada usada no modal (baseada na computed original, sem alterá-la)
const filteredEditList = computed(() => {
  const term = searchEditItem.value.trim().toLowerCase()
  if (!term) return currentEditList.value
  return currentEditList.value.filter(item => item.nome.toLowerCase().includes(term))
})

// NOVO: listas filtradas para os dropdowns de cantor/estilo
const filteredEstilos = computed(() => {
  const term = searchEstilo.value.trim().toLowerCase()
  if (!term) return estilos.value
  return estilos.value.filter(e => e.nome.toLowerCase().includes(term))
})
const filteredCantores = computed(() => {
  const term = searchCantor.value.trim().toLowerCase()
  if (!term) return cantores.value
  return cantores.value.filter(c => c.nome.toLowerCase().includes(term))
})

function openEditModal(type) {
  editingType.value = type
  isEditingModalOpen.value = true
  editingItem.value = null
  searchEditItem.value = "" // reinicia busca ao abrir o modal
}

function selectItemToEdit(item) {
  editingItem.value = { ...item, oldName: item.nome }
  newEditName.value = item.nome
}

// ==========================================
// LÓGICA PRINCIPAL: ATUALIZAÇÃO EM CASCATA
// (função original, intacta)
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

// Restante das funções originais (intactas)
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

// ==========================================
// NOVO: funções auxiliares apenas de UI (dropdown com busca)
// Elas só definem selectedCantor/selectedEstilo e chamam
// as funções originais handleCantorChange/handleEstiloChange.
// ==========================================
function openEstiloDropdown() {
  cantorDropdownOpen.value = false
  estiloDropdownOpen.value = true
  searchEstilo.value = ""
  nextTick(() => estiloSearchInput.value?.focus())
}
function closeEstiloDropdown() {
  estiloDropdownOpen.value = false
}
function pickEstilo(nome) {
  selectedEstilo.value = nome
  handleEstiloChange() // reaproveita a função original, sem alterá-la
  estiloDropdownOpen.value = false
}

function openCantorDropdown() {
  estiloDropdownOpen.value = false
  cantorDropdownOpen.value = true
  searchCantor.value = ""
  nextTick(() => cantorSearchInput.value?.focus())
}
function closeCantorDropdown() {
  cantorDropdownOpen.value = false
}
function pickCantor(nome) {
  selectedCantor.value = nome
  handleCantorChange() // reaproveita a função original, sem alterá-la
  cantorDropdownOpen.value = false
}

// NOVO: diretiva simples de "clique fora" para fechar os dropdowns
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutsideHandler = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener("click", el._clickOutsideHandler)
  },
  unmounted(el) {
    document.removeEventListener("click", el._clickOutsideHandler)
  },
}

onMounted(() => { fetchCantores(); fetchEstilos(); })
</script>

<style scoped>
.hint { color: #9a9a9a; font-size: 12px; }
.hint.warn { color: #f1c40f; }

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

/* Dropdown pesquisável (cantor/estilo) */
.searchable-select {
  position: relative;
  flex: 1;
}
.searchable-select__control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 10px;
  background: #202020;
  color: #fff;
  border: 1px solid #2a2a2a;
  cursor: pointer;
}
.searchable-select__control .placeholder { color: #7a7a7a; }
.searchable-select__control .arrow { color: #7a7a7a; margin-left: 8px; }

.searchable-select__panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #181818;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  z-index: 50;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  overflow: hidden;
}
.searchable-select__search {
  width: 100%;
  border: none;
  border-bottom: 1px solid #2a2a2a;
  border-radius: 0;
  background: #202020;
}
.searchable-select__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 220px;
  overflow-y: auto;
}
.searchable-select__list li {
  padding: 10px 12px;
  cursor: pointer;
  color: #fff;
}
.searchable-select__list li:hover { background: #222; color: #1db954; }
.searchable-select__list li.active { color: #1db954; font-weight: bold; }
.searchable-select__list li.empty { color: #7a7a7a; cursor: default; text-align: center; }
.searchable-select__list li.new-option { color: #00c3ff; border-top: 1px solid #2a2a2a; }
.searchable-select__list li.new-option:hover { background: #222; }

/* Busca dentro do modal de edição */
.modal-search {
  margin-bottom: 10px;
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
.edit-list li.empty { cursor: default; color: #7a7a7a; text-align: center; }
.modal-actions { display: flex; gap: 10px; margin-top: 15px; }
</style>