import { archiveFileName, musicIdentity } from '../utils/folders.mjs'

export async function processFolder(tracks, { mode, getBlob, save, zip, signal, onProgress = () => {}, maxBytes = 350 * 1024 * 1024 } = {}) {
  if (!['zip', 'offline'].includes(mode)) throw new Error('Ação de pasta inválida.')
  const unique = [...new Map(tracks.filter(track => track?.downloadUrl).map(track => [musicIdentity(track), track])).values()]
  if (!unique.length) throw new Error('Esta pasta não possui músicas disponíveis.')
  const declaredSize = unique.reduce((sum, track) => sum + (Number(track.size) || 0), 0)
  if (mode === 'zip' && declaredSize > maxBytes) throw new Error('Esta pasta ultrapassa 350 MB para um ZIP neste aparelho. Salve offline ou baixe as músicas individualmente.')
  const report = { total: unique.length, completed: 0, successes: [], failures: [], bytes: 0, cancelled: false }
  for (let i = 0; i < unique.length; i++) {
    if (signal?.aborted) { report.cancelled = true; break }
    const track = unique[i]
    onProgress({ ...report, track, phase: 'files' })
    try {
      if (mode === 'offline') await save(track, { signal })
      else {
        const blob = await getBlob(track, { signal })
        if (signal?.aborted) { report.cancelled = true; break }
        if (report.bytes + blob.size > maxBytes) throw Object.assign(new Error('Limite de 350 MB do ZIP atingido. Use o salvamento offline para esta pasta.'), { fatal: true })
        report.bytes += blob.size
        zip.file(archiveFileName(track, i), blob)
      }
      report.successes.push({ id: musicIdentity(track), title: track.title || track.fileName })
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') { report.cancelled = true; break }
      if (error.fatal) throw error
      report.failures.push({ id: musicIdentity(track), title: track.title || track.fileName, error: error.message })
    }
    report.completed++
    onProgress({ ...report, track, phase: 'files' })
  }
  if (mode === 'zip' && report.successes.length && !report.cancelled) {
    if (report.failures.length) zip.file('LEIA-ME-PENDENCIAS.txt', report.failures.map(item => `${item.title}: ${item.error}`).join('\n'))
    onProgress({ ...report, phase: 'zip' })
    report.blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
    if (signal?.aborted) { delete report.blob; report.cancelled = true }
  }
  return report
}
