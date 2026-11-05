<template>
  <section class="rep-admin">
    <header class="rep-head">
      <div>
        <h2>Repertórios</h2>
        <p>Publique cada parte do repertório como um ZIP enviado ou como um link externo (MediaFire e outros).</p>
      </div>
      <button class="rep-btn ghost" @click="carregar" :disabled="carregando">{{ carregando ? 'Atualizando…' : 'Atualizar lista' }}</button>
    </header>

    <p v-if="erro" class="rep-msg error" role="alert">{{ erro }}</p>
    <p v-if="sucesso" class="rep-msg ok" role="status">{{ sucesso }}</p>

    <form class="rep-card" @submit.prevent="enviarParte">
      <h3>{{ editandoId ? 'Editar parte' : 'Nova parte' }}</h3>

      <label class="rep-field">
        <span>Nome da parte</span>
        <input v-model.trim="form.nome" type="text" maxlength="120" placeholder="Repertório Novembro Parte 1" :disabled="enviando" required />
      </label>

      <div class="rep-tipo">
        <label class="rep-radio">
          <input v-model="form.tipo" type="radio" value="arquivo" :disabled="enviando" />
          <span>Enviar um ZIP meu</span>
        </label>
        <label class="rep-radio">
          <input v-model="form.tipo" type="radio" value="link" :disabled="enviando" />
          <span>Usar um link (MediaFire e outros)</span>
        </label>
      </div>

      <label v-if="form.tipo === 'arquivo'" class="rep-field">
        <span>Arquivo ZIP {{ editandoId ? '(deixe vazio para manter o atual)' : '' }}</span>
        <input ref="arquivoInput" type="file" accept=".zip,application/zip" :disabled="enviando" @change="escolherArquivo" />
        <small v-if="arquivo">Selecionado: {{ arquivo.name }} · {{ tamanhoLegivel(arquivo.size) }}</small>
      </label>

      <label v-else class="rep-field">
        <span>Endereço do link {{ editandoId ? '(deixe vazio para manter o atual)' : '' }}</span>
        <input v-model.trim="form.link" type="url" maxlength="500" placeholder="https://www.mediafire.com/file/.../parte-1.zip/file" :disabled="enviando" />
        <small>O assinante só baixa com a assinatura ativa. A senha abaixo, se preenchida, também é pedida.</small>
      </label>

      <div class="rep-row">
        <label class="rep-field">
          <span>Ordem na lista</span>
          <input v-model.number="form.ordem" type="number" min="0" step="1" :disabled="enviando" />
        </label>
        <label class="rep-field">
          <span>Senha para baixar (opcional)</span>
          <input v-model.trim="form.senha" type="text" maxlength="60" placeholder="Sem senha" :disabled="enviando" />
        </label>
      </div>

      <label class="rep-check">
        <input v-model="form.ativo" type="checkbox" :disabled="enviando" />
        <span>Visível na página Repertório</span>
      </label>

      <div class="rep-progress" v-if="enviando">
        <div class="rep-progress-track"><div class="rep-progress-fill" :style="{ width: progresso + '%' }"></div></div>
        <span>{{ progresso }}% — {{ status }}</span>
      </div>

      <div class="rep-actions">
        <button class="rep-btn primary" type="submit" :disabled="enviando">{{ editandoId ? 'Salvar alterações' : 'Publicar parte' }}</button>
        <button class="rep-btn ghost" type="button" v-if="editandoId" @click="cancelarEdicao" :disabled="enviando">Cancelar edição</button>
      </div>
    </form>

    <div class="rep-list">
      <h3>Partes cadastradas ({{ partes.length }})</h3>
      <p v-if="!partes.length && !carregando" class="rep-empty">Nenhuma parte cadastrada ainda.</p>

      <article v-for="parte in partes" :key="parte.id" class="rep-item">
        <div class="rep-item-main">
          <strong>{{ parte.nome }}</strong>
          <small>
            {{ tipoDaParte(parte) === 'link' ? 'link externo' : (tamanhoLegivel(parte.tamanho) || 'tamanho não informado') }}
            · ordem {{ Number(parte.ordem) || 0 }}
            · {{ parte.senha ? 'com senha' : 'sem senha' }}
            · {{ parte.ativo === false ? 'oculta' : 'visível' }}
          </small>
          <a v-if="parte.url" :href="parte.url" target="_blank" rel="noopener noreferrer">Abrir</a>
        </div>
        <div class="rep-item-actions">
          <button class="rep-btn ghost" @click="editar(parte)" :disabled="enviando">Editar</button>
          <button class="rep-btn danger" @click="remover(parte)" :disabled="enviando">Remover</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
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
</script>

<style scoped>
.rep-admin{display:flex;flex-direction:column;gap:22px;color:#eef8f0}
.rep-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap}
.rep-head h2{font-size:clamp(20px,3vw,26px)}
.rep-head p{font-size:13px;color:#a5c1ae;line-height:1.8;margin-top:8px;max-width:640px}
.rep-msg{padding:12px 16px;border-radius:12px;font-size:13px;line-height:1.6}
.rep-msg.error{background:#3a2020;border:1px solid #8c4a4a;color:#ffd0d0}
.rep-msg.ok{background:#1e3527;border:1px solid #4c8c62;color:#cdf0d9}
.rep-card{background:#152a1d;border:1px solid #33503c;border-radius:18px;padding:22px;display:flex;flex-direction:column;gap:16px}
.rep-card h3{font-size:15px}
.rep-row{display:flex;gap:14px;flex-wrap:wrap}
.rep-row .rep-field{flex:1;min-width:180px}
.rep-field{display:flex;flex-direction:column;gap:7px}
.rep-field>span{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9bb9a5}
.rep-field input[type=text],.rep-field input[type=number],.rep-field input[type=url],.rep-field input[type=file]{background:#0e1c14;border:1px solid #33503c;border-radius:10px;padding:12px;color:#eef8f0;font-size:13px;min-height:44px;width:100%}
.rep-field small{font-size:11px;color:#9bb9a5}
.rep-tipo{display:flex;gap:16px;flex-wrap:wrap}
.rep-radio{display:flex;align-items:center;gap:8px;font-size:13px;color:#c6dbc9;min-height:44px;cursor:pointer}
.rep-check{display:flex;align-items:center;gap:10px;font-size:13px;color:#c6dbc9}
.rep-actions{display:flex;gap:10px;flex-wrap:wrap}
.rep-btn{min-height:44px;padding:0 18px;border-radius:10px;border:1px solid #41624a;background:#1a2b1f;color:#cbebd6;font-size:13px;cursor:pointer}
.rep-btn.primary{background:#ace8bf;border-color:#ace8bf;color:#152f1d;font-weight:700}
.rep-btn.danger{border-color:#8c4a4a;color:#ffd0d0;background:#311c1c}
.rep-btn:disabled{opacity:.6;cursor:not-allowed}
.rep-progress{display:flex;align-items:center;gap:12px;font-size:12px;color:#a5c1ae}
.rep-progress-track{flex:1;height:6px;border-radius:999px;background:#0e1c14;overflow:hidden}
.rep-progress-fill{height:100%;background:linear-gradient(90deg,#1db954,#00c3ff)}
.rep-list{display:flex;flex-direction:column;gap:12px}
.rep-list h3{font-size:15px}
.rep-empty{font-size:13px;color:#9bb9a5}
.rep-item{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;background:#152a1d;border:1px solid #33503c;border-radius:16px;padding:16px}
.rep-item-main{display:flex;flex-direction:column;gap:6px;min-width:0}
.rep-item-main strong{font-size:14px}
.rep-item-main small{font-size:11px;color:#9bb9a5}
.rep-item-main a{font-size:12px;color:#9bddb4}
.rep-item-actions{display:flex;gap:8px}
@media(max-width:640px){.rep-item{flex-direction:column;align-items:flex-start}.rep-item-actions{width:100%}.rep-item-actions .rep-btn{flex:1}}
</style>
