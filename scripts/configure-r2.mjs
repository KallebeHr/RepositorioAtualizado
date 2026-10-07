import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { readFile, writeFile } from 'node:fs/promises'
const prompt = createInterface({ input: stdin, output: stdout })
async function fileText(filename) { return readFile(filename, 'utf8').catch(() => '') }
const current = await fileText('b2-backend/.env.v2')
const values = Object.fromEntries(current.split(/\r?\n/).filter(line => line && !line.startsWith('#') && line.includes('=')).map(line => {
  const index = line.indexOf('='); return [line.slice(0,index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g,'')]
}))
async function ask(label, fallback = '') { const answer = (await prompt.question(label + (fallback ? ` [${fallback}]` : '') + ': ')).trim(); return answer || fallback }
try {
  console.log('Configuração local do R2. As chaves ficam somente em b2-backend/.env.v2; a configuração B2 anterior será preservada.')
  const account = await ask('Account ID da Cloudflare', values.R2_ACCOUNT_ID)
  if (!/^[a-f0-9]{32}$/i.test(account)) throw new Error('Account ID inválido. Copie o ID de 32 caracteres no painel Cloudflare.')
  const bucket = await ask('Nome do bucket', values.R2_BUCKET_NAME || 'repertorio-musicas')
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('Nome de bucket inválido.')
  const access = await ask('Access Key ID do R2 (Enter mantém a chave existente)', '') || values.R2_ACCESS_KEY_ID
  const secret = await ask('Secret Access Key do R2 (Enter mantém a chave existente)', '') || values.R2_SECRET_ACCESS_KEY
  if (!access || !secret) throw new Error('Preencha as duas chaves do token R2.')
  const base = await ask('URL pública do Worker ou domínio R2', values.R2_PUBLIC_BASE_URL)
  if (!base || new URL(base).protocol !== 'https:') throw new Error('Use uma URL pública https:// válida.')
  Object.assign(values, { R2_ACCOUNT_ID:account, R2_BUCKET_NAME:bucket, R2_ACCESS_KEY_ID:access, R2_SECRET_ACCESS_KEY:secret, R2_PUBLIC_BASE_URL:base.replace(/\/$/, ''), FIREBASE_PROJECT_ID:values.FIREBASE_PROJECT_ID || 'repertorio-d3552', FIREBASE_SERVICE_ACCOUNT_PATH:values.FIREBASE_SERVICE_ACCOUNT_PATH || 'firebase-service-account.v2.json', ADMIN_ORIGINS:values.ADMIN_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3003,http://127.0.0.1:3003,https://repertorioatualizado.com.br,https://www.repertorioatualizado.com.br' })
  if (current) await writeFile('b2-backend/.env.v2.backup-'+Date.now(), current, {mode:0o600,flag:'wx'})
  await writeFile('b2-backend/.env.v2', Object.entries(values).map(([key,value]) => `${key}=${value}`).join('\n') + '\n', { mode:0o600 })
  console.log('Configuração V2 salva com cópia anterior de segurança. Reinicie npm run api:v2. A configuração .env do B2 e as URLs do catálogo antigo foram preservadas.')
} catch (error) { console.error(error.message); process.exitCode = 1 }
finally { prompt.close() }
