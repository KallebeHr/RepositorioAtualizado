import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

test('manifesto permite instalação e aponta para a biblioteca offline', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'))
  assert.equal(manifest.display, 'standalone'); assert.equal(manifest.start_url, '/Offline')
  assert.equal(manifest.prefer_related_applications, false)
  assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512'])
})
test('worker de produção abre rotas offline sem consultar a rede e não intercepta Firebase', async () => {
  const script = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8')
  const handlers = {}, entries = new Map(), pending = []
  const cache = {
    addAll: async urls => urls.forEach(url => entries.set(url, new Response(url === '/index.html' ? '<html>app</html>' : 'asset'))),
    match: async (request, options={}) => { if (typeof request==='string')return entries.get(request)?.clone();const url=new URL(request.url);return entries.get(url.pathname+(options.ignoreSearch?'':url.search))?.clone() },
  }
  let calls = 0
  const scope = { location: { origin: 'https://app.test' }, clients: { claim: async () => {} }, addEventListener: (name, handler) => { handlers[name] = handler } }
  vm.runInNewContext(script, { self: scope, URL, caches: { open: async () => cache, keys: async () => [] }, fetch: async () => { calls++; throw new Error('offline') } })
  handlers.install({ waitUntil: promise => pending.push(promise) }); await Promise.all(pending)
  assert.ok(entries.has('/pwa-install-capture.js'), 'Captura antecipada também fica disponível offline')
  let response
  handlers.fetch({ request: { method:'GET', url:'https://app.test/Offline', mode:'navigate' }, respondWith: promise => { response = promise } })
  assert.equal(await (await response).text(), '<html>app</html>'); assert.equal(calls, 0)
  const font=[...entries.keys()].find(url=>url.endsWith('.woff2'))
  handlers.fetch({request:{method:'GET',url:'https://app.test'+font+'?v=7.4.47',mode:'cors'},respondWith:promise=>{response=promise}})
  assert.equal(await (await response).text(),'asset');assert.equal(calls,0)
  let intercepted = false
  handlers.fetch({ request: { method:'GET', url:'https://firestore.googleapis.com/anything', mode:'cors' }, respondWith: () => { intercepted = true } })
  assert.equal(intercepted, false)
})
