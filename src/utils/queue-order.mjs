import { trackKey } from './media.js'

// A ordem muda; a faixa atual continua apontando para o mesmo áudio.
export function reorderKeepingCurrent(queue, currentIndex, ordered) {
  if (!Array.isArray(ordered) || ordered.length !== queue.length) throw new Error('A fila mudou durante o arraste. Tente novamente.')
  const original = new Map(queue.map(track => [trackKey(track), track]))
  const keys = ordered.map(trackKey)
  if (new Set(keys).size !== queue.length || keys.some(key => !original.has(key))) throw new Error('A nova ordem deve conter as mesmas músicas da fila.')
  const currentKey = trackKey(queue[currentIndex])
  return { queue: keys.map(key => original.get(key)), currentIndex: currentKey ? keys.indexOf(currentKey) : -1 }
}

export function moveQueueItem(queue, currentIndex, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= queue.length || to >= queue.length) throw new Error('Posição inválida na fila.')
  const ordered = [...queue]
  ordered.splice(to, 0, ordered.splice(from, 1)[0])
  return reorderKeepingCurrent(queue, currentIndex, ordered)
}
