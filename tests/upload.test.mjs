import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createApp, r2Configuration } from '../b2-backend/r2-upload.js'
const env = { R2_ACCOUNT_ID: 'test', R2_ACCESS_KEY_ID: 'id', R2_SECRET_ACCESS_KEY: 'secret', R2_BUCKET_NAME: 'music', R2_PUBLIC_BASE_URL: 'https://media.test' }
async function server(callback, options = {}) {
  const app = createApp({ env, ...options })
  const listening = app.listen(0, '127.0.0.1')
  await new Promise(resolve => listening.once('listening', resolve))
  try { await callback(`http://127.0.0.1:${listening.address().port}`) }
  finally { await new Promise(resolve => listening.close(resolve)) }
}
test('não inicia uploads sem credenciais R2', async () => {
  assert.throws(() => r2Configuration({}), /Configure/)
  await server(async base => assert.equal((await fetch(base + '/upload-music', { method: 'POST' })).status, 503), { env: {} })
})
test('upload mantém o nome original e apaga o temporário', async () => {
  let localPath
  await server(async base => {
    const form = new FormData(); form.append('file', new Blob(['audio'], { type: 'audio/mpeg' }), 'Forró teste.mp3')
    const response = await fetch(base + '/upload-music', { method: 'POST', body: form, headers: { Origin: 'http://localhost:3000' } })
    assert.equal(response.status, 200)
    const result = await response.json()
    assert.equal(result.storageProvider, 'r2'); assert.equal(result.size, 5)
    assert.match(result.downloadUrl, /^https:\/\/media.test\/musicas\//)
    assert.equal(decodeURIComponent(result.downloadUrl).endsWith('Forró teste.mp3'), true)
  }, { uploadObject: async ({ file }) => { localPath = file.path; assert.equal(await fs.readFile(file.path, 'utf8'), 'audio') } })
  await assert.rejects(fs.access(localPath))
})
test('recusa pedidos de páginas externas e arquivos que não são áudio', async () => {
  await server(async base => {
    assert.equal((await fetch(base + '/upload-music', { method: 'POST', headers: { Origin: 'https://external.test' } })).status, 403)
    const form = new FormData(); form.append('file', new Blob(['x']), 'x.html')
    assert.equal((await fetch(base + '/upload-music', { method: 'POST', body: form })).status, 400)
  }, { uploadObject: async () => assert.fail('não deveria enviar') })
})
test('API de teste usa somente o prefixo testes e aceita a página na porta 3003', async () => {
 await server(async base => {
  const health = await (await fetch(base + '/health')).json(); assert.equal(health.testMode, true); assert.equal(health.objectPrefix, 'testes')
  const form = new FormData(); form.append('file', new Blob(['audio']), 'teste.mp3')
  const response = await fetch(base + '/upload-music', { method:'POST', body:form, headers:{ Origin:'http://localhost:3003' } })
  assert.equal(response.status, 200)
  assert.match((await response.json()).objectKey, /^testes\//)
 }, { objectPrefix:'testes', env:{ ...env, ADMIN_ORIGINS:'http://localhost:3003' }, uploadObject:async ({objectKey}) => assert.match(objectKey, /^testes\//) })
 assert.throws(() => createApp({env,objectPrefix:'other'}), /Prefixo/)
})
