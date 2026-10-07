import axios from 'axios'
import dotenv from 'dotenv'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { configureB2Cors } from './b2-cors-policy.mjs'

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)), quiet: true })
const apply = process.argv.includes('--apply')
try {
  const result = await configureB2Cors({ client: axios, credentials: process.env, apply, backup: async data => {
    const filename = `b2-cors-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    await writeFile(new URL(filename, import.meta.url), JSON.stringify(data, null, 2), { flag: 'wx', mode: 0o600 })
    console.log(`Backup das regras anteriores: b2-backend/${filename}`)
  } })
  console.log(`Bucket: ${result.bucketName}`)
  console.log(JSON.stringify(apply ? result.proposedRules : { atuais: result.currentRules, propostas: result.proposedRules }, null, 2))
  console.log(result.applied ? 'CORS atualizado. Reinicie o navegador e teste o player e o download.' : result.changed ? 'Somente consulta. Para aplicar, execute npm run b2:cors.' : 'A regra do player já está configurada.')
} catch (error) {
  // Não imprime AxiosError: ele pode conter o token ou a chave de autorização.
  const reason = error.response ? `HTTP ${error.response.status}; código ${error.response.data?.code || 'indisponível'}.` : error.isAxiosError ? `Falha de conexão (${error.code || 'rede'}).` : error.message
  console.error(`Não foi possível configurar CORS: ${reason}`)
  process.exitCode = 1
}
