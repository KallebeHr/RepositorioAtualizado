import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveMediaUrl, trackKey, objectKeyFromUrl } from '../src/utils/media.js'

test('endereços antigos do B2 preservam nomes, acentos e pastas no R2', () => {
  assert.equal(resolveMediaUrl('https://f005.backblazeb2.com/file/acervo/123-Forr%C3%B3%20ao%20vivo.mp3', 'https://musicas.example.com'), 'https://musicas.example.com/123-Forr%C3%B3%20ao%20vivo.mp3')
  assert.equal(resolveMediaUrl('https://f005.backblazeb2.com/file/acervo/pasta%2Fmusica.mp3', 'https://musicas.example.com'), 'https://musicas.example.com/pasta/musica.mp3')
})
test('não redireciona MediaFire, blobs ou hosts não reconhecidos', () => {
  for (const url of ['https://www.mediafire.com/file/abc', 'blob:https://site.test/id', 'https://evil.test/file/acervo/m.mp3']) assert.equal(resolveMediaUrl(url, 'https://musicas.example.com'), url)
})
test('mantém B2 quando a migração ainda não foi configurada', () => {
  const url = 'https://f005.backblazeb2.com/file/acervo/m.mp3'
  assert.equal(resolveMediaUrl(url, ''), url)
})
test('IDs diferentes não são tratados como duplicados quando fileId está ausente', () => {
  assert.notEqual(trackKey({ id: 'a', downloadUrl: 'url' }), trackKey({ id: 'b', downloadUrl: 'url' }))
})

test('domínio exclusivo V2 não redireciona o catálogo antigo', async () => {
  const { resolveTrackUrl } = await import('../src/utils/media.js')
  const old = { downloadUrl: 'https://f005.backblazeb2.com/file/acervo/antiga.mp3' }
  const fresh = { collectionName: 'musicasV2', objectKey: 'musicas-v2/12345678-1234-1234-1234-123456789012-áudio.mp3', downloadUrl: 'https://pub.test/arquivo' }
  assert.equal(resolveTrackUrl(old, '', 'https://audios.site.test'), old.downloadUrl)
  assert.equal(resolveTrackUrl(fresh, '', 'https://audios.site.test'), 'https://audios.site.test/musicas-v2/12345678-1234-1234-1234-123456789012-%C3%A1udio.mp3')
  assert.equal(resolveTrackUrl(fresh, '', ''), fresh.downloadUrl)
})
