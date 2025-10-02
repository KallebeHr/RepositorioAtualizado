<template>
  <div class="music-page">
    <header class="header">
      <h1 class="title">🎶 Repertório Completo 🎶</h1>
      <p class="subtitle">
        Explore músicas, artistas e estilos • Selecione estilo → cantor → veja as músicas
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
        <option v-for="r in estilosList" :key="r" :value="r">{{ r }}</option>
      </select>
      <div class="chip-grid">
        <div v-for="r in filtros.estilos" :key="r" class="chip active">
          {{ r }}
          <span class="chip-remove" @click="removeEstilo(r)">✕</span>
        </div>
      </div>
    </div>

    <!-- Cantores -->
    <section class="filters" v-if="filtros.estilos.length">
      <div class="filter">
        <label>Adicionar Cantor</label>
        <select v-model="cantorSelecionado" @change="addCantor">
          <option value="">Selecionar</option>
          <option v-for="c in cantoresDisponiveis" :key="c" :value="c">{{ c }}</option>
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

    <!-- Grid de músicas -->
    <section v-if="!loading && filtros.estilos.length && filtros.cantores.length && filtradas.length" class="grid">
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
            class="icon-btn favorite"
            :class="{ active: isFavorite(m.id) }"
            @click="toggleFavorite(m)"
            title="Favoritar"
          >
            <StarIcon class="icon" />
          </button>
        </div>
      </div>
    </section>

    <!-- Mostrar mais -->
    <div v-if="!loading && filtros.estilos.length && filtros.cantores.length && ultimaMusicaDoc" class="show-more" style="text-align:center; margin:20px 0;">
      <button @click="fetchMais()" class="bntNext">Mostrar mais 25</button>
    </div>

    <!-- Nenhuma música encontrada -->
    <div v-if="!loading && filtros.estilos.length && filtros.cantores.length && !filtradas.length" class="status">
      Nenhuma música encontrada.
    </div>

    <footerComplete />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit as fbLimit,
  startAfter,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "vue-toast-notification";
import { PlayIcon, ArrowDownTrayIcon, PlusCircleIcon, StarIcon } from "@heroicons/vue/24/solid";

const estilosList = ref([]);
const cantoresDisponiveis = ref([]);
const musicas = ref([]);
const loading = ref(false);
const error = ref("");
const limite = 25;
let ultimaMusicaDoc = null;

const filtros = ref({ cantores: [], estilos: [], busca: "" });
const cantorSelecionado = ref("");
const estiloSelecionado = ref("");

const player = usePlayerStore();
const userStore = useUserStore();
const toast = useToast();

// Computed: músicas filtradas
const filtradas = computed(() => {
  const busca = filtros.value.busca?.toLowerCase() || "";
  return musicas.value
    .filter(m => {
      const cantorMatch = !filtros.value.cantores.length || filtros.value.cantores.includes(m.cantor);
      const estiloMatch = !filtros.value.estilos.length || (m.estilos || []).some(e => filtros.value.estilos.includes(e));
      const buscaMatch =
        !busca ||
        (m.title || "").toLowerCase().includes(busca) ||
        (m.cantor || "").toLowerCase().includes(busca) ||
        (m.estilos || []).some(e => e.toLowerCase().includes(busca));
      return cantorMatch && estiloMatch && buscaMatch;
    })
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
});

// Atualiza player
watch(filtradas, (nova) => player.setFullList(nova), { immediate: true });

// ======= Funções =======
async function fetchEstilos() {
  try {
    const qs = await getDocs(collection(db, "estilos"));
    const arr = qs.docs.map(d => (d.data().nome || d.id).toString()).filter(Boolean);
    estilosList.value = Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.error(err);
    error.value = "Erro ao carregar estilos.";
  }
}

async function fetchCantoresPorEstilos() {
  cantoresDisponiveis.value = [];
  if (!filtros.value.estilos.length) return;
  try {
    const q = query(
      collection(db, "musicas"),
      where("tipo", "array-contains-any", filtros.value.estilos.slice(0, 10)),
      fbLimit(1000)
    );
    const qs = await getDocs(q);
    const set = new Set();
    qs.docs.forEach(d => { if (d.data().cantor) set.add(d.data().cantor); });
    cantoresDisponiveis.value = Array.from(set).sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.error(err);
    error.value = "Erro ao buscar cantores.";
  }
}

async function fetchMusicas(limitePagina = limite) {
  if (!filtros.value.estilos.length || !filtros.value.cantores.length) return;
  loading.value = true;
  try {
    let q;
    if (ultimaMusicaDoc) {
      q = query(
        collection(db, "musicas"),
        where("tipo", "array-contains-any", filtros.value.estilos.slice(0, 10)),
        orderBy("createdAt", "desc"),
        startAfter(ultimaMusicaDoc),
        fbLimit(limitePagina)
      );
    } else {
      q = query(
        collection(db, "musicas"),
        where("tipo", "array-contains-any", filtros.value.estilos.slice(0, 10)),
        orderBy("createdAt", "desc"),
        fbLimit(limitePagina)
      );
    }

    const qs = await getDocs(q);
    const novas = qs.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title || data.fileName || "Sem título",
        cantor: data.cantor || "—",
        estilos: Array.isArray(data.tipo) ? data.tipo : [],
        downloadUrl: data.downloadUrl || "",
        fileName: data.fileName || `${data.title || "musica"}.mp3`,
      };
    }).filter(m => filtros.value.cantores.includes(m.cantor));

    musicas.value.push(...novas);
    if (qs.docs.length) ultimaMusicaDoc = qs.docs[qs.docs.length - 1];
  } catch (err) {
    console.error(err);
    error.value = "Erro ao buscar músicas.";
  } finally { loading.value = false; }
}

function fetchMais() { if (ultimaMusicaDoc) fetchMusicas(); }

function addEstilo() {
  if (!estiloSelecionado.value) return;
  if (!filtros.value.estilos.includes(estiloSelecionado.value)) {
    filtros.value.estilos.push(estiloSelecionado.value);
    filtros.value.cantores = [];
    musicas.value = [];
    ultimaMusicaDoc = null;
    fetchCantoresPorEstilos();
  }
  estiloSelecionado.value = "";
}

function removeEstilo(r) {
  filtros.value.estilos = filtros.value.estilos.filter(x => x !== r);
  filtros.value.cantores = [];
  musicas.value = [];
  ultimaMusicaDoc = null;
  if (filtros.value.estilos.length) fetchCantoresPorEstilos();
  else cantoresDisponiveis.value = [];
}

function addCantor() {
  if (!cantorSelecionado.value) return;
  if (!filtros.value.cantores.includes(cantorSelecionado.value)) {
    filtros.value.cantores.push(cantorSelecionado.value);
    musicas.value = [];
    ultimaMusicaDoc = null;
    fetchMusicas();
  }
  cantorSelecionado.value = "";
}

function removeCantor(c) {
  filtros.value.cantores = filtros.value.cantores.filter(x => x !== c);
  musicas.value = [];
  ultimaMusicaDoc = null;
}

function normalizeTrack(m) {
  return { title: m.title, cantor: m.cantor, estilos: m.estilos, downloadUrl: m.downloadUrl, fileName: m.fileName, id: m.id };
}
function enqueue(m) { if (!userStore.hasActiveSubscription) toast.warning("Assinatura necessária"); else player.addToQueue(normalizeTrack(m), { playNow: false }); }
function playNow(m) { if (!userStore.hasActiveSubscription) toast.warning("Assinatura necessária"); else player.addToQueue(normalizeTrack(m), { playNow: true }); }
async function download(m) { if (!userStore.hasActiveSubscription) { toast.warning("Assinatura necessária"); return; } if (!m.downloadUrl) return; try { const res = await fetch(m.downloadUrl); if(!res.ok) throw new Error(); const blob = await res.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = m.fileName || "musica.mp3"; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url); } catch(e){toast.error("Erro ao baixar");} }

// Favoritos
function isFavorite(id) { return userStore.user?.favorites?.includes(id); }

async function toggleFavorite(m) {
  if (!userStore.user) { toast.warning("Login necessário"); return; }
  const userRef = doc(db, "users", userStore.user.uid);
  try {
    if (isFavorite(m.id)) {
      await updateDoc(userRef, { favorites: arrayRemove(m.id) });
      userStore.user.favorites = userStore.user.favorites.filter(x=>x!==m.id);
      toast.success(`Removida: ${m.title}`);
    } else {
      await updateDoc(userRef, { favorites: arrayUnion(m.id) });
      userStore.user.favorites.push(m.id);
      toast.success(`Adicionada: ${m.title}`);
    }
  } catch (err) { console.error(err); toast.error("Erro favoritos"); }
}

// Carregar favoritos do usuário ao montar
async function loadFavorites() {
  if (!userStore.user) return;
  try {
    const userDoc = await getDoc(doc(db, "users", userStore.user.uid));
    if (userDoc.exists()) {
      userStore.user.favorites = userDoc.data().favorites || [];
    } else {
      userStore.user.favorites = [];
    }
  } catch (err) {
    console.error("Erro ao carregar favoritos:", err);
  }
}

// Scroll infinito
function handleScroll() {
  if (loading.value || !ultimaMusicaDoc) return;
  const scrollPos = window.innerHeight + window.scrollY;
  const bottom = document.documentElement.offsetHeight - 200;
  if (scrollPos >= bottom) fetchMais();
}

// Lifecycle
onMounted(() => {
  fetchEstilos();
  loadFavorites();
  window.addEventListener("scroll", handleScroll);
});
onBeforeUnmount(() => window.removeEventListener("scroll", handleScroll));
</script>




<style scoped>
/* --- estilos mantidos exatamente como antes --- */
* { box-sizing: border-box; }
.music-page { width: 100%; padding: 24px 16px; background: #111; color: #fff; font-family: Inter, system-ui, sans-serif; height: auto; overflow-x: hidden; max-width: 100%; }
.header { text-align: center; margin-bottom: 32px; }
.title { font-size: 40px; font-weight: 900; background: linear-gradient(90deg, #1db954, #00c3ff, #1db954); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.subtitle { color: #9aa0a6; font-size: 16px; }
.search { margin: 20px 0; }
.search input { width: 100%; padding: 14px 18px; border-radius: 14px; border: 1px solid #2a2a2a; background: #181818; color: #fff; font-size: 15px; }
.filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.filter { flex: 1 1 220px; min-width: 160px; }
.filter label { display: block; margin-bottom: 6px; color: #9aa0a6; font-size: 14px; }
.filter select { width: 100%; background: #181818; color: #fff; border: 1px solid #2a2a2a; border-radius: 10px; padding: 10px 14px; }
.icon-btn { background: #202020; border: none; border-radius: 8px; cursor: pointer; height: 38px; width: 38px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.icon-btn:hover { background: #2a2a2a; }
.icon-btn.primary { background: #1db954; }
.bntNext { background: #1db954; margin: 10px; padding: 10px; border-radius: 10px; font-weight: 700; }
.icon-btn .icon { width: 20px; height: 20px; color: #eaeaea; }
.icon-btn.primary .icon { color: #0b0b0b; }
.icon-btn.favorite.active .icon { color: #ffd700; }
@media (max-width: 600px) { .filter { flex: 1 1 100%; min-width: 0; } }
.chip-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 8px 14px; border-radius: 20px; color: #eaeaea; border: 1px solid #2a2a2a; font-size: 13px; display: flex; align-items: center; gap: 6px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chip.active { background: #1db954; color: #0b0b0b; }
.chip-remove { cursor: pointer; font-weight: bold; }
.status { margin: 20px 0; color: #e0e0e0; text-align: center; }
.status.error { color: #ff7676; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; width: 100%; }
.card { background: #181818; border-radius: 16px; padding: 16px; border: 1px solid #242424; display: flex; flex-direction: column; justify-content: space-between; min-height: 300px; overflow: hidden; max-width: 100%; }
.cover { width: 100%; height: 180px; border-radius: 12px; object-fit: cover; margin-bottom: 12px; flex-shrink: 0; }
.info { flex: 1 1 auto; min-width: 0; overflow: hidden; }
.track-title { font-size: 16px; font-weight: 700; margin: 0 0 4px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; word-break: break-word; overflow-wrap: break-word; white-space: normal; max-height: calc(1.2em * 3); }
.track-meta { font-size: 13px; color: #9aa0a6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; word-break: break-word; overflow-wrap: break-word; white-space: normal; max-height: calc(1.1em * 3); }
.actions { display: flex; justify-content: space-between; margin-top: 12px; gap: 8px; flex-shrink: 0; }
button.primary, button.ghost { flex: 1; height: 38px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; white-space: nowrap; min-width: 40px; }
button.primary { background: #1db954; color: #0b0b0b; }
button.ghost { background: #202020; color: #eaeaea; }
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .card { flex-direction: row; align-items: center; gap: 12px; padding: 12px; min-height: auto; }
  .cover { width: 70px; height: 70px; margin: 0; flex-shrink: 0; border-radius: 10px; }
  .info { flex: 1 1 auto; min-width: 0; padding-right: 5px; overflow: hidden; }
  .track-title { -webkit-line-clamp: 3; font-size: 14px; max-height: calc(1.15em * 3); }
  .track-meta { -webkit-line-clamp: 2; font-size: 12px; max-height: calc(1.1em * 2); }
  .actions { flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
  .icon-btn { width: 40px; height: 36px; }
  button.primary, button.ghost { flex: none; width: 40px; height: 36px; padding: 0; font-size: 14px; }
}
.scroll-top { position: fixed; bottom: 120px; right: 20px; background: #1db954; color: #0b0b0b; border: none; border-radius: 50%; width: 48px; height: 48px; font-size: 20px; cursor: pointer; }
</style>
