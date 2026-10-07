<template>
  <section class="r2-test">
    <h1>Teste do novo armazenamento R2</h1>
    <p>Envio separado do catálogo. Esta página não cadastra músicas no Firebase nem modifica arquivos existentes.</p>
    <div class="panel">
      <label>Servidor de teste
        <input v-model="api" type="url" :disabled="busy" />
      </label>
      <button :disabled="busy" @click="checkHealth">Verificar servidor local</button>
      <p role="status" aria-live="polite">{{ status }}</p>
      <label>Selecione um áudio para teste
        <input type="file" accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,.opus" :disabled="busy" @change="selectFile" />
      </label>
      <p v-if="file">{{ file.name }} · {{ size(file.size) }}</p>
      <button :disabled="!file || busy" @click="upload">{{ busy ? 'Aguarde…' : 'Enviar apenas para o R2 de teste' }}</button>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
    </div>
    <div v-if="result" class="panel">
      <h2>Arquivo de teste enviado</h2>
      <p>Bucket: repertorio-atualizado-audios</p>
      <p class="path">{{ result.objectKey }}</p>
      <audio controls preload="metadata" :src="localAudio || result.downloadUrl" @error="audioError" />
      <p>{{ localAudio ? 'Reprodução da cópia local neste navegador.' : 'Reprodução pelo endereço público do R2.' }}</p>
      <a :href="result.downloadUrl" target="_blank" rel="noopener">Abrir arquivo público</a>
      <div class="actions">
        <button :disabled="busy" @click="checkDownload">Verificar download e intervalos</button>
        <button :disabled="busy" @click="download">Baixar arquivo</button>
        <button :disabled="busy" @click="localPlayback">Carregar áudio local para teste</button>
        <button v-if="localAudio" @click="remotePlayback">Voltar ao áudio do R2</button>
      </div>
      <p class="hint">A cópia local desta página fica na memória até sair dela. A biblioteca Offline do site salva músicas de forma persistente.</p>
      <p class="hint">O arquivo enviado permanece em testes/ no bucket. Remova somente esse arquivo pelo painel após concluir.</p>
    </div>
    <p class="hint">Se ocorrer erro de CORS, adicione http://localhost:3003 e http://127.0.0.1:3003 às origens permitidas do bucket, preservando as origens atuais.</p>
  </section>
</template>
<script setup>
import { ref, onBeforeUnmount } from 'vue'
const api = ref('http://localhost:3002'), file = ref(null), busy = ref(false)
const error = ref(''), status = ref('Inicie npm run api:teste em outro terminal.'), result = ref(null), localAudio = ref('')
let savedBlob = null
const size = n => (n / 1024 / 1024).toFixed(2) + ' MB'
const apiUrl = path => api.value.replace(/\/$/, '') + path
function remotePlayback() { if (localAudio.value) URL.revokeObjectURL(localAudio.value); localAudio.value = '' }
function selectFile(event) { file.value = event.target.files?.[0] || null; error.value = ''; result.value = null; savedBlob = null; remotePlayback() }
async function run(action) { busy.value = true; error.value = ''; try { await action() } catch(e) { error.value = e.message || 'Não foi possível concluir.' } finally { busy.value = false } }
async function checkHealth() { await run(async () => {
 const response = await fetch(apiUrl('/health'), { signal: AbortSignal.timeout(10000) }); const data = await response.json()
 if (!response.ok || !data.ok) throw new Error(data.error || 'Servidor não está configurado.')
 if (!data.testMode) throw new Error('Esta não é a API de teste. Inicie npm run api:teste na porta 3002.')
 status.value = 'Servidor local configurado para R2. O teste de envio confirmará o acesso à conta.'
}) }
async function upload() { await run(async () => {
 const health = await fetch(apiUrl('/health'), { signal: AbortSignal.timeout(10000) }); const info = await health.json()
 if (!health.ok || !info.testMode) throw new Error('Envio bloqueado: use somente a API de teste na porta 3002.')
 const form = new FormData(); form.append('file', file.value)
 const response = await fetch(apiUrl('/upload-music'), { method: 'POST', body: form }); const data = await response.json()
 if (!response.ok) throw new Error(data.error || 'Falha no envio.')
 if (!data.objectKey?.startsWith('testes/')) throw new Error('Esta não é a API de teste. Use a porta 3002 com npm run api:teste.')
 result.value = data; status.value = 'Enviado para testes/ no R2. Nenhum documento foi gravado no Firebase.'
}) }
async function blob() {
 if (savedBlob) return savedBlob
 const response = await fetch(result.value.downloadUrl)
 if (!response.ok) throw new Error('Download retornou HTTP ' + response.status)
 const value = await response.blob()
 if (!value.size || value.size !== result.value.size || /html|json/.test(value.type)) throw new Error('O download não corresponde ao áudio enviado.')
 savedBlob = value; return value
}
async function checkDownload() { await run(async () => {
 const value = await blob()
 // Compara o arquivo real baixado com a seleção original.
 const digest = async b => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await b.arrayBuffer()))).map(v => v.toString(16).padStart(2, '0')).join('')
 if (await digest(value) !== await digest(file.value)) throw new Error('O conteúdo recebido diverge do arquivo original.')
 const end = Math.min(43, result.value.size - 1)
 const ranged = await fetch(result.value.downloadUrl, { headers: { Range: `bytes=0-${end}` } })
 const bytes = new Uint8Array(await ranged.arrayBuffer()), expected = new Uint8Array(await value.slice(0, end + 1).arrayBuffer())
 if (ranged.status !== 206 || bytes.length !== expected.length || !bytes.every((v,i) => v === expected[i])) throw new Error('A entrega não respondeu corretamente ao intervalo de bytes.')
 status.value = 'Download, conteúdo SHA-256, CORS e intervalos de bytes aprovados.'
}) }
async function download() { await run(async () => {
 const url = URL.createObjectURL(await blob()), a = document.createElement('a'); a.href = url; a.download = result.value.fileName; a.click()
 setTimeout(() => URL.revokeObjectURL(url), 30000); status.value = 'Download solicitado ao navegador.'
}) }
async function localPlayback() { await run(async () => { remotePlayback(); localAudio.value = URL.createObjectURL(await blob()); status.value = 'Áudio carregado localmente. Desconecte a internet para testar a reprodução sem sair desta página.' }) }
function audioError() { error.value = 'Falha na reprodução. Confira o endereço público do arquivo e o formato de áudio.' }
onBeforeUnmount(remotePlayback)
</script>
<style scoped>
.r2-test { max-width: 850px; margin: auto; padding: 28px 16px 140px; color: #eee; }
h1 { font-size: 1.65rem; margin-bottom: 12px; } h2 { font-size: 1.2rem; margin-bottom: 12px; }
p { margin: 12px 0; line-height: 1.5; }.panel { background: #1b1b1b; border: 1px solid #383838; border-radius: 12px; padding: 20px; margin: 20px 0; }
label { display: block; margin-bottom: 16px; } input { display: block; width: 100%; padding: 10px; margin-top: 8px; border: 1px solid #666; border-radius: 6px; color: #fff; }
button { background: #387647; color: #fff; padding: 10px 16px; border-radius: 6px; margin: 6px 8px 6px 0; } button:disabled { opacity: .45; }
a { color: #8cce99; } audio { width: 100%; margin: 12px 0; }.path { overflow-wrap: anywhere; }.hint { font-size: .9rem; color: #bbb; }.error { color: #ffb0ab; }
</style>
