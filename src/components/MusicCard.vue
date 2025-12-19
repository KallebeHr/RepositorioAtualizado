<template>
  <div class="card">
    <img src="/LogoMusic.jpg" class="cover" />

    <div class="info">
      <h2 class="track-title">{{ music.title }}</h2>
      <p class="track-meta">
        <span>{{ music.cantor }}</span>
        <span v-if="music.estilos?.length">
          • {{ music.estilos.join(", ") }}
        </span>
      </p>
    </div>

    <div class="actions">
      <button
        class="icon-btn"
        title="Adicionar à fila"
        @click="enqueue"
      >
        <PlusCircleIcon class="icon" />
      </button>

      <button
        class="icon-btn primary"
        title="Tocar agora"
        @click="playNow"
      >
        <PlayIcon class="icon" />
      </button>

      <button
        class="icon-btn"
        title="Baixar"
        @click="download"
      >
        <ArrowDownTrayIcon class="icon" />
      </button>

      <button
        class="icon-btn favorite"
        :class="{ active: isFavorite }"
        title="Favoritar"
        @click="toggleFavorite"
      >
        <StarIcon class="icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "vue-toast-notification";
import { db } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

import {
  PlayIcon,
  ArrowDownTrayIcon,
  PlusCircleIcon,
  StarIcon
} from "@heroicons/vue/24/solid";

const props = defineProps({
  music: {
    type: Object,
    required: true
  }
});

const player = usePlayerStore();
const userStore = useUserStore();
const toast = useToast();

const isFavorite = computed(() =>
  userStore.user?.favorites?.includes(props.music.id)
);

function normalize() {
  return {
    id: props.music.id,
    title: props.music.title,
    cantor: props.music.cantor,
    estilos: props.music.estilos || [],
    downloadUrl: props.music.downloadUrl,
    fileName: props.music.fileName || "musica.mp3"
  };
}

function enqueue() {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Assinatura necessária");
    return;
  }
  player.addToQueue(normalize(), { playNow: false });
}

function playNow() {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Assinatura necessária");
    return;
  }
  player.addToQueue(normalize(), { playNow: true });
}

async function download() {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Assinatura necessária");
    return;
  }
  if (!props.music.downloadUrl) return;

  try {
    const res = await fetch(props.music.downloadUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = props.music.fileName || "musica.mp3";
    a.click();

    URL.revokeObjectURL(url);
  } catch {
    toast.error("Erro ao baixar");
  }
}

async function toggleFavorite() {
  if (!userStore.user) {
    toast.warning("Faça login");
    return;
  }

  const ref = doc(db, "users", userStore.user.uid);

  try {
    if (isFavorite.value) {
      await updateDoc(ref, {
        favorites: arrayRemove(props.music.id)
      });
      userStore.user.favorites =
        userStore.user.favorites.filter(f => f !== props.music.id);
    } else {
      await updateDoc(ref, {
        favorites: arrayUnion(props.music.id)
      });
      userStore.user.favorites.push(props.music.id);
    }
  } catch {
    toast.error("Erro ao atualizar favoritos");
  }
}
</script>

<style scoped>
/* NADA NOVO AQUI — CARD 100% IGUAL AO SEU */
.card {
  background: #181818;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #242424;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 300px;
}

.cover {
  width: 100%;
  height: 180px;
  border-radius: 12px;
  object-fit: cover;
  margin-bottom: 12px;
}

.info {
  flex: 1;
}

.track-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.track-meta {
  font-size: 13px;
  color: #9aa0a6;
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.icon-btn {
  background: #202020;
  border: none;
  border-radius: 8px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-btn.primary {
  background: #1db954;
}

.icon-btn.favorite.active svg {
  color: #ffd700;
}
</style>
