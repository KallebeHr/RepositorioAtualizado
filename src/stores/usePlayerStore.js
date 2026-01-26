// src/stores/usePlayerStore.js
import { defineStore } from "pinia"
import { Howl } from "howler"

export const usePlayerStore = defineStore("player", {
  state: () => ({
    queue: [],
    currentIndex: -1,
    sound: null,
    isPlaying: false,
    volume: 1.0,
    fullList: [],

    // ✅ EQUALIZADOR (Web Audio API)
    eq: {
      enabled: true,
      ready: false,
      bands: [
        { key: "60", freq: 60, gain: 0 },
        { key: "170", freq: 170, gain: 0 },
        { key: "350", freq: 350, gain: 0 },
        { key: "1k", freq: 1000, gain: 0 },
        { key: "3.5k", freq: 3500, gain: 0 },
        { key: "10k", freq: 10000, gain: 0 }
      ]
    }
  }),

  getters: {
    current(state) {
      return state.queue[state.currentIndex] || null
    },

    // ✅ expõe o <audio> interno do Howler (html5: true)
    howlerAudioEl(state) {
      try {
        return state.sound?._sounds?.[0]?._node || null
      } catch {
        return null
      }
    }
  },

  actions: {
    setFullList(list) {
      this.fullList = list || []
    },

    addToQueue(track, { playNow = false } = {}) {
      if (!track?.downloadUrl) return

      this.queue.push(track)

      if (this.currentIndex === -1) {
        this.play(0)
        return
      }

      if (playNow) {
        const idx = this.queue.length - 1
        this.play(idx)
      }
    },

    /* =========================================================
       ✅ WEB AUDIO API — EQUALIZADOR (no STORE)
       - Conecta no HTMLAudioElement interno do Howler
       - Funciona com html5:true
       - Reconecta automaticamente a cada play (novo Howl)
    ========================================================= */
    _eqEnsureContext() {
      if (this._eqCtx) return
      this._eqCtx = new (window.AudioContext || window.webkitAudioContext)()
    },

    async _eqResume() {
      if (!this._eqCtx) return
      if (this._eqCtx.state === "suspended") {
        try {
          await this._eqCtx.resume()
        } catch {}
      }
    },

    _eqBuildGraph() {
      const ctx = this._eqCtx
      if (!ctx) return

      this._eqInput = ctx.createGain()
      this._eqOutput = ctx.createGain()

      this._eqFilters = this.eq.bands.map(b => {
        const f = ctx.createBiquadFilter()
        f.type = "peaking"
        f.frequency.value = b.freq
        f.Q.value = 1.0
        f.gain.value = b.gain
        return f
      })

      // input -> filters -> output -> destination
      this._eqInput.connect(this._eqFilters[0])
      for (let i = 0; i < this._eqFilters.length - 1; i++) {
        this._eqFilters[i].connect(this._eqFilters[i + 1])
      }
      this._eqFilters[this._eqFilters.length - 1].connect(this._eqOutput)
      this._eqOutput.connect(ctx.destination)
    },

    _eqDisconnectAll() {
      try { this._eqSource?.disconnect() } catch {}
      try { this._eqInput?.disconnect() } catch {}
      try { this._eqOutput?.disconnect() } catch {}
      try { this._eqFilters?.forEach(f => f.disconnect()) } catch {}
    },

    _eqConnectFromHowler() {
      const el = this.howlerAudioEl
      if (!el) return false

      // ajuda em CORS quando o servidor permitir
      try {
        el.crossOrigin = "anonymous"
      } catch {}

      // evita refazer se já está no mesmo elemento
      if (this._eqMediaEl === el && this._eqSource && this._eqCtx) return true

      this._eqEnsureContext()
      this._eqDisconnectAll()

      this._eqMediaEl = el

      try {
        // createMediaElementSource só pode ser 1x por elemento
        this._eqSource = this._eqCtx.createMediaElementSource(el)
      } catch (err) {
        console.error("[EQ] Falha ao capturar áudio do Howler:", err)
        this.eq.ready = false
        return false
      }

      this._eqBuildGraph()

      // source -> input (começa com EQ ligado; se desligar, fazemos bypass)
      this._eqSource.connect(this._eqInput)

      this.eq.ready = true
      this._eqApplyEnabled()
      return true
    },

    _eqBypass() {
      if (!this._eqCtx || !this._eqSource) return
      this._eqDisconnectAll()
      try {
        this._eqSource.connect(this._eqCtx.destination)
      } catch {}
    },

    _eqEnable() {
      if (!this._eqCtx || !this._eqSource) return
      this._eqDisconnectAll()
      this._eqBuildGraph()
      try {
        this._eqSource.connect(this._eqInput)
      } catch {}
    },

    _eqApplyEnabled() {
      if (!this.eq.ready) return
      if (this.eq.enabled) this._eqEnable()
      else this._eqBypass()
    },

    // ✅ API pública pro seu componente (se quiser usar)
    async eqInitOrReconnect() {
      this._eqEnsureContext()
      await this._eqResume()
      return this._eqConnectFromHowler()
    },

    async eqSetEnabled(v) {
      this.eq.enabled = !!v
      await this.eqInitOrReconnect()
      this._eqApplyEnabled()
    },

    async eqSetBandGain(key, gain) {
      const b = this.eq.bands.find(x => x.key === key)
      if (!b) return
      b.gain = Number(gain || 0)

      // aplica ao vivo
      if (this._eqFilters?.length) {
        const idx = this.eq.bands.findIndex(x => x.key === key)
        if (idx >= 0 && this._eqFilters[idx]) {
          this._eqFilters[idx].gain.value = b.gain
        }
      }
    },

    async eqReset() {
      for (const b of this.eq.bands) b.gain = 0
      if (this._eqFilters?.length) {
        for (let i = 0; i < this._eqFilters.length; i++) {
          this._eqFilters[i].gain.value = 0
        }
      }
    },

    /* =========================================================
       PLAYER (SEU CÓDIGO ORIGINAL + HOOK DO EQ)
    ========================================================= */
    _createHowlForCurrent() {
      if (!this.current) return null

      const sound = new Howl({
        src: [this.current.downloadUrl],
        html5: true,
        volume: this.volume,
        preload: true,

        onplay: async () => {
          this.isPlaying = true
          // ✅ tenta conectar EQ assim que começar a tocar (melhor timing)
          try {
            await this.eqInitOrReconnect()
          } catch {}
        },
        onpause: () => {
          this.isPlaying = false
        },
        onstop: () => {
          this.isPlaying = false
        },
        onend: () => {
          this.next()
        },
        onloaderror: (id, err) => console.error("[player] onloaderror", err),
        onplayerror: (id, err) => {
          console.error("[player] onplayerror", err)
          try {
            sound.once("unlock", () => sound.play())
          } catch {}
        }
      })

      return sound
    },

    play(index = this.currentIndex) {
      if (index < 0 || index >= this.queue.length) return

      if (this.sound) {
        try {
          this.sound.stop()
          this.sound.unload()
        } catch {}
        this.sound = null
      }

      this.currentIndex = index
      this.sound = this._createHowlForCurrent()
      if (!this.sound) return

      try {
        this.sound.play()
        this.isPlaying = true
      } catch (e) {
        console.error("[player] erro ao dar play:", e)
      }
    },

    togglePlay() {
      if (!this.sound) {
        if (this.currentIndex === -1 && this.queue.length > 0) {
          this.play(0)
        }
        return
      }
      if (this.isPlaying) {
        this.sound.pause()
        this.isPlaying = false
      } else {
        this.sound.play()
        this.isPlaying = true
      }
    },

    next() {
      if (this.currentIndex < this.queue.length - 1) {
        this.play(this.currentIndex + 1)
      } else {
        if (this.current && this.fullList.length) {
          const indexInList = this.fullList.findIndex(m => m.id === this.current.id)
          const proxima = this.fullList[indexInList + 1] || this.fullList[0]
          if (proxima) this.addToQueue(proxima, { playNow: true })
        } else {
          console.log("[player] next: fim da fila e sem fullList")
          this.stop()
        }
      }
    },

    prev() {
      if (this.currentIndex > 0) {
        this.play(this.currentIndex - 1)
      } else {
        console.log("[player] prev: já é a primeira")
        if (this.sound) this.sound.seek(0)
      }
    },

    seekTo(seconds) {
      if (!this.sound) return
      this.sound.seek(seconds)
    },

    setVolume(v) {
      this.volume = v
      if (this.sound) this.sound.volume(v)
    },

    stop() {
      if (this.sound) {
        try {
          this.sound.stop()
          this.sound.unload()
        } catch {}
      }
      this.sound = null
      this.isPlaying = false
      this.currentIndex = -1
    },

    removeFromQueue(index) {
      const removingCurrent = index === this.currentIndex
      this.queue.splice(index, 1)

      if (!this.queue.length) {
        this.stop()
        return
      }

      if (removingCurrent) {
        const nextIndex = Math.min(index, this.queue.length - 1)
        this.play(nextIndex)
      } else if (index < this.currentIndex) {
        this.currentIndex -= 1
      }
    },

    clearQueue() {
      this.stop()
      this.queue = []
    }
  }
})
