// Volume do aplicativo no mesmo grafo do equalizador, inclusive no Safari/iOS.
export const MASTER_HEADROOM = 0.75

export function normalizeVolume(value, fallback = 1) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback
}

export function applyPlaybackVolume(audio, output, context, value) {
  const volume = normalizeVolume(value)
  if (!audio) return volume
  if (!output || !context) {
    audio.volume = volume
    return volume
  }
  // Evita atenuar duas vezes no desktop e não depende do volume HTML no iOS.
  audio.volume = 1
  const gain = output.gain
  const target = MASTER_HEADROOM * volume
  if (context.state === 'running') {
    const now = context.currentTime
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(gain.value, now)
    gain.linearRampToValueAtTime(target, now + 0.025)
  } else {
    gain.value = target
  }
  return volume
}
