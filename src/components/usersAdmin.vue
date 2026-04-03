<template>
  <div class="admin-container">
    <!-- ── HEADER ── -->
    <header class="header">
      <div class="header-glow" />
      <h1 class="title">
        <span class="title-icon">⬡</span>
        Administração de Usuários
      </h1>
      <p class="subtitle">Gerencie contas, assinaturas e comunique-se com sua base.</p>

      <div class="top-buttons">
        <button class="btn btn-excel" @click="exportUsersToExcel">
          <span class="btn-icon">📊</span>
          <span>Gerar Excel</span>
        </button>
        <button class="btn btn-update" :class="{ loading: updatingUsers }" @click="updateExpiredUsers" :disabled="updatingUsers">
          <span class="btn-icon">{{ updatingUsers ? '⟳' : '🔄' }}</span>
          <span>{{ updatingUsers ? 'Atualizando...' : 'Atualizar Usuários' }}</span>
        </button>
        <button class="btn btn-mass" @click="openMassMessageModal">
          <span class="btn-icon">📢</span>
          <span>Mensagem em Massa</span>
        </button>
      </div>
    </header>

    <!-- ── STATS ── -->
    <section class="stats-panel">
      <div
        class="stat-card"
        :class="{ 'stat-active': selectedFilter === 'todos' }"
        @click="setFilter('todos')"
      >
        <div class="stat-inner">
          <span class="stat-label">Total</span>
          <span class="stat-value total-val">{{ allUsers.length }}</span>
        </div>
        <div class="stat-bar" style="--bar-color: #00c3ff" />
      </div>

      <div
        class="stat-card"
        :class="{ 'stat-active': selectedFilter === 'ativos' }"
        @click="setFilter('ativos')"
      >
        <div class="stat-inner">
          <span class="stat-label">Ativos</span>
          <span class="stat-value active-val">{{ activeUsers }}</span>
        </div>
        <div class="stat-bar" style="--bar-color: #1db954" />
      </div>

      <div
        class="stat-card"
        :class="{ 'stat-active': selectedFilter === 'normais' }"
        @click="setFilter('normais')"
      >
        <div class="stat-inner">
          <span class="stat-label">Normais</span>
          <span class="stat-value normal-val">{{ normalUsers }}</span>
        </div>
        <div class="stat-bar" style="--bar-color: #ffb84d" />
      </div>
    </section>

    <!-- ── SEARCH ── -->
    <div class="search-wrapper">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nome, email, ID ou data (YYYY-MM-DD)…"
        />
        <button v-if="search" class="search-clear" @click="search = ''">✕</button>
      </div>
      <p class="results-hint">
        Exibindo <strong>{{ filteredUsers.length }}</strong>
        <template v-if="selectedFilter === 'todos' && !search"> de {{ allUsers.length }} (100 mais recentes)</template>
        <template v-else> usuário(s)</template>
      </p>
    </div>

    <!-- ── LOADING ── -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <p>Carregando usuários…</p>
    </div>

    <!-- ── USER LIST ── -->
    <div v-else class="user-list">
      <TransitionGroup name="card">
        <div v-for="user in filteredUsers" :key="user.uid" class="user-card">
          <div class="card-accent" :class="user.subscription === 'ativa' ? 'accent-active' : 'accent-normal'" />

          <div class="user-info">
            <p class="name">{{ user.firstName }} {{ user.lastName }}</p>
            <div class="info-grid">
              <span class="info-item"><em>Email</em>{{ user.email }}</span>
              <span class="info-item"><em>Senha</em>{{ user.password }}</span>
              <span class="info-item"><em>Número</em>{{ user.numero || '—' }}</span>
              <span class="info-item"><em>ID</em>{{ user.customID || user.uid }}</span>
              <span class="info-item"><em>Inscrito</em>{{ formatDate(user.createdAt) }}</span>
            </div>
            <div v-if="user.subscription === 'ativa'" class="subscription-badge">
              <span class="badge-dot" />
              Ativa · {{ formatDate(user.subscriptionStart) }} → {{ formatDate(user.subscriptionEnd) }}
            </div>
            <div v-else class="subscription-badge badge-normal">
              <span class="badge-dot badge-dot-off" />
              Normal
            </div>
          </div>

          <div class="user-actions">
            <button
              class="btn-toggle"
              :class="user.subscription === 'ativa' ? 'toggle-active' : 'toggle-normal'"
              @click="toggleSubscription(user)"
            >
              <span class="toggle-dot" />
              {{ user.subscription === 'ativa' ? '✦ Ativa' : '○ Normal' }}
            </button>
            <button class="btn-msg" @click="openMessageModal(user)">
              ✉ Mensagem
            </button>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="filteredUsers.length === 0 && !loading" class="no-results">
        <span>🔎</span>
        <p>Nenhum usuário encontrado.</p>
      </div>
    </div>

    <!-- ── MODAL INDIVIDUAL ── -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeMessageModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>✉ Mensagem para <strong>{{ selectedUser?.firstName }}</strong></h3>
            <button class="modal-close" @click="closeMessageModal">✕</button>
          </div>
          <textarea v-model="messageText" placeholder="Digite sua mensagem aqui…" />
          <div class="modal-buttons">
            <button class="btn-cancel" @click="closeMessageModal">Cancelar</button>
            <button class="btn-send" @click="sendMessage">Enviar</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── MODAL MASSA ── -->
    <Transition name="modal">
      <div v-if="showMassModal" class="modal-overlay" @click.self="closeMassMessageModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>📢 Mensagem em Massa</h3>
            <button class="modal-close" @click="closeMassMessageModal">✕</button>
          </div>
          <p class="modal-hint">
            Será enviado para <strong>{{ filteredUsers.length }}</strong> usuários filtrados.
          </p>
          <textarea v-model="massMessageText" placeholder="Digite a mensagem para todos…" />
          <div class="modal-buttons">
            <button class="btn-cancel" @click="closeMassMessageModal">Cancelar</button>
            <button class="btn-send" @click="sendMassMessage">Enviar para Todos</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useUserStore } from "@/stores/userStore";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";
import * as XLSX from "xlsx";

const router    = useRouter();
const userStore = useUserStore();
const toast     = useToast();

// ── STATE ──────────────────────────────────────────────────────────────────
const allUsers       = ref([]);   // todos os usuários carregados
const loading        = ref(false);
const updatingUsers  = ref(false);
const search         = ref("");
const selectedFilter = ref("todos");

const showModal      = ref(false);
const selectedUser   = ref(null);
const messageText    = ref("");

const showMassModal  = ref(false);
const massMessageText = ref("");

// ── GUARD ADMIN ────────────────────────────────────────────────────────────
watch(
  () => userStore.user,
  async (val) => {
    if (val) {
      if (val.role !== "admin") router.replace("/");
      else await fetchUsers();
    }
  },
  { immediate: true }
);

// ── FETCH (sem expiração automática — use o botão "Atualizar Usuários") ────
async function fetchUsers() {
  loading.value = true;
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const fetched = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        uid: d.id,
        subscription: data.subscription || "normal",
        subscriptionStart: toDate(data.subscriptionStart),
        subscriptionEnd:   toDate(data.subscriptionEnd),
      };
    });

    // Ordena do mais recente ao mais antigo
    fetched.sort((a, b) => {
      const tA = a.createdAt?.seconds ?? 0;
      const tB = b.createdAt?.seconds ?? 0;
      return tB - tA;
    });

    allUsers.value = fetched;
  } catch (err) {
    console.error(err);
    toast.error("Erro ao carregar usuários!");
  } finally {
    loading.value = false;
  }
}

// ── STATS (sempre sobre TODOS os usuários) ─────────────────────────────────
const activeUsers = computed(() =>
  allUsers.value.filter((u) => u.subscription === "ativa").length
);
const normalUsers = computed(() =>
  allUsers.value.filter((u) => u.subscription === "normal").length
);

// ── FILTER + SEARCH ────────────────────────────────────────────────────────
const filteredUsers = computed(() => {
  const s = search.value.trim().toLowerCase();

  // Quando há busca ativa ou filtro "ativos"/"normais" → usa TODOS os usuários
  const useAll = s.length > 0 || selectedFilter.value !== "todos";
  let list = useAll ? [...allUsers.value] : allUsers.value.slice(0, 100);

  // Filtro de status
  if (selectedFilter.value === "ativos") {
    list = list.filter((u) => u.subscription === "ativa");
  } else if (selectedFilter.value === "normais") {
    list = list.filter((u) => u.subscription === "normal");
  }

  // Busca
  if (s) {
    list = list.filter((u) => {
      const name   = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email  = (u.email || "").toLowerCase();
      const cid    = (u.customID || "").toLowerCase();
      const uid    = (u.uid || "").toLowerCase();
      const date   = u.createdAt ? formatDate(u.createdAt) : "";
      return name.includes(s) || email.includes(s) || cid.includes(s) || uid.includes(s) || date.includes(s);
    });
  }

  return list;
});

function setFilter(type) {
  selectedFilter.value = type;
}

// ── DATAS ──────────────────────────────────────────────────────────────────
// Converte qualquer formato para JS Date
function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val.toDate === "function") return val.toDate();
  if (typeof val.seconds === "number") return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(ts) {
  const d = toDate(ts);
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

// ── ATUALIZAR USUÁRIOS EXPIRADOS ───────────────────────────────────────────
async function updateExpiredUsers() {
  updatingUsers.value = true;
  const now = new Date();
  let updated = 0;

  try {
    for (const user of allUsers.value) {
      const endDate = toDate(user.subscriptionEnd);
      if (user.subscription === "ativa" && endDate && endDate < now) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          subscription: "normal",
          subscriptionStart: null,
          subscriptionEnd: null,
        });
        // Atualiza local
        user.subscription      = "normal";
        user.subscriptionStart = null;
        user.subscriptionEnd   = null;
        updated++;
      }
    }

    if (updated > 0) {
      toast.success(`${updated} assinatura(s) expirada(s) atualizada(s) para Normal.`);
    } else {
      toast.info("Nenhuma assinatura expirada encontrada.");
    }
  } catch (err) {
    console.error(err);
    toast.error("Erro ao atualizar usuários!");
  } finally {
    updatingUsers.value = false;
  }
}

// ── TOGGLE ASSINATURA ─────────────────────────────────────────────────────
async function toggleSubscription(user) {
  user.subscription = user.subscription === 'ativa' ? 'normal' : 'ativa';
  await updateSubscription(user);
}

// ── ASSINATURA ─────────────────────────────────────────────────────────────
async function updateSubscription(user) {
  try {
    const userRef = doc(db, "users", user.uid);

    if (user.subscription === "ativa") {
      const start = new Date();
      const end   = new Date();
      end.setDate(start.getDate() + 30);

      await updateDoc(userRef, {
        subscription: "ativa",
        subscriptionStart: start,
        subscriptionEnd: end,
      });

      user.subscriptionStart = start;
      user.subscriptionEnd   = end;
      toast.success(`Assinatura ativada para ${user.firstName} até ${end.toLocaleDateString("pt-BR")}`);
    } else {
      await updateDoc(userRef, {
        subscription: "normal",
        subscriptionStart: null,
        subscriptionEnd: null,
      });
      user.subscriptionStart = null;
      user.subscriptionEnd   = null;
      toast.info(`Assinatura de ${user.firstName} removida.`);
    }
  } catch (err) {
    console.error(err);
    toast.error("Erro ao atualizar assinatura!");
  }
}

// ── MODAL INDIVIDUAL ───────────────────────────────────────────────────────
function openMessageModal(user) {
  selectedUser.value = user;
  messageText.value  = "";
  showModal.value    = true;
}
function closeMessageModal() {
  showModal.value    = false;
  selectedUser.value = null;
}
async function sendMessage() {
  if (!messageText.value.trim()) { toast.warning("Digite uma mensagem!"); return; }
  try {
    await updateDoc(doc(db, "users", selectedUser.value.uid), {
      messages: arrayUnion(messageText.value.trim()),
    });
    toast.success(`Mensagem enviada para ${selectedUser.value.firstName}!`);
    closeMessageModal();
  } catch (err) {
    console.error(err);
    toast.error("Erro ao enviar mensagem.");
  }
}

// ── MODAL MASSA ────────────────────────────────────────────────────────────
function openMassMessageModal()  { massMessageText.value = ""; showMassModal.value = true; }
function closeMassMessageModal() { showMassModal.value = false; }
async function sendMassMessage() {
  if (!massMessageText.value.trim()) { toast.warning("Digite a mensagem!"); return; }
  const list = filteredUsers.value;
  if (!list.length) { toast.warning("Nenhum usuário filtrado."); return; }
  try {
    for (const user of list) {
      await updateDoc(doc(db, "users", user.uid), {
        messages: arrayUnion(massMessageText.value.trim()),
      });
    }
    toast.success(`Mensagem enviada para ${list.length} usuários!`);
    closeMassMessageModal();
  } catch (err) {
    console.error(err);
    toast.error("Erro ao enviar mensagens em massa!");
  }
}

// ── EXCEL ──────────────────────────────────────────────────────────────────
function exportUsersToExcel() {
  const data = allUsers.value.map((u) => ({
    Nome:                   `${u.firstName || ""} ${u.lastName || ""}`,
    Email:                  u.email || "—",
    Numero:                 u.numero || "—",
    ID:                     u.customID || u.uid,
    Assinatura:             u.subscription,
    "Início da Assinatura": u.subscriptionStart ? formatDate(u.subscriptionStart) : "—",
    "Fim da Assinatura":    u.subscriptionEnd   ? formatDate(u.subscriptionEnd)   : "—",
    Criado:                 u.createdAt         ? formatDate(u.createdAt)          : "—",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Usuários");
  XLSX.writeFile(wb, "usuarios.xlsx");
  toast.success("Excel gerado com sucesso!");
}
</script>

<style scoped>
/* ── TOKENS ────────────────────────────────────────────────────────────────── */
:root {
  --bg:        #0b0d10;
  --surface:   #13161b;
  --surface2:  #1c2028;
  --border:    rgba(0, 240, 180, 0.18);
  --cyan:      #00f0b5;
  --blue:      #00c3ff;
  --green:     #1db954;
  --gold:      #ffb84d;
  --red:       #ff4d6d;
  --text:      #e8eaed;
  --muted:     #7a8391;
  --radius:    14px;
}

/* ── RESET ─────────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── CONTAINER ─────────────────────────────────────────────────────────────── */
.admin-container {
  max-width: 1040px;
  margin: 0 auto;
  padding: 28px 20px 80px;
  font-family: "Syne", "Orbitron", sans-serif;
  color: var(--text);
  background: var(--bg);
  min-height: 100vh;
}

/* ── HEADER ────────────────────────────────────────────────────────────────── */
.header {
  position: relative;
  text-align: center;
  margin-bottom: 36px;
  overflow: hidden;
}
.header-glow {
  position: absolute;
  width: 500px;
  height: 200px;
  background: radial-gradient(ellipse, rgba(0,240,181,.15) 0%, transparent 70%);
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}
.title {
  font-size: clamp(22px, 5vw, 38px);
  font-weight: 900;
  letter-spacing: -0.5px;
  background: linear-gradient(130deg, var(--cyan), var(--blue), var(--cyan));
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradMove 5s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.title-icon { -webkit-text-fill-color: var(--cyan); opacity: .5; font-size: 0.7em; }
@keyframes gradMove {
  0%  { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100%{ background-position: 0% 50%; }
}
.subtitle {
  color: var(--muted);
  font-size: 14px;
  margin-top: 6px;
  font-family: "Inter", sans-serif;
}

/* ── TOP BUTTONS ───────────────────────────────────────────────────────────── */
.top-buttons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 50px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}
.btn:active { transform: scale(.97); }
.btn-icon { font-size: 14px; }

.btn-excel {
  background: var(--surface2);
  color: var(--cyan);
  border: 1px solid var(--border);
}
.btn-excel:hover { box-shadow: 0 0 14px rgba(0,240,181,.35); }

.btn-update {
  background: var(--surface2);
  color: var(--gold);
  border: 1px solid rgba(255,184,77,.25);
}
.btn-update:hover  { box-shadow: 0 0 14px rgba(255,184,77,.35); }
.btn-update.loading .btn-icon { display: inline-block; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.btn-mass {
  background: linear-gradient(135deg, var(--green), #00c6a0);
  color: #0b0d10;
}
.btn-mass:hover { box-shadow: 0 0 18px rgba(29,185,84,.45); transform: translateY(-1px); }

/* ── STATS ─────────────────────────────────────────────────────────────────── */
.stats-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px 10px;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;
  position: relative;
  overflow: hidden;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,.4); }
.stat-card.stat-active { border-color: var(--cyan); box-shadow: 0 0 18px rgba(0,240,181,.2); }

.stat-inner { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
.stat-value { font-size: 30px; font-weight: 900; line-height: 1; }
.total-val  { color: var(--blue); }
.active-val { color: var(--green); }
.normal-val { color: var(--gold); }

.stat-bar {
  height: 3px;
  background: var(--bar-color, var(--cyan));
  border-radius: 2px;
  margin-top: 14px;
  opacity: 0.5;
}
.stat-card.stat-active .stat-bar { opacity: 1; }

/* ── SEARCH ────────────────────────────────────────────────────────────────── */
.search-wrapper { margin-bottom: 22px; }
.search-box {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 50px;
  padding: 0 16px;
  gap: 10px;
  transition: border-color .2s, box-shadow .2s;
}
.search-box:focus-within {
  border-color: var(--cyan);
  box-shadow: 0 0 12px rgba(0,240,181,.2);
}
.search-icon { font-size: 16px; color: var(--muted); flex-shrink: 0; }
.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 14px;
  font-family: "Inter", sans-serif;
  padding: 13px 0;
}
.search-box input::placeholder { color: var(--muted); }
.search-clear {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  transition: color .15s;
}
.search-clear:hover { color: var(--red); }

.results-hint {
  font-size: 12px;
  color: var(--muted);
  font-family: "Inter", sans-serif;
  margin-top: 8px;
  padding-left: 6px;
}
.results-hint strong { color: var(--cyan); }

/* ── LOADING ───────────────────────────────────────────────────────────────── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-top: 60px;
  color: var(--muted);
  font-family: "Inter", sans-serif;
  font-size: 14px;
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--surface2);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

/* ── USER LIST ─────────────────────────────────────────────────────────────── */
.user-list { display: flex; flex-direction: column; gap: 12px; }

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px;
  position: relative;
  overflow: hidden;
  transition: transform .2s, box-shadow .2s;
}
.user-card:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(0,0,0,.45); }

.card-accent {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 2px 0 0 2px;
}
.accent-active { background: var(--green); }
.accent-normal { background: var(--muted); opacity: 0.4; }

.user-info { flex: 1; min-width: 0; }
.name {
  font-size: 15px;
  font-weight: 700;
  color: var(--cyan);
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 4px 16px;
  margin-bottom: 10px;
}
.info-item {
  font-family: "Inter", sans-serif;
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.info-item em {
  font-style: normal;
  color: var(--text);
  opacity: 0.5;
  margin-right: 4px;
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.subscription-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  color: var(--green);
  background: rgba(29,185,84,.1);
  border: 1px solid rgba(29,185,84,.25);
  border-radius: 50px;
  padding: 3px 10px;
}
.badge-normal { color: var(--muted); background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.08); }
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; flex-shrink: 0; }
.badge-dot-off { background: var(--muted); animation: none; }
@keyframes pulse {
  0%,100% { opacity: 1; }
  50%      { opacity: .3; }
}

/* ── USER ACTIONS ──────────────────────────────────────────────────────────── */
.user-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.btn-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 50px;
  border: 2px solid transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all .2s;
  min-width: 120px;
  justify-content: center;
  letter-spacing: .4px;
}
.toggle-active {
  background: rgba(29,185,84,.15);
  color: var(--green);
  border-color: var(--green);
  box-shadow: 0 0 12px rgba(29,185,84,.2);
}
.toggle-active:hover {
  background: rgba(29,185,84,.28);
  box-shadow: 0 0 20px rgba(29,185,84,.4);
  transform: translateY(-1px);
}
.toggle-normal {
  background: rgba(255,255,255,.05);
  color: var(--muted);
  border-color: rgba(255,255,255,.12);
}
.toggle-normal:hover {
  background: rgba(0,240,181,.1);
  color: var(--cyan);
  border-color: var(--cyan);
  box-shadow: 0 0 14px rgba(0,240,181,.2);
  transform: translateY(-1px);
}
.toggle-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}
.toggle-active .toggle-dot { animation: pulse 2s infinite; }

.btn-msg {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(29,185,84,.3);
  background: rgba(29,185,84,.1);
  color: var(--green);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background .15s, box-shadow .15s, transform .15s;
}
.btn-msg:hover {
  background: rgba(29,185,84,.22);
  box-shadow: 0 0 12px rgba(29,185,84,.3);
  transform: translateY(-1px);
}

/* ── NO RESULTS ────────────────────────────────────────────────────────────── */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 60px 0;
  color: var(--muted);
  font-family: "Inter", sans-serif;
  font-size: 14px;
}
.no-results span { font-size: 32px; }

/* ── MODAL ─────────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 24px;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 24px 80px rgba(0,0,0,.6);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 { font-size: 16px; font-weight: 700; }
.modal-header strong { color: var(--cyan); }
.modal-close {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  transition: color .15s;
  padding: 4px;
}
.modal-close:hover { color: var(--red); }

.modal-hint {
  font-size: 13px;
  color: var(--muted);
  font-family: "Inter", sans-serif;
}
.modal-hint strong { color: var(--cyan); }

.modal-content textarea {
  width: 100%;
  min-height: 110px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  color: var(--text);
  font-family: "Inter", sans-serif;
  font-size: 14px;
  resize: vertical;
  outline: none;
  transition: border-color .2s;
}
.modal-content textarea:focus { border-color: var(--cyan); }

.modal-buttons { display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel, .btn-send {
  padding: 9px 20px;
  border-radius: 50px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}
.btn-cancel { background: var(--surface2); color: var(--muted); border: 1px solid rgba(255,255,255,.1); }
.btn-cancel:hover { color: var(--red); border-color: rgba(255,77,109,.4); }
.btn-send   { background: linear-gradient(135deg, var(--green), #00c6a0); color: #0b0d10; }
.btn-send:hover { transform: translateY(-1px); box-shadow: 0 4px 18px rgba(29,185,84,.4); }

/* ── TRANSITIONS ───────────────────────────────────────────────────────────── */
.modal-enter-active, .modal-leave-active { transition: opacity .2s, transform .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(.95); }

.card-enter-active { transition: opacity .3s, transform .3s; }
.card-enter-from   { opacity: 0; transform: translateY(10px); }

/* ── RESPONSIVE ────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .admin-container { padding: 18px 14px 80px; }
  .stats-panel { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat-card { padding: 14px 12px 8px; }
  .stat-value { font-size: 22px; }

  .user-card {
    flex-direction: column;
    gap: 14px;
  }
  .user-actions {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
  }
  .sub-select { flex: 1; }
  .btn-msg    { flex: 1; }

  .info-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 380px) {
  .stats-panel { grid-template-columns: 1fr; }
  .info-grid   { grid-template-columns: 1fr; }
}
</style>