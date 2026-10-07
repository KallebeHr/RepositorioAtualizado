import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import axios from 'axios'
import { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { r2Configuration } from './r2-upload.js'
const directory = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(directory, '.env'), quiet: true })
dotenv.config({ path: path.join(directory, '.env.v2'), override: true, quiet: true })

async function main() {
  const preview = !process.argv.includes('--copy')
  const target = r2Configuration()
  if (!process.env.B2_KEY_ID || !process.env.B2_APP_KEY || !process.env.B2_BUCKET_NAME) throw new Error('Preencha B2_KEY_ID, B2_APP_KEY e B2_BUCKET_NAME no .env local.')
  let endpoint = process.env.B2_S3_ENDPOINT
  if (!endpoint) {
    const response = await axios.get('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
      auth: { username: process.env.B2_KEY_ID, password: process.env.B2_APP_KEY }, timeout: 30000,
    })
    endpoint = response.data.apiInfo?.storageApi?.s3ApiUrl || response.data.s3ApiUrl
  }
  if (!endpoint) throw new Error('Não foi possível identificar B2_S3_ENDPOINT.')
  const region = new URL(endpoint).hostname.match(/^s3\.(.+)\.backblazeb2\.com$/)?.[1]
  if (!region) throw new Error('Endpoint S3 do B2 inválido.')
  const source = new S3Client({ endpoint, region, credentials: { accessKeyId: process.env.B2_KEY_ID, secretAccessKey: process.env.B2_APP_KEY } })
  const destination = new S3Client(target)
  let token, count = 0, copied = 0, bytes = 0
  const report = fs.createWriteStream(path.join(directory, 'migration-report.ndjson'), { flags: 'a' })
  try {
    do {
      const page = await source.send(new ListObjectsV2Command({ Bucket: process.env.B2_BUCKET_NAME, ContinuationToken: token }))
      for (const object of page.Contents || []) {
        count++; bytes += object.Size || 0
        if (preview) { console.log(`Encontrado: ${object.Key} (${object.Size} bytes)`); continue }
        let existing
        try { existing = await destination.send(new HeadObjectCommand({ Bucket: target.bucket, Key: object.Key })) }
        catch (error) { if (error.$metadata?.httpStatusCode !== 404 && error.name !== 'NotFound') throw error }
        if (existing) {
          if (existing.ContentLength !== object.Size) throw new Error(`O destino já contém um arquivo de tamanho diferente: ${object.Key}. Confira antes de continuar.`)
          report.write(JSON.stringify({ key: object.Key, size: object.Size, status: 'existing', at: new Date().toISOString() }) + '\n')
          console.log('Já existe no destino:', object.Key)
          continue
        }
        const downloaded = await source.send(new GetObjectCommand({ Bucket: process.env.B2_BUCKET_NAME, Key: object.Key }))
        await new Upload({ client: destination, params: {
          Bucket: target.bucket, Key: object.Key, Body: downloaded.Body, ContentLength: object.Size,
          ContentType: downloaded.ContentType || 'audio/mpeg', CacheControl: 'public, max-age=86400',
        }, queueSize: 2, leavePartsOnError: false }).done()
        const verified = await destination.send(new HeadObjectCommand({ Bucket: target.bucket, Key: object.Key }))
        if (verified.ContentLength !== object.Size) throw new Error('Tamanho divergente após copiar: ' + object.Key)
        copied++
        report.write(JSON.stringify({ key: object.Key, size: object.Size, status: 'copied-size-verified', at: new Date().toISOString() }) + '\n')
        console.log('Copiado e tamanho conferido:', object.Key)
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined
    } while (token)
    console.log(`${preview ? 'Prévia' : 'Cópia'}: ${count} objetos, ${(bytes / 1e9).toFixed(2)} GB; ${copied} novos objetos copiados.`)
    console.log('Nenhum arquivo foi apagado do B2 e nenhum documento do Firebase foi alterado.')
    if (preview) console.log('Para copiar: npm run migrate:b2 -- --copy')
  } finally { report.end(); source.destroy(); destination.destroy() }
}
main().catch(error => { console.error('Migração interrompida:', error.message); process.exitCode = 1 })
