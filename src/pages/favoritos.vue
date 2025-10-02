<template>
  <div class="music-page">
    <header class="header">
      <h1 class="title">⭐ Favoritos</h1>
      <p class="subtitle">Suas músicas favoritas reunidas em um só lugar</p>
    </header>

    <!-- Busca + botão baixar todas -->
    <section class="search search-row">
      <input
        v-model="filtros.busca"
        type="text"
        placeholder="🔍 Pesquisar nos favoritos..."
      />
      <button class="download-all" @click="baixarTodas" :disabled="!filtradas.length">
        <ArrowDownTrayIcon class="icon" />
        Baixar todas
      </button>
    </section>

    <!-- Status -->
    <div v-if="loading" class="status">Carregando favoritos...</div>
    <div v-if="error" class="status error">{{ error }}</div>

    <!-- Lista -->
    <section v-if="!loading && filtradas.length" class="grid">
      <div v-for="m in filtradas" :key="m.id" class="card">
        <img src="/LogoMusic.jpg" class="cover" />
        <div class="info">
          <h2 class="track-title">{{ m.title }}</h2>
          <p class="track-meta">
            <span>{{ m.cantor }}</span> •
            <span>{{ m.estilos?.join(', ') || '—' }}</span>
          </p>
        </div>
        <div class="actions">
          <button class="icon-btn" @click="enqueue(m)" title="Adicionar à fila">
            <PlusCircleIcon class="icon" />
          </button>
          <button class="icon-btn primary" @click="playNow(m)" title="Tocar agora">
            <PlayIcon class="icon" />
          </button>
          <button class="icon-btn" @click="download(m)" title="Baixar">
            <ArrowDownTrayIcon class="icon" />
          </button>
          <button
            class="icon-btn favorite active"
            @click="removeFavorite(m)"
            title="Remover dos favoritos"
          >
            <StarIcon class="icon" />
          </button>
        </div>
      </div>
    </section>

    <div v-if="!loading && !filtradas.length" class="status">
      Nenhuma música favorita encontrada.
    </div>

    <!-- Player visível -->
    <div v-if="player.currentTrack" class="player">
      <audio
        ref="audio"
        :src="player.currentTrack.downloadUrl"
        autoplay
        @ended="player.onTrackEnded"
        controls
      ></audio>
      <p class="now-playing">Tocando: {{ player.currentTrack.title }} - {{ player.currentTrack.cantor }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { db } from "@/firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "vue-toast-notification";
import {
  PlayIcon,
  ArrowDownTrayIcon,
  PlusCircleIcon,
  StarIcon,
} from "@heroicons/vue/24/solid";

const loading = ref(true);
const error = ref("");
const favorites = ref([]);
const filtros = ref({ busca: "" });

const player = usePlayerStore();
const userStore = useUserStore();
const toast = useToast();

const filtradas = computed(() => {
  const busca = filtros.value.busca.toLowerCase();
  return favorites.value.filter((m) => {
    return (
      !busca ||
      m.title?.toLowerCase().includes(busca) ||
      m.cantor?.toLowerCase().includes(busca) ||
      m.estilos?.some((e) => e.toLowerCase().includes(busca))
    );
  });
});

async function loadFavorites() {
  if (!userStore.user) return;
  loading.value = true;
  error.value = "";
  favorites.value = [];

  try {
    const userRef = doc(db, "users", userStore.user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      error.value = "Usuário não encontrado.";
      return;
    }

    const favs = snap.data().favorites || [];
    if (!favs.length) return;

    const results = await Promise.all(
      favs.map(async (f) => {
        if (typeof f === "string") {
          try {
            const mSnap = await getDoc(doc(db, "musicas", f));
            if (!mSnap.exists()) return null;
            const d = mSnap.data();
            return {
              id: mSnap.id,
              title: d.title || d.fileName || "Sem título",
              cantor: d.cantor || "—",
              estilos: Array.isArray(d.tipo) ? d.tipo : [],
              downloadUrl: d.downloadUrl || "",
              fileName: d.fileName || `${d.title || "musica"}.mp3`,
            };
          } catch {
            return null;
          }
        } else if (typeof f === "object") {
          return {
            id: f.id || f.fileId || Math.random(),
            title: f.title || f.name || "Sem título",
            cantor: f.cantor || f.artist || "—",
            estilos: Array.isArray(f.estilos) ? f.estilos : [],
            downloadUrl: f.downloadUrl || "",
            fileName: f.fileName || `${f.title || "musica"}.mp3`,
          };
        }
      })
    );

    favorites.value = results.filter(Boolean);
  } catch (err) {
    console.error("Erro ao carregar favoritos:", err);
    error.value = "Erro ao carregar favoritos.";
  } finally {
    loading.value = false;
  }
}

async function removeFavorite(music) {
  if (!userStore.user) return;
  try {
    const userRef = doc(db, "users", userStore.user.uid);
    await updateDoc(userRef, {
      favorites: arrayRemove(music),
    });
    favorites.value = favorites.value.filter((f) => f.id !== music.id);
    toast.success("Removido dos favoritos");
  } catch (err) {
    console.error("Erro ao remover favorito:", err);
    toast.error("Erro ao remover favorito");
  }
}

function normalizeTrack(m) {
  return {
    id: m.id,
    title: m.title,
    cantor: m.cantor,
    estilos: m.estilos,
    downloadUrl: m.downloadUrl,
    fileName: m.fileName,
  };
}

function enqueue(m) {
  player.addToQueue(normalizeTrack(m), { playNow: false });
  toast.success(`${m.title} adicionado à fila 🎶`);
}

function playNow(m) {
  player.addToQueue(normalizeTrack(m), { playNow: true });
}

async function download(m) {
  if (!m.downloadUrl) return;
  const res = await fetch(m.downloadUrl);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = m.fileName || "musica.mp3";
  a.click();
  window.URL.revokeObjectURL(url);
}

async function baixarTodas() {
  if (!filtradas.value.length) return;
  for (const m of filtradas.value) {
    await download(m);
  }
}

onMounted(loadFavorites);
watch(
  () => userStore.user,
  (novoUser) => {
    if (novoUser) loadFavorites();
  },
  { immediate: true }
);
</script>




<style scoped>
/* aproveitando o mesmo estilo da sua página de repertório */
.music-page {
  width: 100%;
  padding: 24px 16px;
  background: #111;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}
.header { text-align: center; margin-bottom: 24px; }
.title {
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(90deg, #1db954, #00c3ff, #1db954);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle { color: #9aa0a6; font-size: 16px; }

/* Busca + botão */
.search-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.search-row input {
  flex: 1;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid #2a2a2a;
  background: #181818;
  color: #fff;
}
.download-all {
  background: #1db954;
  color: #0b0b0b;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.download-all .icon {
  width: 20px;
  height: 20px;
}

/* Grid e cards */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 20px;
}
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
.info { flex: 1; min-width: 0; overflow: hidden; }
.track-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.track-meta {
  font-size: 13px;
  color: #9aa0a6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  gap: 8px;
}
.icon-btn {
  background: #202020;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  height: 38px;
  width: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-btn.primary { background: #1db954; }
.icon-btn .icon { width: 20px; height: 20px; color: #eaeaea; }
.icon-btn.primary .icon { color: #0b0b0b; }
.icon-btn.favorite.active .icon { color: #ffd700; }

/* mobile */
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .card {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 12px;
    min-height: auto;
  }
  .cover {
    width: 70px;
    height: 70px;
    margin: 0;
  }
  .info {
    flex: 1;
    min-width: 0;
    padding-right: 5px;
  }
  .actions {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
