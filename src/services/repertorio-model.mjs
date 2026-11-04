// Regras do repertório em ZIP, separadas da interface para poderem ser testadas.
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

export function documentoDaParte({ nome, ordem, senha, ativo, arquivo }) {
  const documento = {
    nome: nomeDaParte(nome),
    ordem: ordemDaParte(ordem),
    senha: senhaDaParte(senha),
    ativo: ativo !== false,
  }
  if (arquivo) Object.assign(documento, validarUploadZip(arquivo))
  return documento
}

// A página do usuário só lista partes visíveis e com link.
export function partesVisiveis(lista) {
  return (Array.isArray(lista) ? lista : [])
    .filter(parte => parte && parte.ativo !== false && parte.url)
    .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0))
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
