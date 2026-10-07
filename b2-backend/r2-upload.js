import express from 'express'
import cors from 'cors'
import multer from 'multer'
import axios from 'axios'
import dotenv from 'dotenv'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

const directory = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(directory, '.env'), quiet: true })

export function r2Configuration(env = process.env) {
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_BASE_URL']
  const missing = required.filter(key => !env[key]?.trim())
  if (missing.length) throw new Error('Configure no arquivo b2-backend/.env: ' + missing.join(', '))
  const base = new URL(env.R2_PUBLIC_BASE_URL)
  if (base.protocol !== 'https:') throw new Error('R2_PUBLIC_BASE_URL precisa começar com https://.')
  return {
    bucket: env.R2_BUCKET_NAME, publicBase: env.R2_PUBLIC_BASE_URL.replace(/\/$/, ''),
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: 'auto', credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  }
}

export function createApp({ env = process.env, uploadObject, objectPrefix = 'musicas' } = {}) {
  if (!['musicas', 'testes', 'musicas-v2'].includes(objectPrefix)) throw new Error('Prefixo de envio inválido.')
  const app = express()
  const origins = new Set((env.ADMIN_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(value => value.trim()))
  app.use((req, res, next) => {
    if (req.headers.origin && !origins.has(req.headers.origin)) return res.status(403).json({ error: 'Origem não autorizada.' })
    next()
  })
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || origins.has(origin)) }))
  const maxSize = (Number(env.MAX_UPLOAD_MB) || 300) * 1024 * 1024
  const upload = multer({ dest: path.join(os.tmpdir(), 'repertorio-uploads'), limits: { fileSize: maxSize, files: 1 } })
  app.get('/health', (req, res) => {
    try { const config = r2Configuration(env); res.json({ ok: true, storage: 'R2', publicBase: config.publicBase, testMode: objectPrefix === 'testes', objectPrefix }) }
    catch (error) { res.status(503).json({ ok: false, error: error.message }) }
  })
  app.get('/', (req, res) => res.json({ service: 'Repertório — envio local para R2', health: '/health' }))
  app.post('/upload-music', (req, res, next) => {
    // Não carrega o arquivo antes de verificar a configuração.
    try { r2Configuration(env); next() }
    catch (error) { res.status(503).json({ error: error.message }) }
  }, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' })
    let task
    const abort = () => task?.abort?.()
    try {
      const config = r2Configuration(env)
      const extension = path.extname(req.file.originalname).toLowerCase()
      if (!['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.opus'].includes(extension)) return res.status(400).json({ error: 'Selecione um arquivo de áudio válido.' })
      const utf8Name = Buffer.from(req.file.originalname, 'latin1').toString('utf8')
      const originalName = utf8Name.includes('\uFFFD') ? req.file.originalname : utf8Name
      const fileName = path.basename(originalName).replace(/[\u0000-\u001f]/g, '')
      const objectKey = `${objectPrefix}/${objectPrefix === 'musicas-v2' && /^[a-f0-9-]{36}$/i.test(req.headers['x-upload-id'] || '') ? req.headers['x-upload-id'] : crypto.randomUUID()}-${fileName}`
      const mime = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.flac': 'audio/flac', '.opus': 'audio/ogg' }[extension]
      req.on('aborted', abort)
      if (uploadObject) await uploadObject({ config, objectKey, file: req.file, mime })
      else {
        const client = new S3Client(config)
        task = new Upload({ client, params: {
          Bucket: config.bucket, Key: objectKey, Body: fs.createReadStream(req.file.path),
          ContentType: mime, ContentLength: req.file.size, CacheControl: 'public, max-age=31536000, immutable',
        }, queueSize: 2, partSize: 8 * 1024 * 1024, leavePartsOnError: false })
        try { await task.done() } finally { client.destroy() }
      }
      const downloadUrl = config.publicBase + '/' + objectKey.split('/').map(encodeURIComponent).join('/')
      await fsp.unlink(req.file.path).catch(() => {})
      res.json({ fileId: objectKey, objectKey, storageProvider: 'r2', fileName, downloadUrl, size: req.file.size, contentType: mime })
    } catch (error) {
      console.error('Upload R2:', error.name || 'erro')
      res.status(502).json({ error: 'Falha ao enviar para R2. Confira a configuração e a conexão.' })
    } finally {
      req.off('aborted', abort)
      await fsp.unlink(req.file.path).catch(() => {})
    }
  })
  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? `O arquivo ultrapassa ${Math.round(maxSize / 1024 / 1024)} MB.` : 'Selecione apenas um arquivo por envio.' })
    res.status(500).json({ error: 'Erro no servidor local.' })
  })
  return app
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3001
  createApp().listen(port, '127.0.0.1', () => console.log(`API local R2: http://127.0.0.1:${port} — mantenha aberta durante os envios.`))
}
