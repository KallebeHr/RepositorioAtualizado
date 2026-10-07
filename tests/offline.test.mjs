import test, { before } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { reactive } from 'vue'
import { saveOffline, listOffline, getPlaybackSource, getTrackBlob, removeOffline, clearOffline, writeLocalData, readLocalData } from '../src/services/offline.js'
const events = new EventTarget()
globalThis.window = events
Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
Object.defineProperty(navigator, 'storage', { value: { estimate: async () => ({ quota: 100000, usage: 0 }) }, configurable: true })
const track = { id: 'song', title: 'Música', downloadUrl: 'https://media.test/song.mp3', fileName: 'song.mp3' }
const originalFetch = globalThis.fetch
before(async () => {
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('repertorio-offline',1);r.onupgradeneeded=()=>{r.result.createObjectStore('tracks',{keyPath:'key'});r.result.createObjectStore('data',{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
 await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put({key:'migration:legacy-v2',owner:'migration',track:{...track,id:'legacy-v2',storageProvider:'r2'},blob:new Blob(['legado'],{type:'audio/mpeg'}),size:6,savedAt:Date.now()});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})
 db.close()
})

test('salva uma vez, evita downloads repetidos e reproduz sem conexão', async () => {
  let reads = 0
  globalThis.fetch = async () => { reads++; return new Response(new Blob(['test-audio'], { type: 'audio/mpeg' }), { status: 200 }) }
  navigator.onLine = true
  await Promise.all([saveOffline('owner', track), saveOffline('owner', track)])
  assert.equal(reads, 1)
  assert.equal((await listOffline('owner')).length, 1)
  // Reabrir a biblioteca não depende do estado em memória da lista.
  assert.equal((await listOffline('owner'))[0].size, 10)
  navigator.onLine = false
  globalThis.fetch = async () => { assert.fail('Não deveria consultar a internet') }
  const playback = await getPlaybackSource('owner', track)
  assert.equal(playback.local, true); assert.match(playback.url, /^blob:/)
  URL.revokeObjectURL(playback.url)
  assert.equal(await (await getTrackBlob('owner', track)).text(), 'test-audio')
})
test('separa a biblioteca de contas e informa quando a música não está salva', async () => {
  assert.equal((await listOffline('other')).length, 0)
  await assert.rejects(getPlaybackSource('other', track), /não foi salva/)
})
test('remove músicas individualmente e libera toda a biblioteca da conta', async () => {
  await removeOffline('owner', track)
  assert.equal((await listOffline('owner')).length, 0)
  navigator.onLine = true
  globalThis.fetch = async () => new Response(new Blob(['audio'], { type: 'audio/mpeg' }), { status: 200 })
  await saveOffline('owner', track)
  await saveOffline('owner', { ...track, id: 'second' })
  await saveOffline('other', track)
  await clearOffline('owner')
  assert.equal((await listOffline('owner')).length, 0)
  assert.equal((await listOffline('other')).length, 1)
})
test('não salva páginas de erro ou respostas parciais como músicas', async () => {
  globalThis.fetch = async () => new Response('<html>erro</html>', { headers: { 'Content-Type': 'text/html' } })
  await assert.rejects(saveOffline('invalid', track), /arquivo de áudio/)
  globalThis.fetch = async () => new Response('partial', { status: 206 })
  await assert.rejects(saveOffline('partial', track), /música completa/)
})
test('informa quando o espaço no aparelho é insuficiente', async () => {
  navigator.storage.estimate = async () => ({ quota: 10, usage: 9 })
  globalThis.fetch = async () => new Response(new Blob(['audio'], { type: 'audio/mpeg' }))
  await assert.rejects(saveOffline('full', track), /Espaço insuficiente/)
  globalThis.fetch = originalFetch
})

test('coleções normal e V2 com o mesmo ID têm arquivos separados', async () => {
 navigator.onLine=true; navigator.storage.estimate=async()=>({quota:100000,usage:0})
 globalThis.fetch=async url=>new Response(new Blob([String(url)],{type:'audio/mpeg'}))
 await saveOffline('mixed',track)
 const v2={...track,collectionName:'musicasV2',storageProvider:'r2',downloadUrl:'https://media.test/v2.mp3'}
 await saveOffline('mixed',v2)
 assert.equal((await listOffline('mixed')).length,2)
 assert.equal(await (await getTrackBlob('mixed',track)).text(),track.downloadUrl)
 assert.equal(await (await getTrackBlob('mixed',v2)).text(),v2.downloadUrl)
 globalThis.fetch=originalFetch
})

test('migra biblioteca anterior e lista metadados sem carregar áudios na memória', async () => {
 const records=await listOffline('migration')
 assert.equal(records.length,1)
 assert.equal('blob' in records[0],false)
 assert.equal(await (await getTrackBlob('migration',records[0].track)).text(),'legado')
})

test('salva música e perfil reativos do Vue, mantendo datas para uso offline',async()=>{
 navigator.onLine=true;navigator.storage.estimate=async()=>({quota:100000,usage:0});globalThis.fetch=async()=>new Response(new Blob(['audio'],{type:'audio/mpeg'}))
 const data=reactive({...track,id:'vue',tipo:['Forró'],extra:{cantor:'Teste'}})
 await saveOffline('reactive',data)
 assert.deepEqual((await listOffline('reactive'))[0].track.estilos,['Forró'])
 await writeLocalData('reactive-profile',reactive({uid:'reactive',favorites:['vue'],subscriptionEnd:{seconds:2000000000}}))
 assert.deepEqual((await readLocalData('reactive-profile')).favorites,['vue'])
 globalThis.fetch=originalFetch
})

test('falha de rede/CORS informa a causa possível e não salva áudio inválido', async () => {
  navigator.onLine = true
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
  await assert.rejects(saveOffline('cors', track), /CORS do B2\/R2/)
  await assert.rejects(getTrackBlob('cors', track), /CORS do B2\/R2/)
  assert.equal((await listOffline('cors')).length, 0)
  globalThis.fetch = originalFetch
})
