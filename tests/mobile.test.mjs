import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { applyPlaybackVolume, normalizeVolume } from '../src/utils/audio-volume.mjs'
import { installationPlatform } from '../src/utils/pwa-platform.mjs'

test('volume continua ajustável quando o elemento HTML ignora o volume, como no iOS', () => {
  const audio = { get volume() { return 1 }, set volume(_) {} }
  const output = { gain: { value: 0.75 } }, context = { state: 'suspended' }
  applyPlaybackVolume(audio, output, context, 0.2)
  assert.equal(audio.volume, 1)
  assert.ok(Math.abs(output.gain.value - 0.15) < 1e-10)
  applyPlaybackVolume(audio, output, context, 0)
  assert.equal(output.gain.value, 0)
  applyPlaybackVolume(audio, output, context, 1)
  assert.equal(output.gain.value, 0.75)
})

test('desktop não atenua o volume duas vezes e mantém reserva para o equalizador', () => {
  const audio = { volume: 0.4 }, output = { gain: { value: 1 } }
  applyPlaybackVolume(audio, output, { state: 'interrupted' }, 0.4)
  assert.equal(audio.volume, 1)
  assert.ok(Math.abs(output.gain.value - 0.3) < 1e-10)
  assert.equal(normalizeVolume(4), 1)
  assert.equal(normalizeVolume(-2), 0)
  assert.equal(normalizeVolume('inválido', 0.4), 0.4)
})

test('trocas rápidas de volume cancelam a rampa anterior e suavizam o novo ganho', () => {
  const calls = [], gain = { value: 0.75,
    cancelScheduledValues: time => calls.push(['cancel', time]),
    setValueAtTime: (value, time) => calls.push(['start', value, time]),
    linearRampToValueAtTime: (value, time) => calls.push(['target', value, time]),
  }
  applyPlaybackVolume({ volume: 1 }, { gain }, { state: 'running', currentTime: 2 }, 0)
  applyPlaybackVolume({ volume: 1 }, { gain }, { state: 'running', currentTime: 2.01 }, 1)
  assert.equal(calls.filter(call => call[0] === 'cancel').length, 2)
  assert.deepEqual(calls[2], ['target', 0, 2.025])
  assert.deepEqual(calls[5].slice(0, 2), ['target', 0.75])
  assert.ok(Math.abs(calls[5][2] - 2.035) < 1e-10)
})

test('navegador sem grafo Web Audio conserva o controle HTML disponível', () => {
  const audio = { volume: 1 }
  applyPlaybackVolume(audio, null, null, 0.35)
  assert.equal(audio.volume, 0.35)
  assert.equal(applyPlaybackVolume(null, null, null, 0), 0)
})

test('instruções iOS cobrem iPhone, Chrome no iPhone e iPad com identificação de Mac', () => {
  for (const userAgent of ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Version/18.0 Safari/604.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) CriOS/128.0']) {
    assert.equal(installationPlatform({ userAgent }).ios, true)
  }
  assert.equal(installationPlatform({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }).ios, true)
  assert.equal(installationPlatform({ platform: 'MacIntel', maxTouchPoints: 0 }).ios, false)
})

test('Android distingue Chrome comum e navegador embutido que precisa abrir externamente', () => {
  assert.deepEqual(installationPlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/128.0 Mobile Safari/537.36' }), { ios: false, android: true, embedded: false })
  for (const suffix of ['Instagram', 'FBAN/FB4A', '; wv)']) {
    assert.equal(installationPlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 14) ' + suffix }).embedded, true)
  }
})

async function earlyCapture() {
  const window = new EventTarget()
  vm.runInNewContext(await readFile(new URL('../public/pwa-install-capture.js', import.meta.url), 'utf8'), { window })
  return window
}
test('oferta de instalação antes do Vue permanece disponível e transfere sem duplicar ouvintes', async () => {
  const window = await earlyCapture(), event = new Event('beforeinstallprompt', { cancelable: true })
  window.dispatchEvent(event)
  const capture = window.repertorioInstallCapture
  assert.equal(event.defaultPrevented, true)
  assert.equal(capture.prompt, event)
  capture.detach()
  const later = new Event('beforeinstallprompt', { cancelable: true })
  window.dispatchEvent(later)
  assert.equal(later.defaultPrevented, false)
  assert.equal(capture.prompt, event)
})
test('instalação concluída antes do Vue limpa a oferta e conserva o estado instalado', async () => {
  const window = await earlyCapture()
  window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true }))
  window.dispatchEvent(new Event('appinstalled'))
  assert.equal(window.repertorioInstallCapture.installed, true)
  assert.equal(window.repertorioInstallCapture.prompt, null)
})
