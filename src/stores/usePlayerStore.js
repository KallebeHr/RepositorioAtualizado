import { defineStore } from "pinia"
import { Howl } from "howler"

export const usePlayerStore = defineStore("player", {
  state: () => ({
    queue: [],          
    currentIndex: -1,
    sound: null,        
    isPlaying: false,
    volume: 1.0,
  }),

  getters: {
    current(state) {
      return state.queue[state.currentIndex] || null
    }
  },

  actions: {
    addToQueue(track, { playNow = false } = {}) {
      if (!track?.downloadUrl) {
        return
      }
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

    _createHowlForCurrent() {
      if (!this.current) return null

      const sound = new Howl({
        src: [this.current.downloadUrl],
        html5: true,
        volume: this.volume,
        preload: true,

        onplay: () => { this.isPlaying = true; },
        onpause: () => { this.isPlaying = false; },
        onstop: () => { this.isPlaying = false; },
        onend: () => { this.next() },
        onloaderror: (id, err) => console.error("[player] onloaderror", err),
        onplayerror: (id, err) => {
          console.error("[player] onplayerror", err)
          try { sound.once("unlock", () => sound.play()) } catch {}
        }
      })
      return sound
    },

    play(index = this.currentIndex) {
      if (index < 0 || index >= this.queue.length) {
        return
      }

      if (this.sound) {
        try { this.sound.stop(); this.sound.unload() } catch {}
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
        console.log("[player] next: fim da fila")
        this.stop()
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
        try { this.sound.stop(); this.sound.unload() } catch {}
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
    },
  },
})
