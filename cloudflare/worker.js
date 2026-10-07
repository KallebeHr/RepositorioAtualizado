// Entrega pública do acervo R2; preserva o modelo público do projeto original.
export function parseRange(header, size) {
  if (!header) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header)
  if (!match || (!match[1] && !match[2]) || size <= 0) return false
  let start, end
  if (!match[1]) {
    const suffix = Number(match[2])
    if (suffix <= 0) return false
    start = Math.max(0, size - suffix); end = size - 1
  } else {
    start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end) return false
  return { offset: start, length: end - start + 1, end }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map(value => value.trim())
    const cors = new Headers({
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, If-Range, If-None-Match, If-Modified-Since',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, ETag',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    })
    if (allowed.includes('*')) cors.set('Access-Control-Allow-Origin', '*')
    else if (origin && allowed.includes(origin)) cors.set('Access-Control-Allow-Origin', origin)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Método não permitido.', { status: 405, headers: cors })
    if (url.pathname === '/health') return Response.json({ ok: !!env.MUSIC_BUCKET, service: 'Repertório R2' }, { headers: cors, status: env.MUSIC_BUCKET ? 200 : 503 })
    if (!env.MUSIC_BUCKET) return new Response('Configure o binding MUSIC_BUCKET.', { status: 503, headers: cors })
    let key
    try { key = decodeURIComponent(url.pathname.slice(1)) } catch { return new Response('Endereço inválido.', { status: 400, headers: cors }) }
    if (!key || key.split('/').some(part => part === '..' || part === '.') || /[\u0000-\u001f\\]/.test(key)) return new Response('Endereço inválido.', { status: 400, headers: cors })
    const metadata = await env.MUSIC_BUCKET.head(key)
    if (!metadata) return new Response('Arquivo não encontrado.', { status: 404, headers: cors })
    const headers = new Headers(cors)
    metadata.writeHttpMetadata(headers)
    headers.set('Content-Type', metadata.httpMetadata?.contentType || 'audio/mpeg')
    headers.set('Accept-Ranges', 'bytes')
    headers.set('ETag', metadata.httpEtag)
    headers.set('Cache-Control', 'public, max-age=86400')
    if (request.headers.get('If-None-Match') === metadata.httpEtag) return new Response(null, { status: 304, headers })
    const ifRange = request.headers.get('If-Range')
    const range = parseRange(!ifRange || ifRange === metadata.httpEtag ? request.headers.get('Range') : null, metadata.size)
    if (range === false) {
      headers.set('Content-Range', `bytes */${metadata.size}`)
      return new Response(null, { status: 416, headers })
    }
    headers.set('Content-Length', String(range?.length ?? metadata.size))
    if (range) headers.set('Content-Range', `bytes ${range.offset}-${range.end}/${metadata.size}`)
    if (request.method === 'HEAD') return new Response(null, { status: range ? 206 : 200, headers })
    const object = await env.MUSIC_BUCKET.get(key, range ? { range: { offset: range.offset, length: range.length } } : {})
    if (!object) return new Response('Arquivo não encontrado.', { status: 404, headers: cors })
    return new Response(object.body, { status: range ? 206 : 200, headers })
  },
}
