export function v2MusicDocument(row, cantor, estilo) {
  const audio = row.uploaded
  if (!audio?.fileId || !audio?.downloadUrl || audio.storageProvider !== 'r2' || !audio.objectKey?.startsWith('musicas-v2/')) throw new Error('O servidor não retornou um áudio R2 válido.')
  const url = new URL(audio.downloadUrl)
  if (url.protocol !== 'https:') throw new Error('A URL pública do áudio deve usar HTTPS.')
  const title = String(row.title || '').trim()
  if (!title || title.length > 200 || !cantor || String(cantor).length > 200 || !estilo || cantor === '__novo__' || estilo === '__novo__') throw new Error('Informe título, cantor e estilo válidos (título/cantor: até 200 caracteres).')
  if (!Number.isInteger(audio.size) || audio.size < 1 || audio.size > 300 * 1024 * 1024 || typeof audio.contentType !== 'string') throw new Error('O servidor retornou tamanho ou formato de áudio inválido.')
  return { title, fileId: audio.fileId, downloadUrl: audio.downloadUrl, tipo: [estilo], cantor,
    fileName: audio.fileName || row.file?.name || '', objectKey: audio.objectKey,
    storageProvider: 'r2', size: audio.size, contentType: audio.contentType }
}

export function createV2Publisher({ upload, save }) {
  return async (row, cantor, estilo) => {
    if (row.success) return
    if (!String(row.title || '').trim() || !cantor || !estilo || cantor === '__novo__' || estilo === '__novo__') throw new Error('Informe título, cantor e estilo antes de enviar.')
    if (!row.uploaded) {
      if (!row.file) throw new Error('Selecione novamente o arquivo.')
      row.status = 'Enviando áudio ao R2'
      row.uploaded = await upload(row)
    }
    row.status = 'Áudio no R2; cadastrando no Firebase'
    const result = await save(v2MusicDocument(row, cantor, estilo), row)
    row.success = true
    row.status = 'Publicada no Firebase'
    row.documentId = result.id
    return result
  }
}

export function v2Error(error) {
  if (error.code === 'permission-denied') return 'O Firebase atual negou acesso a musicasV2/cantoresV2/estilosV2. Confira as regras completas em firestore.rules e o papel admin da conta.'
  if (error.code === 'resource-exhausted') return 'Cota do Firebase atual excedida. Músicas normais e V2 usam o mesmo projeto repertorio-d3552 e compartilham a cota.'
  if (error.code === 'ERR_NETWORK') return 'Não foi possível acessar a API R2 local. Inicie npm run api:v2 neste computador.'
  return error.response?.data?.error || error.message || 'Não foi possível concluir o envio V2.'
}
