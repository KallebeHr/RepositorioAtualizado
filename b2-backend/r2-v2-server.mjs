import dotenv from 'dotenv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './r2-v2-upload.mjs'

const directory = dirname(fileURLToPath(import.meta.url))
const result = dotenv.config({ path: join(directory, '.env.r2-v2'), override: true, quiet: true })
if (result.error) throw new Error('Arquivo b2-backend/.env.r2-v2 não encontrado.')
const app = createApp({ objectPrefix: 'musicas-v2' })
app.listen(3004, '127.0.0.1', () => console.log('API local Músicas V2 (R2): http://127.0.0.1:3004 — Firebase é acessado pelo navegador.'))
