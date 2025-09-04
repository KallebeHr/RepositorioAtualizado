import { defineStore } from "pinia"
import { ref } from "vue"

export const usePlayerStore = defineStore("player", () => {
  const currentTrack = ref(null)
  const queue = ref([])
  const audio = ref(new Audio())
  const isPlaying = ref(false)

  function setTrack(track) {
    if (currentTrack.value?.url === track.url) {
      togglePlay()
      return
    }
    currentTrack.value = track
    audio.value.src = track.url
    play()
  }

  function play() {
    audio.value.play().then(() => {
      isPlaying.value = true
    }).catch(err => {
      console.warn("Erro ao reproduzir:", err)
    })
  }

  function pause() {
    audio.value.pause()
    isPlaying.value = false
  }

  function togglePlay() {
    isPlaying.value ? pause() : play()
  }

  function next() {
    if (queue.value.length > 0) {
      const nextTrack = queue.value.shift()
      setTrack(nextTrack)
    } else {
      isPlaying.value = false
    }
  }

  function addToQueue(track) {
    queue.value.push(track)
  }

  // avança automático no fim
  audio.value.addEventListener("ended", next)

  return {
    currentTrack,
    queue,
    isPlaying,
    setTrack,
    play,
    pause,
    togglePlay,
    addToQueue,
    next
  }
})
