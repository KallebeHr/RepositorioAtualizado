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
        console.warn("[player] addToQueue: track sem downloadUrl", track)
        return
      }
      console.log("[player] addToQueue:", track.title, { playNow })
      this.queue.push(track)

      if (this.currentIndex === -1) {
        console.log("[player] fila estava vazia -> tocar índice 0")
        this.play(0)
        return
      }

      if (playNow) {
        const idx = this.queue.length - 1
        console.log("[player] playNow -> índice", idx)
        this.play(idx)
      }
    },

    _createHowlForCurrent() {
      if (!this.current) return null

      console.log("[player] criando Howl para:", this.current.title, this.current.downloadUrl)
      const sound = new Howl({
        src: [this.current.downloadUrl],
        html5: true,
        volume: this.volume,
        preload: true,
        onload: () => console.log("[player] onload:", this.current?.title),
        onplay: () => { this.isPlaying = true; console.log("[player] onplay") },
        onpause: () => { this.isPlaying = false; console.log("[player] onpause") },
        onstop: () => { this.isPlaying = false; console.log("[player] onstop") },
        onend: () => { console.log("[player] onend -> next"); this.next() },
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
        console.warn("[player] play: index fora do range", index)
        return
      }
      console.log("[player] play -> index", index, "track:", this.queue[index]?.title)

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
        console.warn("[player] togglePlay sem sound. Tentando criar.")
        if (this.currentIndex === -1 && this.queue.length > 0) {
          this.play(0)
        }
        return
      }
      if (this.isPlaying) {
        console.log("[player] pause()")
        this.sound.pause()
        this.isPlaying = false
      } else {
        console.log("[player] resume/play()")
        this.sound.play()
        this.isPlaying = true
      }
    },

    next() {
      if (this.currentIndex < this.queue.length - 1) {
        console.log("[player] next")
        this.play(this.currentIndex + 1)
      } else {
        console.log("[player] next: fim da fila")
        this.stop()
      }
    },

    prev() {
      if (this.currentIndex > 0) {
        console.log("[player] prev")
        this.play(this.currentIndex - 1)
      } else {
        console.log("[player] prev: já é a primeira")
        if (this.sound) this.sound.seek(0)
      }
    },

    seekTo(seconds) {
      if (!this.sound) return
      console.log("[player] seekTo:", seconds)
      this.sound.seek(seconds)
    },

    setVolume(v) {
      this.volume = v
      if (this.sound) this.sound.volume(v)
      console.log("[player] volume:", v)
    },

    stop() {
      console.log("[player] stop()")
      if (this.sound) {
        try { this.sound.stop(); this.sound.unload() } catch {}
      }
      this.sound = null
      this.isPlaying = false
      this.currentIndex = -1
    },

    removeFromQueue(index) {
      console.log("[player] removeFromQueue:", index)
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
      console.log("[player] clearQueue()")
      this.stop()
      this.queue = []
    },
  },
})
