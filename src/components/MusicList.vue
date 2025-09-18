<template>
  <div class="music-page">
    <header class="header">
      <h1 class="title">🎶 Repertório Completo 🎶</h1>
      <p class="subtitle">
        Explore músicas, artistas e estilos • Adicione à fila • Toque agora • Baixe
      </p>
    </header>

    <!-- Cantores -->
    <section class="chips">
      <h3>Cantores</h3>
      <div class="chip-grid">
        <button
          v-for="c in cantores"
          :key="c"
          class="chip"
          :class="{ active: filtros.cantor === c }"
          @click="filtros.cantor = filtros.cantor === c ? '' : c"
        >
          {{ c }}
        </button>
      </div>
    </section>

    <!-- Estilos -->
    <section class="chips">
      <h3>Estilos</h3>
      <div class="chip-grid">
        <button
          v-for="r in estilos"
          :key="r"
          class="chip"
          :class="{ active: filtros.estilos === r }"
          @click="filtros.estilos = filtros.estilos === r ? '' : r"
        >
          {{ r }}
        </button>
      </div>
    </section>

    <!-- Busca -->
    <section class="search">
      <input
        v-model="filtros.busca"
        type="text"
        placeholder="🔍 Pesquisar músicas, cantores ou estilos..."
      />
    </section>

    <!-- Selects extras -->
    <section class="filters">
      <div class="filter">
        <label>Cantores</label>
        <select v-model="filtros.cantor">
          <option value="">Todos</option>
          <option v-for="c in cantores" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="filter">
        <label>Estilos</label>
        <select v-model="filtros.estilos">
          <option value="">Todos</option>
          <option v-for="r in estilos" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
    </section>

    <!-- Status -->
    <div v-if="loading" class="status">Carregando músicas...</div>
    <div v-if="error" class="status error">{{ error }}</div>

    <!-- Expansion por cantor -->
    <v-expansion-panels v-if="!loading && cantores.length">
  <template v-for="(c, i) in cantores" :key="c + '-' + i">
    <v-expansion-panel>
      <v-expansion-panel-title>
        {{ c }}
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <div class="grid">
          <div v-for="m in musicasPorCantor(c)" :key="m.id" class="card">
            <img src="/LogoMusic.jpg" class="cover" />
            <div class="info">
              <h2 class="track-title">{{ m.title }}</h2>
              <p class="track-meta">
                <span>{{ m.cantor }}</span> •
                <span>{{ m.estilos?.join(', ') || '—' }}</span>
              </p>
            </div>
            <div class="actions">
              <button class="ghost" @click="enqueue(m)" title="Adicionar à fila">➕</button>
              <button class="primary" @click="playNow(m)" title="Tocar agora">▶</button>
              <button class="ghost" @click="download(m)" title="Baixar">⬇</button>
            </div>
          </div>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </template>
</v-expansion-panels>


    <!-- Se não tiver músicas -->
    <div v-if="!loading && !filtradas.length" class="status">
      Nenhuma música encontrada.
    </div>

    <footerComplete />
  </div>
</template>




<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { db } from "@/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "vue-toast-notification";

const musicas = ref([]);
const loading = ref(true);
const error = ref("");
const player = usePlayerStore();
const userStore = useUserStore();
const toast = useToast();
const showScrollTop = ref(false);

const filtros = ref({ cantor: "", estilos: "", busca: "" });

// Cantores e estilos
const cantores = computed(() =>
  [...new Set(musicas.value.map((m) => m.cantor).filter(Boolean))]
);
const estilos = computed(() =>
  [...new Set(musicas.value.flatMap((m) => m.estilos || []).filter(Boolean))]
);

// Filtradas
const filtradas = computed(() => {
  const busca = filtros.value.busca.toLowerCase();
  return musicas.value.filter((m) => {
    const cantorMatch = !filtros.value.cantor || m.cantor === filtros.value.cantor;
    const estiloMatch =
      !filtros.value.estilos || (m.estilos || []).includes(filtros.value.estilos);
    const buscaMatch =
      !busca ||
      m.title?.toLowerCase().includes(busca) ||
      m.cantor?.toLowerCase().includes(busca) ||
      m.estilos?.some((e) => e.toLowerCase().includes(busca));
    return cantorMatch && estiloMatch && buscaMatch;
  });
});

// Agrupa músicas por cantor
function musicasPorCantor(c) {
  return filtradas.value.filter((m) => m.cantor === c);
}

// Fetch
async function fetchMusicas() {
  loading.value = true;
  try {
    const q = query(collection(db, "musicas"), orderBy("createdAt", "desc"));
    const qs = await getDocs(q);
    musicas.value = qs.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title || data.fileName || "Sem título",
        cantor: data.cantor || "—",
        estilos: Array.isArray(data.tipo) ? data.tipo : [],
        downloadUrl: data.downloadUrl || "",
        fileName: data.fileName || `${data.title || "musica"}.mp3`,
      };
    });
  } catch (err) {
    console.error("[MusicList] erro ao buscar:", err);
    error.value = "Erro ao buscar músicas.";
  } finally {
    loading.value = false;
  }
}

// Player
function normalizeTrack(m) {
  return {
    title: m.title,
    cantor: m.cantor,
    estilos: m.estilos,
    downloadUrl: m.downloadUrl,
    fileName: m.fileName,
    id: m.id,
  };
}
function enqueue(m) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Você precisa ativar a assinatura para escutar músicas 🎶");
    return;
  }
  player.addToQueue(normalizeTrack(m), { playNow: false });
}
function playNow(m) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Você precisa ativar a assinatura para escutar músicas 🎶");
    return;
  }
  player.addToQueue(normalizeTrack(m), { playNow: true });
}
async function download(m) {
  if (!userStore.hasActiveSubscription) {
    toast.warning("Você precisa ativar a assinatura para baixar músicas 🎶");
    return;
  }
  if (!m.downloadUrl) return;
  try {
    const res = await fetch(m.downloadUrl);
    if (!res.ok) throw new Error("Falha ao baixar arquivo");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = m.fileName || "musica.mp3";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[MusicList] erro no download:", err);
    toast.error("Erro ao baixar a música!");
  }
}

// Scroll
function handleScroll() {
  showScrollTop.value = window.scrollY > 200;
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
onMounted(() => {
  fetchMusicas();
  window.addEventListener("scroll", handleScroll);
});
onBeforeUnmount(() => window.removeEventListener("scroll", handleScroll));
</script>

<style scoped>
.music-page {
  width: 100%;
  padding: 24px 32px;
  background: #111;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 32px;
}
.title {
  font-size: 40px;
  font-weight: 900;
  background: linear-gradient(90deg, #1db954, #00c3ff, #1db954);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle {
  color: #9aa0a6;
  font-size: 16px;
}

/* Chips */
.chips {
  margin-bottom: 24px;
}
.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chip {
  padding: 10px 18px;
  border-radius: 20px;
  background: #202020;
  color: #eaeaea;
  border: 1px solid #2a2a2a;
  cursor: pointer;
  font-size: 14px;
}
.chip.active {
  background: #1db954;
  color: #0b0b0b;
}

/* Pesquisa */
.search {
  margin: 20px 0;
}
.search input {
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid #2a2a2a;
  background: #181818;
  color: #fff;
  font-size: 15px;
}

/* Selects */
.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}
.filter {
  flex: 1;
  min-width: 180px;
}
.filter label {
  display: block;
  margin-bottom: 6px;
  color: #9aa0a6;
  font-size: 14px;
}
.filter select {
  width: 100%;
  background: #181818;
  color: #fff;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 10px 14px;
}

.status {
  margin: 20px 0;
  color: #e0e0e0;
  text-align: center;
}
.status.error {
  color: #ff7676;
}

/* Grid de cards */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
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
.track-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
}
.track-meta {
  font-size: 13px;
  color: #9aa0a6;
}
.actions {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  gap: 8px;
}
button.primary,
button.ghost {
  flex: 1;
  height: 38px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
button.primary {
  background: #1db954;
  color: #0b0b0b;
}
button.ghost {
  background: #202020;
  color: #eaeaea;
}

/* Mobile - cards em lista */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .card {
    flex-direction: row;
    align-items: center;
    min-height: auto;
    gap: 12px;
  }
  .cover {
    width: 70px;
    height: 70px;
    margin: 0;
  }
  .info {
    flex: 1;
  }
  .actions {
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    margin-top: 0;
  }
  button.primary,
  button.ghost {
    flex: none;
    width: 40px;
    height: 36px;
    padding: 0;
  }
}

/* Botão voltar ao topo */
.scroll-top {
  position: fixed;
  bottom: 120px;
  right: 20px;
  background: #1db954;
  color: #0b0b0b;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 20px;
  cursor: pointer;
}
</style>
