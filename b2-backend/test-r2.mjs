import dotenv from 'dotenv'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID, createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env.r2-teste'), quiet: true })
const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_BASE_URL']
const missing = required.filter(name => !process.env[name]?.trim())
if (missing.length) { console.error('Campos ausentes no backend .env.r2-teste: ' + missing.join(', ')); process.exit(1) }
const client = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }, maxAttempts: 1 })
const key = `testes/verificacao-${randomUUID()}.wav`
// Áudio sintético de 1 segundo; nenhum arquivo pessoal é enviado.
const rate = 8000, pcmBytes = rate * 2, bytes = Buffer.alloc(44 + pcmBytes)
bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8)
bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22)
bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34)
bytes.write('data', 36); bytes.writeUInt32LE(pcmBytes, 40)
for (let i = 0; i < rate; i++) bytes.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * i / rate) * 2000), 44 + i * 2)
const digest = value => createHash('sha256').update(value).digest('hex')
let uploaded = false
try {
 await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: bytes, ContentType: 'audio/wav' }), { abortSignal: AbortSignal.timeout(30000) })
 uploaded = true; console.log('OK: envio real para o R2.')
 const url = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '') + '/' + key
 const origin = 'http://localhost:3000'
 const response = await fetch(url, { headers: { Origin: origin }, signal: AbortSignal.timeout(30000) })
 if (!response.ok) throw new Error(`Download público retornou HTTP ${response.status}. Confira URL pública e acesso habilitado.`)
 const allow = response.headers.get('access-control-allow-origin')
 if (allow !== '*' && allow !== origin) throw new Error('O arquivo respondeu, mas o CORS não permite http://localhost:3000.')
 if (digest(Buffer.from(await response.arrayBuffer())) !== digest(bytes)) throw new Error('O conteúdo baixado diverge do áudio enviado.')
 console.log('OK: download público, CORS e conteúdo SHA-256.')
 const range = await fetch(url, { headers: { Origin: origin, Range: 'bytes=0-43' }, signal: AbortSignal.timeout(30000) })
 if (range.status !== 206 || !Buffer.from(await range.arrayBuffer()).equals(bytes.subarray(0, 44))) throw new Error('A entrega não respondeu corretamente ao intervalo de bytes.')
 console.log('OK: intervalos de bytes para avançar na música.')
 console.log('Teste R2 aprovado. Firebase não foi alterado.')
} catch (error) {
 console.error('Teste não concluído: ' + error.message); process.exitCode = 1
} finally {
 if (uploaded) {
  try { await client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }), { abortSignal: AbortSignal.timeout(30000) }); console.log('Áudio sintético de teste removido.') }
  catch { console.error('Limpeza pendente: remova somente este arquivo de teste no painel: ' + key); process.exitCode = 1 }
 }
 client.destroy()
}
