import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { db, auth } from '@/firebase'
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { V2_UPLOAD_URL } from '@/services/music-v2'
import { documentoDaParte, tamanhoLegivel, tipoDaParte } from '@/services/repertorio-model.mjs'

const partes = ref([])
const carregando = ref(false)
const enviando = ref(false)
const progresso = ref(0)
const status = ref('')
const erro = ref('')
const sucesso = ref('')
const arquivo = ref(null)
const arquivoInput = ref(null)
const editandoId = ref('')
const parteEmEdicao = ref(null)

const form = reactive({ nome: '', ordem: 0, senha: '', ativo: true, tipo: 'arquivo', link: '' })

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const qs = await getDocs(collection(db, 'repertorios'))
    partes.value = qs.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0))
  } catch (err) {
    console.error('[Repertorios] FALHA ao ler a coleção', { codigo: err.code, mensagem: err.message })
    erro.value = 'Não foi possível ler a coleção repertorios' + (err.code ? ` (código: ${err.code})` : '') + '.'
  } finally {
    carregando.value = false
  }
}

function escolherArquivo(evento) {
  arquivo.value = evento.target.files?.[0] || null
}

function limparFormulario() {
  editandoId.value = ''
  parteEmEdicao.value = null
  form.nome = ''
  form.ordem = 0
  form.senha = ''
  form.ativo = true
  form.tipo = 'arquivo'
  form.link = ''
  arquivo.value = null
  if (arquivoInput.value) arquivoInput.value.value = ''
  progresso.value = 0
  status.value = ''
}

function cancelarEdicao() {
  limparFormulario()
}

function editar(parte) {
  editandoId.value = parte.id
  parteEmEdicao.value = parte
  form.nome = parte.nome || ''
  form.ordem = Number(parte.ordem) || 0
  form.senha = parte.senha || ''
  form.ativo = parte.ativo !== false
  form.tipo = tipoDaParte(parte)
  form.link = form.tipo === 'link' ? (parte.url || '') : ''
  arquivo.value = null
  if (arquivoInput.value) arquivoInput.value.value = ''
  erro.value = ''
  sucesso.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function enviarArquivoZip(file) {
  const dados = new FormData()
  dados.append('file', file)
  const { data } = await axios.post(V2_UPLOAD_URL + '/upload-zip', dados, {
    timeout: 0,
    onUploadProgress: evento => {
      if (evento.total) progresso.value = Math.round(evento.loaded * 100 / evento.total)
    },
  })
  return data
}

async function enviarParte() {
  if (enviando.value) return
  if (!form.nome) { erro.value = 'Informe o nome da parte.'; return }
  if (!editandoId.value && form.tipo === 'arquivo' && !arquivo.value) { erro.value = 'Selecione o arquivo ZIP da parte.'; return }
  if (!editandoId.value && form.tipo === 'link' && !form.link) { erro.value = 'Informe o endereço do link.'; return }

  enviando.value = true
  erro.value = ''
  sucesso.value = ''
  status.value = 'Preparando o envio'
  progresso.value = 0
  let etapa = 'preparar'
  const tipos = objeto => Object.fromEntries(Object.entries(objeto).map(([k, v]) => [k, v === null ? 'null' : (typeof v === 'object' ? (v?.constructor?.name || 'object') : typeof v) + (typeof v === 'string' ? `(${v.length})` : '')]))

  try {
    let dadosArquivo = null
    if (form.tipo === 'arquivo' && arquivo.value) {
      etapa = 'enviar o ZIP ao R2'
      status.value = 'Enviando o ZIP para o R2'
      console.info('[Repertorios] enviando ZIP', { nome: arquivo.value.name, bytes: arquivo.value.size, api: V2_UPLOAD_URL })
      dadosArquivo = await enviarArquivoZip(arquivo.value)
      console.info('[Repertorios] resposta do servidor', dadosArquivo)
    }

    etapa = 'montar o documento'
    status.value = 'Salvando no Firebase'
    const id = editandoId.value || doc(collection(db, 'repertorios')).id
    const documento = {
      ...documentoDaParte({
        nome: form.nome,
        ordem: form.ordem,
        senha: form.senha,
        ativo: form.ativo,
        arquivo: form.tipo === 'arquivo' ? dadosArquivo : null,
        // Ao editar um link sem digitar outro, mantém o que já está gravado.
        link: form.tipo === 'link' ? (form.link || (editandoId.value ? parteEmEdicao?.url : '')) : null,
      }),
      atualizadoEm: serverTimestamp(),
    }
    if (!editandoId.value) documento.criadoEm = serverTimestamp()
    console.info('[Repertorios] gravando no Firestore', { colecao: 'repertorios', id, operacao: editandoId.value ? 'editar' : 'criar', campos: tipos(documento) })

    etapa = 'salvar no Firestore'
    await setDoc(doc(db, 'repertorios', id), documento, { merge: true })
    console.info('[Repertorios] gravado com sucesso', id)

    sucesso.value = editandoId.value ? 'Parte atualizada.' : 'Parte publicada na página Repertório.'
    limparFormulario()
    await carregar()
  } catch (err) {
    console.error('[Repertorios] FALHA na etapa "' + etapa + '"', { codigo: err.code, mensagem: err.message, resposta: err.response?.data, status: err.response?.status, usuario: auth.currentUser?.uid })
    const detalhe = err.response?.data?.error || err.message || 'Não foi possível concluir o envio.'
    erro.value = `Falhou ao ${etapa}: ${detalhe}` + (err.code ? ` (código: ${err.code})` : '') + (err.response?.status ? ` (HTTP ${err.response.status})` : '')
  } finally {
    enviando.value = false
    status.value = ''
  }
}

async function remover(parte) {
  if (!window.confirm(`Remover a parte "${parte.nome}" da lista?`)) return
  enviando.value = true
  erro.value = ''
  sucesso.value = ''
  try {
    await deleteDoc(doc(db, 'repertorios', parte.id))
    sucesso.value = 'Parte removida da lista.'
    await carregar()
  } catch (err) {
    console.error('[Repertorios] FALHA ao remover', { codigo: err.code, mensagem: err.message })
    erro.value = err.message || 'Não foi possível remover a parte.'
  } finally {
    enviando.value = false
  }
}

onMounted(carregar)
