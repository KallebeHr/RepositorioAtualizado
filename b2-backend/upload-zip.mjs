import express from 'express'
import multer from 'multer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { r2Configuration } from './r2-v2-upload.mjs'

// Envio dos ZIPs do repertório. Diferente do envio de músicas, aqui o arquivo
// passa direto para o R2 em partes (multipart), sem carregar tudo na memória.
export function createZipUploader({ env = process.env, maxUploadMb } = {}) {
  const app = express()
  const limit = (Number(maxUploadMb ?? env.MAX_ZIP_UPLOAD_MB) || 4096) * 1024 * 1024
  const upload = multer({
    dest: path.join(os.tmpdir(), 'repertorio-zips'),
    limits: { fileSize: limit, files: 1 },
  })

  // O arquivo é gravado em disco pelo multer e depois enviado ao R2 em partes.
  app.post('/upload-zip', (req, res, next) => {
    try { r2Configuration(env); next() }
    catch (error) { res.status(503).json({ error: error.message }) }
  }, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' })
    let task
    const abort = () => task?.abort?.()
    try {
      const config = r2Configuration(env)
      const utf8Name = Buffer.from(req.file.originalname, 'latin1').toString('utf8')
      const originalName = utf8Name.includes('\uFFFD') ? req.file.originalname : utf8Name
      const fileName = path.basename(originalName).replace(/[\u0000-\u001f]/g, '')
      if (!/\.zip$/i.test(fileName)) return res.status(400).json({ error: 'Selecione um arquivo .zip.' })
      const objectKey = `repertorios/${crypto.randomUUID()}-${fileName}`

      req.on('aborted', abort)
      const client = new S3Client(config)
      task = new Upload({ client, params: {
        Bucket: config.bucket, Key: objectKey, Body: fs.createReadStream(req.file.path),
        ContentType: 'application/zip', ContentLength: req.file.size,
        ContentDisposition: `attachment; filename="${fileName.replace(/"/g, '')}"`,
        CacheControl: 'public, max-age=31536000, immutable',
      }, queueSize: 2, partSize: 16 * 1024 * 1024, leavePartsOnError: false })
      try { await task.done() } finally { client.destroy() }

      const downloadUrl = config.publicBase + '/' + objectKey.split('/').map(encodeURIComponent).join('/')
      res.json({ fileId: objectKey, objectKey, storageProvider: 'r2', fileName, downloadUrl, size: req.file.size, contentType: 'application/zip' })
    } catch (error) {
      console.error('Upload ZIP:', error.name || 'erro')
      res.status(502).json({ error: 'Falha ao enviar o ZIP para o R2. Confira a configuração, o limite de tamanho e a conexão.' })
    } finally {
      req.off('aborted', abort)
      await fsp.unlink(req.file.path).catch(() => {})
    }
  })

  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? `O arquivo ultrapassa ${Math.round(limit / 1024 / 1024)} MB.` : 'Selecione apenas um arquivo por envio.' })
    }
    res.status(500).json({ error: 'Erro no servidor local.' })
  })

  return app
}
