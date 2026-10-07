import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { useUserStore } from './userStore.js'
import { getPlaybackSource } from '../services/offline.js'
import { normalizeTrack, trackKey } from '../utils/media.js'
import { applyPlaybackVolume, normalizeVolume } from '../utils/audio-volume.mjs'

// Um único elemento de áudio e um único grafo, independente da rota.
let audio, context, source, input, output, filters = [], currentBlobUrl
let generation = 0

export const usePlayerStore = defineStore('player', {
  state: () => ({
    queue: [], currentIndex: -1, sound: null, isPlaying: false, volume: 1,
    fullList: [], eqOpen: false, loading: false, error: '', sleepAt: null,
    eq: { enabled: true, ready: false, bands: [
      { key: '60', label: 'Grave', freq: 60, gain: 0 }, { key: '170', label: 'Médio-grave', freq: 170, gain: 0 },
      { key: '350', label: 'Médio', freq: 350, gain: 0 }, { key: '1k', label: 'Voz', freq: 1000, gain: 0 },
      { key: '3.5k', label: 'Voz-agudo', freq: 3500, gain: 0 }, { key: '10k', label: 'Agudo', freq: 10000, gain: 0 },
    ] },
  }),
  getters: {
    current: state => state.queue[state.currentIndex] || null,
    currentTrack: state => state.queue[state.currentIndex] || null,
    howlerAudioEl: () => audio || null,
    audioOutput: () => output || null,
    audioContext: () => context || null,
  },
  actions: {
    setFullList(list) { if (list?.length) this.fullList = list.map(normalizeTrack) },
    persist() {
      const uid = useUserStore().user?.uid
      if (!uid) return
      try { localStorage.setItem('repertorio:player:' + uid, JSON.stringify({ queue: this.queue.slice(0,500), currentIndex: this.currentIndex, volume: this.volume, eq: { enabled: this.eq.enabled, gains: this.eq.bands.map(b => b.gain) } })) } catch {}
    },
    restore(uid) {
      this.stop(); this.queue = []
      if (!uid) return
      try {
        const saved = JSON.parse(localStorage.getItem('repertorio:player:' + uid) || 'null')
        if (!saved) return
        this.queue = (saved.queue || []).filter(track => track?.downloadUrl).slice(0,500).map(normalizeTrack)
        this.currentIndex = this.queue.length ? Math.max(0, Math.min(this.queue.length-1, saved.currentIndex || 0)) : -1
        this.volume = normalizeVolume(saved.volume, 1)
        this.eq.enabled = saved.eq?.enabled !== false
        this.eq.bands.forEach((b,i) => { b.gain = Math.max(-12,Math.min(12,Number(saved.eq?.gains?.[i]) || 0)); if(filters[i])filters[i].gain.value=b.gain })
        this._applyEq()
        this._applyVolume()
      } catch {}
    },
    replaceQueue(list) {
      if (!useUserStore().hasActiveSubscription) { this.error = 'Ative sua assinatura para ouvir músicas.'; return }
      this.queue = list.filter(track => track?.downloadUrl).map(normalizeTrack)
      this.fullList = [...this.queue]
      if (this.queue.length) this.play(0); else this.stop()
      this.persist()
    },
    addToQueue(track, { playNow = false } = {}) {
      if (!track?.downloadUrl) return
      if (!useUserStore().hasActiveSubscription) { this.error = 'Ative sua assinatura para ouvir músicas.'; return }
      const normalized = normalizeTrack(track)
      const existing = this.queue.findIndex(item => trackKey(item) === trackKey(normalized))
      const index = existing >= 0 ? existing : this.queue.push(normalized) - 1
      if (playNow || this.currentIndex === -1) this.play(index)
      this.persist()
    },
    _ensureAudio() {
      if (!audio) {
        audio = new Audio()
        audio.crossOrigin = 'anonymous'
        audio.preload = 'metadata'
        audio.addEventListener('play', () => { this.isPlaying = true; this._updateMediaSession() })
        audio.addEventListener('pause', () => { this.isPlaying = false; this._updateMediaSession() })
        audio.addEventListener('ended', () => this.next())
        audio.addEventListener('error', () => { this.loading = false; this.isPlaying = false; this.error = 'Não foi possível carregar o áudio. Confira a conexão, o formato e o CORS do B2/R2 para este endereço do site.' })
        audio.addEventListener('timeupdate', () => {
          if (this.sleepAt && Date.now() >= this.sleepAt) { audio.pause(); this.sleepAt = null }
          this._updatePosition()
        })
      }
      if (!this.sound) this.sound = markRaw({
        _sounds: [{ _node: audio }],
        duration: () => Number.isFinite(audio.duration) ? audio.duration : 0,
        seek: seconds => { if (typeof seconds === 'number') audio.currentTime = seconds; return audio.currentTime },
        pause: () => audio.pause(),
        play: () => audio.play(),
        stop: () => { audio.pause(); audio.currentTime = 0 },
        volume: value => { if (value !== undefined) this.setVolume(value); return this.volume },
      })
      return audio
    },
    async play(index = this.currentIndex) {
      if (index < 0 || index >= this.queue.length) return
      if (!useUserStore().hasActiveSubscription) { this.error = 'Ative sua assinatura para ouvir músicas.'; return }
      const request = ++generation
      this.currentIndex = index
      this.persist()
      this.loading = true
      this.error = ''
      const element = this._ensureAudio()
      // Libera Web Audio durante o gesto de toque, antes da consulta local.
      await this.eqInitOrReconnect().catch(() => {})
      try {
        const playback = await getPlaybackSource(useUserStore().user?.uid, this.current)
        if (request !== generation) { if (playback.local) URL.revokeObjectURL(playback.url); return }
        element.pause()
        if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl)
        currentBlobUrl = playback.local ? playback.url : null
        element.src = playback.url
        this._applyVolume()
        element.load()
        this._updateMediaSession()
        await element.play()
      } catch (error) {
        if (request === generation) {
          this.isPlaying = false
          this.error = error?.name === 'NotAllowedError' ? 'Toque em reproduzir para iniciar a música.' : element.error ? 'Não foi possível carregar o áudio. Confira a conexão, o formato e o CORS do B2/R2 para este endereço do site.' : error.message || 'Erro ao reproduzir.'
        }
      } finally { if (request === generation) this.loading = false }
    },
    async togglePlay() {
      if (!audio?.src) { if (this.queue.length) await this.play(Math.max(0, this.currentIndex)); return }
      if (!useUserStore().hasActiveSubscription) { this.error = 'Ative sua assinatura para ouvir músicas.'; return }
      if (audio.paused) {
        await this.eqInitOrReconnect().catch(() => {})
        await audio.play().catch(() => { this.error = 'Toque novamente para reproduzir.' })
      } else audio.pause()
    },
    next() {
      if (this.currentIndex < this.queue.length - 1) return this.play(this.currentIndex + 1)
      const genres = this.current?.estilos || []
      const candidates = this.fullList.filter(track => !genres.length || (track.estilos || []).some(genre => genres.includes(genre)))
      const position = candidates.findIndex(track => trackKey(track) === trackKey(this.current))
      const next = candidates[position + 1] || candidates[0]
      if (next) return this.addToQueue(next, { playNow: true })
      if (this.queue.length) return this.play(0)
      this.stop()
    },
    prev() { if (audio?.currentTime > 3) this.seekTo(0); else this.play(Math.max(0, this.currentIndex - 1)) },
    seekTo(seconds) { if (audio && Number.isFinite(Number(seconds))) audio.currentTime = Math.max(0, Number(seconds)) },
    _applyVolume() { applyPlaybackVolume(audio, output, context, this.volume) },
    setVolume(value) { this.volume = normalizeVolume(value, this.volume); this._applyVolume(); this.persist() },
    setSleepTimer(minutes) { this.sleepAt = minutes > 0 ? Date.now() + minutes * 60000 : null },
    stop() {
      generation++
      if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load() }
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl)
      currentBlobUrl = null
      this.isPlaying = false; this.loading = false; this.currentIndex = -1
    },
    removeFromQueue(index) {
      const current = index === this.currentIndex
      this.queue.splice(index, 1)
      if (!this.queue.length) this.stop()
      else if (current) this.play(Math.min(index, this.queue.length - 1))
      else if (index < this.currentIndex) this.currentIndex--
      this.persist()
    },
    clearQueue() { this.stop(); this.queue = []; this.persist() },
    async eqInitOrReconnect() {
      this._ensureAudio()
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)()
        source = context.createMediaElementSource(audio)
        input = context.createGain(); output = context.createGain()
        filters = this.eq.bands.map(band => {
          const filter = context.createBiquadFilter()
          filter.type = 'peaking'; filter.frequency.value = band.freq; filter.Q.value = 1; filter.gain.value = band.gain
          return filter
        })
        input.connect(filters[0])
        filters.forEach((filter, index) => filter.connect(filters[index + 1] || output))
        output.connect(context.destination)
        this._applyEq()
        this._applyVolume()
      }
      if (context.state === 'suspended' || context.state === 'interrupted') await context.resume()
      this.eq.ready = true
      return true
    },
    _eqEnsureContext() { return this.eqInitOrReconnect() },
    _eqResume() { return this.eqInitOrReconnect() },
    _eqConnectFromHowler() { return this.eqInitOrReconnect() },
    _eqApplyEnabled() { return this.eqSetEnabled(this.eq.enabled) },
    _applyEq() {
      if (!source) return
      source.disconnect()
      source.connect(this.eq.enabled ? input : output)
    },
    async eqSetEnabled(enabled) { this.eq.enabled = !!enabled; await this.eqInitOrReconnect(); this._applyEq(); this.persist() },
    eqSetBandGain(key, value) {
      const index = this.eq.bands.findIndex(band => band.key === key)
      if (index < 0) return
      const gain = Math.max(-12, Math.min(12, Number(value) || 0))
      this.eq.bands[index].gain = gain
      if (filters[index]) filters[index].gain.value = gain
      this.persist()
    },
    eqReset() { this.eq.bands.forEach(band => this.eqSetBandGain(band.key, 0)) },
    _updateMediaSession() {
      if (!('mediaSession' in navigator) || !this.current) return
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: this.current.title || 'Música', artist: this.current.cantor || '', album: 'Repertório Atualizado',
          artwork: [{ src: new URL('/icons/icon-512.png', location.origin).href, sizes: '512x512', type: 'image/png' }],
        })
        navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused'
        const handlers = {
          play: () => { if (!this.isPlaying) this.togglePlay() }, pause: () => audio?.pause(),
          previoustrack: () => this.prev(), nexttrack: () => this.next(),
          seekto: details => this.seekTo(details.seekTime),
          seekbackward: details => this.seekTo((audio?.currentTime || 0) - (details.seekOffset || 10)),
          seekforward: details => this.seekTo((audio?.currentTime || 0) + (details.seekOffset || 10)),
        }
        Object.entries(handlers).forEach(([action, handler]) => { try { navigator.mediaSession.setActionHandler(action, handler) } catch {} })
      } catch {}
    },
    _updatePosition() {
      if (!navigator.mediaSession?.setPositionState || !Number.isFinite(audio?.duration) || !audio.duration) return
      try { navigator.mediaSession.setPositionState({ duration: audio.duration, position: Math.min(audio.currentTime, audio.duration), playbackRate: audio.playbackRate }) } catch {}
    },
  },
})
