import test from 'node:test'
import assert from 'node:assert/strict'
import worker, { parseRange } from '../cloudflare/worker.js'
const bytes = new TextEncoder().encode('0123456789')
const metadata = { size: 10, httpEtag: '"test"', httpMetadata: { contentType: 'audio/mpeg' }, writeHttpMetadata: headers => headers.set('Content-Type', 'audio/mpeg') }
const env = { MUSIC_BUCKET: {
  head: async key => key === 'song.mp3' ? metadata : null,
  get: async (key, options) => ({ body: options.range ? bytes.slice(options.range.offset, options.range.offset + options.range.length) : bytes }),
} }
test('entrega o áudio completo com CORS', async () => {
  const response = await worker.fetch(new Request('https://media.test/song.mp3'), env)
  assert.equal(response.status, 200); assert.equal(await response.text(), '0123456789')
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*')
})
test('avançar na música retorna somente os bytes pedidos', async () => {
  const response = await worker.fetch(new Request('https://media.test/song.mp3', { headers: { Range: 'bytes=3-6' } }), env)
  assert.equal(response.status, 206); assert.equal(await response.text(), '3456')
  assert.equal(response.headers.get('Content-Range'), 'bytes 3-6/10')
})
test('intervalos finais e abertos funcionam', () => {
  assert.deepEqual(parseRange('bytes=-4', 10), { offset: 6, length: 4, end: 9 })
  assert.deepEqual(parseRange('bytes=6-', 10), { offset: 6, length: 4, end: 9 })
})
test('intervalos inválidos não enviam o arquivo completo', async () => {
  for (const range of ['bytes=50-', 'bytes=7-3', 'bytes=-0', 'bytes=0-1,3-4']) {
    const response = await worker.fetch(new Request('https://media.test/song.mp3', { headers: { Range: range } }), env)
    assert.equal(response.status, 416)
  }
})
test('HEAD e cache condicional não devolvem áudio', async () => {
  const head = await worker.fetch(new Request('https://media.test/song.mp3', { method: 'HEAD' }), env)
  assert.equal(head.headers.get('Content-Length'), '10'); assert.equal(await head.text(), '')
  const cached = await worker.fetch(new Request('https://media.test/song.mp3', { headers: { 'If-None-Match': '"test"' } }), env)
  assert.equal(cached.status, 304)
})
test('arquivo inexistente e configuração ausente possuem erros claros', async () => {
  assert.equal((await worker.fetch(new Request('https://media.test/missing'), env)).status, 404)
  assert.equal((await worker.fetch(new Request('https://media.test/song.mp3'), {})).status, 503)
})
