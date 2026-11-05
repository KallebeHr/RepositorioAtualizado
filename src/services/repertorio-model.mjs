// Regras do repertório, separadas da interface para poderem ser testadas.
// Cada parte pode ser um ZIP nosso (enviado ao R2) ou um link externo (MediaFire).
// A senha é apenas uma trava de tela: ela não protege o arquivo em si.

export const TAMANHO_MAXIMO_ZIP = 4 * 1024 * 1024 * 1024 // 4 GB por parte

export function nomeDaParte(valor) {
  const nome = String(valor ?? '').trim()
  if (!nome) throw new Error('Informe o nome da parte.')
  if (nome.length > 120) throw new Error('O nome da parte deve ter até 120 caracteres.')
  return nome
}

export function senhaDaParte(valor) {
  const senha = String(valor ?? '').trim()
  if (senha.length > 60) throw new Error('A senha deve ter até 60 caracteres.')
  return senha
}

export function ordemDaParte(valor) {
  const ordem = Number(valor)
  if (!Number.isFinite(ordem) || ordem < 0) return 0
  return Math.floor(ordem)
}

export function validarUploadZip(dados) {
  if (!dados?.downloadUrl || !dados?.objectKey) throw new Error('O servidor não retornou um ZIP válido.')
  const url = new URL(dados.downloadUrl)
  if (url.protocol !== 'https:') throw new Error('A URL pública do ZIP deve usar HTTPS.')
  if (!String(dados.objectKey).startsWith('repertorios/')) throw new Error('O ZIP precisa ficar na pasta repertorios do R2.')
  const tamanho = Number(dados.size)
  if (!Number.isInteger(tamanho) || tamanho < 1) throw new Error('O servidor retornou um tamanho de arquivo inválido.')
  if (tamanho > TAMANHO_MAXIMO_ZIP) throw new Error('O arquivo ultrapassa o limite de 4 GB por parte.')
  // O campo precisa se chamar 'tamanho' para bater com a validação das regras do Firestore.
  return { url: dados.downloadUrl, objectKey: dados.objectKey, tamanho, fileName: dados.fileName || '', contentType: dados.contentType || 'application/zip' }
}

// Link externo: só HTTPS, e o endereço inteiro guardado (sem barra no fim).
export function normalizarLink(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) throw new Error('Informe o endereço do link.')
  if (texto.length > 500) throw new Error('O endereço deve ter até 500 caracteres.')
  let url
  try { url = new URL(texto) } catch { throw new Error('Esse endereço não é um link válido.') }
  if (url.protocol !== 'https:') throw new Error('O link precisa começar com https://.')
  return url.href.replace(/\/$/, '')
}

export function documentoDaParte({ nome, ordem, senha, ativo, arquivo, link }) {
  const documento = {
    nome: nomeDaParte(nome),
    ordem: ordemDaParte(ordem),
    senha: senhaDaParte(senha),
    ativo: ativo !== false,
  }
  if (arquivo) {
    Object.assign(documento, validarUploadZip(arquivo), { tipo: 'arquivo' })
    return documento
  }
  if (link) {
    const url = normalizarLink(link)
    Object.assign(documento, { tipo: 'link', url, objectKey: 'link/' + new URL(url).hostname })
    return documento
  }
  throw new Error('Envie um ZIP ou informe um link para a parte.')
}

// A página do usuário só lista partes visíveis, com link, e com tipo reconhecido.
export function partesVisiveis(lista) {
  return (Array.isArray(lista) ? lista : [])
    .filter(parte => parte && parte.ativo !== false && parte.url
      && (parte.tipo === 'link' || parte.tipo === 'arquivo'
        || String(parte.objectKey || '').startsWith('repertorios/')))
    .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0))
}

// Um link antigo sem tipo declarado é tratado como arquivo nosso.
export function tipoDaParte(parte) {
  if (parte?.tipo === 'link') return 'link'
  if (parte?.tipo === 'arquivo') return 'arquivo'
  return String(parte?.objectKey || '').startsWith('repertorios/') ? 'arquivo' : 'link'
}

export function tamanhoLegivel(bytes) {
  const valor = Number(bytes)
  if (!Number.isFinite(valor) || valor <= 0) return ''
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB']
  let indice = 0
  let restante = valor
  while (restante >= 1024 && indice < unidades.length - 1) { restante /= 1024; indice++ }
  return `~${restante.toFixed(restante >= 10 || indice < 2 ? 0 : 1)} ${unidades[indice]}`
}
