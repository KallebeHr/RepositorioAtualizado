import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../b2-backend/r2-v2-upload.mjs'
import { createV2Publisher, v2Error } from '../src/services/music-v2-model.mjs'

const env = { R2_ACCOUNT_ID: 'test', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test',
  R2_BUCKET_NAME: 'audios', R2_PUBLIC_BASE_URL: 'https://audio.example.test',
  ADMIN_ORIGINS: 'http://localhost:3000', MAX_UPLOAD_MB: '1' }
const receipt = { fileId: 'musicas-v2/test-musica.mp3', objectKey: 'musicas-v2/test-musica.mp3',
  downloadUrl: 'https://audio.example.test/musicas-v2/test-musica.mp3', fileName: 'musica.mp3',
  storageProvider: 'r2', size: 4, contentType: 'audio/mpeg' }

async function localApp(t, options = {}) {
  const app = createApp({ env, objectPrefix: 'musicas-v2', uploadObject: async () => {}, ...options })
  const server = await new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)) })
  t.after(() => new Promise(resolve => server.close(resolve)))
  return 'http://127.0.0.1:' + server.address().port
}
function form(name = 'musica.mp3', bytes = 4) {
  const body = new FormData()
  body.append('file', new Blob([new Uint8Array(bytes)], { type: 'audio/mpeg' }), name)
  return body
}

test('API local envia somente ao R2 e retorna os campos usados no cadastro direto', async t => {
  const uploads = [], base = await localApp(t, { uploadObject: async value => uploads.push(value) })
  const response = await fetch(base + '/upload-music', { method: 'POST', body: form('música.mp3'), headers: { Origin: 'http://localhost:3000' } })
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.equal(data.storageProvider, 'r2')
  assert.equal(data.size, 4)
  assert.equal(data.fileName, 'música.mp3')
  assert.match(data.objectKey, /^musicas-v2\//)
  assert.equal(data.fileId, data.objectKey)
  assert.match(data.downloadUrl, /^https:\/\/audio.example.test\/musicas-v2\//)
  assert.equal(uploads.length, 1)
  assert.equal(uploads[0].config.bucket, 'audios')
})

test('API local recusa origem externa antes de receber arquivo', async t => {
  let uploads = 0
  const base = await localApp(t, { uploadObject: async () => uploads++ })
  const response = await fetch(base + '/upload-music', { method: 'POST', body: form(), headers: { Origin: 'https://outro.example.test' } })
  assert.equal(response.status, 403)
  assert.equal(uploads, 0)
})

test('API local recusa arquivo grande, extensão inválida e arquivo ausente', async t => {
  let uploads = 0
  const base = await localApp(t, { uploadObject: async () => uploads++ })
  assert.equal((await fetch(base + '/upload-music', { method: 'POST', body: form('musica.mp3', 1024 * 1024 + 1) })).status, 400)
  assert.equal((await fetch(base + '/upload-music', { method: 'POST', body: form('programa.exe') })).status, 400)
  assert.equal((await fetch(base + '/upload-music', { method: 'POST', body: new FormData() })).status, 400)
  assert.equal(uploads, 0)
})

test('configuração ausente e falha R2 são reportadas sem expor credenciais', async t => {
  const absent = await localApp(t, { env: { ...env, R2_SECRET_ACCESS_KEY: '' } })
  const health = await fetch(absent + '/health')
  assert.equal(health.status, 503)
  const failed = await localApp(t, { uploadObject: async () => { throw new Error('segredo-teste') } })
  const response = await fetch(failed + '/upload-music', { method: 'POST', body: form() })
  assert.equal(response.status, 502)
  assert.doesNotMatch(JSON.stringify(await response.json()), /segredo-teste/)
})

test('cadastro só ocorre depois do áudio e usa os mesmos campos normais tipo/cantor', async () => {
  const calls = [], row = { file: {}, title: 'Faixa', success: false }
  const publish = createV2Publisher({ upload: async () => { calls.push('R2'); return receipt },
    save: async value => { calls.push('Firestore'); assert.deepEqual(value.tipo, ['Forró']); assert.equal(value.cantor, 'Cantor'); assert.equal(value.title, 'Faixa'); return { id: 'track' } } })
  await publish(row, 'Cantor', 'Forró')
  assert.deepEqual(calls, ['R2', 'Firestore'])
  assert.equal(row.success, true)
  assert.equal(row.documentId, 'track')
  await publish(row, 'Cantor', 'Forró')
  assert.equal(calls.length, 2, 'Não reenvia uma faixa concluída')
})

test('falha R2 impede gravação Firestore', async () => {
  let writes = 0
  const publish = createV2Publisher({ upload: async () => { throw new Error('R2 falhou') }, save: async () => writes++ })
  await assert.rejects(publish({ file: {}, title: 'Faixa' }, 'Cantor', 'Forró'), /R2 falhou/)
  assert.equal(writes, 0)
})

test('falha Firebase conserva recibo R2 para repetir somente o cadastro', async () => {
  let uploads = 0, writes = 0
  const row = { file: {}, title: 'Faixa' }
  const publish = createV2Publisher({ upload: async () => { uploads++; return receipt },
    save: async () => { if (++writes === 1) throw new Error('Cota'); return { id: 'track' } } })
  await assert.rejects(publish(row, 'Cantor', 'Forró'), /Cota/)
  assert.equal(row.success, undefined)
  await publish(row, 'Cantor', 'Forró')
  assert.equal(uploads, 1)
  assert.equal(writes, 2)
  assert.equal(row.success, true)
})

test('título, cantor, estilo e recibo inválidos não são cadastrados', async () => {
  let writes = 0, uploads = 0
  const publish = createV2Publisher({ upload: async () => { uploads++; return { ...receipt, storageProvider: 'b2' } }, save: async () => writes++ })
  await assert.rejects(publish({ file: {}, title: '' }, 'Cantor', 'Forró'))
  await assert.rejects(publish({ file: {}, title: 'Faixa' }, '__novo__', 'Forró'))
  assert.equal(uploads, 0)
  await assert.rejects(publish({ file: {}, title: 'Faixa' }, 'Cantor', 'Forró'), /R2 válido/)
  assert.equal(writes, 0)
})

test('erro de cota identifica projeto compartilhado; permissão e conexão têm mensagens próprias', () => {
  assert.match(v2Error({ code: 'resource-exhausted' }), /mesmo projeto repertorio-d3552/)
  assert.match(v2Error({ code: 'permission-denied' }), /negou acesso/)
  assert.match(v2Error({ code: 'ERR_NETWORK' }), /npm run api:v2/)
})
