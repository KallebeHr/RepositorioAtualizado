<template>
  <div class="music-page">
    <header class="header">
      <h1 class="title">🎶 Repertório Completos 🎶</h1>
      <p class="subtitle">
        Explore músicas, artistas e estilos • Adicione à fila • Toque agora • Baixe
      </p>
    </header>

    <!-- Busca -->
    <section class="search">
      <input
        v-model="filtros.busca"
        type="text"
        placeholder="🔍 Pesquisar músicas, cantores ou estilos..."
      />
    </section>
      <!-- Estilos -->
      <div class="filter">
        <label>Adicionar Estilo</label>
        <select v-model="estiloSelecionado" @change="addEstilo">
          <option value="">Selecionar</option>
          <option v-for="r in estilos" :key="r" :value="r">{{ r }}</option>
        </select>
        <div class="chip-grid">
          <div v-for="r in filtros.estilos" :key="r" class="chip active">
            {{ r }}
            <span class="chip-remove" @click="removeEstilo(r)">✕</span>
          </div>
        </div>
      </div>
    <!-- Filtros com selects -->
    <section class="filters">
      <!-- Cantores -->
      <div class="filter">
        <label>Adicionar Cantor</label>
        <select v-model="cantorSelecionado" @change="addCantor">
          <option value="">Selecionar</option>
          <option v-for="c in cantores" :key="c" :value="c">{{ c }}</option>
        </select>
        <div class="chip-grid">
          <div v-for="c in filtros.cantores" :key="c" class="chip active">
            {{ c }}
            <span class="chip-remove" @click="removeCantor(c)">✕</span>
          </div>
        </div>
      </div>


    </section>

    <!-- Status -->
    <div v-if="loading" class="status">Carregando músicas...</div>
    <div v-if="error" class="status error">{{ error }}</div>

    <!-- Lista de músicas -->
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
          <button class="ghost" @click="enqueue(m)" title="Adicionar à fila">➕</button>
          <button class="primary" @click="playNow(m)" title="Tocar agora">▶</button>
          <button class="ghost" @click="download(m)" title="Baixar">⬇</button>
        </div>
      </div>
    </section>

    <!-- Se não tiver músicas -->
    <div v-if="!loading && !filtradas.length" class="status">
      Nenhuma música encontrada.
    </div>

    <footerComplete />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
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
// filtros agora tem arrays
const filtros = ref({ cantores: [], estilos: [], busca: "" });
const cantorSelecionado = ref("");
const estiloSelecionado = ref("");

// Cantores e estilos únicos
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
    const cantorMatch =
      !filtros.value.cantores.length ||
      filtros.value.cantores.includes(m.cantor);

    const estiloMatch =
      !filtros.value.estilos.length ||
      (m.estilos || []).some((e) => filtros.value.estilos.includes(e));

    const buscaMatch =
      !busca ||
      m.title?.toLowerCase().includes(busca) ||
      m.cantor?.toLowerCase().includes(busca) ||
      m.estilos?.some((e) => e.toLowerCase().includes(busca));

    return cantorMatch && estiloMatch && buscaMatch;
  });
});
watch(filtradas, (nova) => {
  player.setFullList(nova)
}, { immediate: true })
// Seleção dinâmica
function addCantor() {
  if (cantorSelecionado.value && !filtros.value.cantores.includes(cantorSelecionado.value)) {
    filtros.value.cantores.push(cantorSelecionado.value);
  }
  cantorSelecionado.value = "";
}
function removeCantor(c) {
  filtros.value.cantores = filtros.value.cantores.filter((x) => x !== c);
}
function addEstilo() {
  if (estiloSelecionado.value && !filtros.value.estilos.includes(estiloSelecionado.value)) {
    filtros.value.estilos.push(estiloSelecionado.value);
  }
  estiloSelecionado.value = "";
}
function removeEstilo(r) {
  filtros.value.estilos = filtros.value.estilos.filter((x) => x !== r);
}

// Fetch músicas
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
/* base */
* { box-sizing: border-box; }
.music-page {
  width: 100%;
  padding: 24px 16px;
  background: #111;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
  height: auto;
  overflow-x: hidden;       /* evita scroll lateral */
  max-width: 100%;
}

/* Header */
.header { text-align: center; margin-bottom: 32px; }
.title {
  font-size: 40px;
  font-weight: 900;
  background: linear-gradient(90deg, #1db954, #00c3ff, #1db954);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle { color: #9aa0a6; font-size: 16px; }

/* Pesquisa */
.search { margin: 20px 0; }
.search input {
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid #2a2a2a;
  background: #181818;
  color: #fff;
  font-size: 15px;
}

/* Selects + chips */
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.filter {
  flex: 1 1 220px;      /* flex-basis para filas responsivas */
  min-width: 160px;
}
.filter label { display: block; margin-bottom: 6px; color: #9aa0a6; font-size: 14px; }
.filter select {
  width: 100%;
  background: #181818;
  color: #fff;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 10px 14px;
}

/* reduz selects em telas bem pequenas para não forçar overflow */
@media (max-width: 600px) {
  .filter { flex: 1 1 100%; min-width: 0; }
}

/* Chips */
.chip-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  padding: 8px 14px;
  border-radius: 20px;
  color: #eaeaea;
  border: 1px solid #2a2a2a;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chip.active { background: #1db954; color: #0b0b0b; }
.chip-remove { cursor: pointer; font-weight: bold; }

/* Status */
.status { margin: 20px 0; color: #e0e0e0; text-align: center; }
.status.error { color: #ff7676; }

/* Grid de cards */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  width: 100%;
}

/* Card geral */
.card {
  background: #181818;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #242424;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 300px;
  overflow: hidden;      /* impede que conteúdo estoure o card */
  max-width: 100%;
}

/* Imagem */
.cover {
  width: 100%;
  height: 180px;
  border-radius: 12px;
  object-fit: cover;
  margin-bottom: 12px;
  flex-shrink: 0;
}

/* Conteúdo do texto - importante: min-width:0 para flexbox */
.info {
  flex: 1 1 auto;
  min-width: 0;          /* crucial para evitar overflow por texto longo */
  overflow: hidden;
}

/* Título e meta com line-clamp 3 */
.track-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;

  display: -webkit-box;
  -webkit-line-clamp: 3;    /* máximo 3 linhas */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  max-height: calc(1.2em * 3);
}
.track-meta {
  font-size: 13px;
  color: #9aa0a6;

  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  max-height: calc(1.1em * 3);
}

/* Ações */
.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  gap: 8px;
  flex-shrink: 0;   /* não deixa as ações encolherem até sumirem */
}

/* Botões */
button.primary, button.ghost {
  flex: 1;
  height: 38px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  min-width: 40px;
}
button.primary { background: #1db954; color: #0b0b0b; }
button.ghost   { background: #202020; color: #eaeaea; }

/* --- Responsivo mobile: layout em linha, sem overflow --- */
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
    flex-shrink: 0;
    border-radius: 10px;
  }

  .info {
    flex: 1 1 auto;
    min-width: 0;       /* obrigatória para truncar */
    padding-right: 5px; /* espaço para as ações */
    overflow: hidden;
  }

  /* mantemos clamping, reduzimos font-size para caber */
  .track-title { -webkit-line-clamp: 3; font-size: 14px; max-height: calc(1.15em * 3); }
  .track-meta  { -webkit-line-clamp: 2; font-size: 12px; max-height: calc(1.1em * 2); }

  /* Forçamos as ações a não desaparecerem (sempre visíveis) */
  .actions {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex: 0 0 auto;
  }
  button.primary, button.ghost {
    flex: none;
    width: 40px;
    height: 36px;
    padding: 0;
    font-size: 14px;
  }
}

/* botão voltar ao topo (mantive) */
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
