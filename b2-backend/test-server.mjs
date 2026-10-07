import dotenv from 'dotenv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './r2-upload.js'
// Configuração própria; a API atual na porta 3001 continua independente.
const loaded = dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env.r2-teste'), quiet: true })
if (loaded.error) throw new Error('Arquivo b2-backend/.env.r2-teste ausente. Use a configuração de testes incluída no pacote.')
const env = { ...loaded.parsed, ADMIN_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3003,http://127.0.0.1:3003' }
createApp({ env, objectPrefix: 'testes' }).listen(3002, '127.0.0.1', () => console.log('API de TESTE R2: http://127.0.0.1:3002 — arquivos em testes/; nenhum cadastro no Firebase.'))
