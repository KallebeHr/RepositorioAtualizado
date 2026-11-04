import dotenv from 'dotenv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './r2-v2-upload.mjs'
import { createZipUploader } from './upload-zip.mjs'

const directory = dirname(fileURLToPath(import.meta.url))
const result = dotenv.config({ path: join(directory, '.env.r2-v2'), override: true, quiet: true })
if (result.error) throw new Error('Arquivo b2-backend/.env.r2-v2 não encontrado.')

const app = createApp({ objectPrefix: 'musicas-v2' })
const allowed = () => (process.env.ADMIN_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(v => v.trim())
// As mesmas origens autorizadas para o envio de músicas valem para os ZIPs do repertório.
app.use((req, res, next) => {
  if (req.headers.origin && !allowed().includes(req.headers.origin)) return res.status(403).json({ error: 'Origem não autorizada.' })
  next()
})
app.use(createZipUploader({ env: process.env }))

app.listen(3004, '127.0.0.1', () => console.log('API local de músicas e repertórios (R2): http://127.0.0.1:3004 — Firebase repertorio-cd75a é acessado pelo navegador.'))
