import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat()
}
const assets = (await files('dist')).filter(file => !file.endsWith('sw.js') && !file.endsWith('.map') && !/\.(?:woff|ttf|eot)$/.test(file))
const urls = assets.map(file => '/' + path.relative('dist', file).split(path.sep).join('/'))
const digest = createHash('sha256')
for (const file of assets) digest.update(file).update(await readFile(file))
const version = digest.digest('hex').slice(0, 12)
const script = `const CACHE = 'repertorio-app-${version}';
const PRECACHE = ${JSON.stringify(urls)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('repertorio-app-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/__')) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      // O HTML corresponde aos chunks deste cache, inclusive durante uma atualização.
      return await cache.match('/index.html') || fetch(request);
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(request, { ignoreSearch: true }) || fetch(request);
  })());
});`
await writeFile('dist/sw.js', script)
console.log('PWA: ' + urls.length + ' arquivos preparados para abrir offline.')
