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
        <button class="btn" @click="fetchUsers(); fetchTotal()" :disabled="loading">Recarregar página</button>
        <button v-if="allUsers.some(u=>u.password)" class="btn" @click="removeLegacyPasswords" :disabled="loading">Remover senhas dos perfis desta página</button>
        <button class="btn btn-excel" @click="exportUsersToExcel">
          <span class="btn-icon">📊</span>
          <span>Gerar Excel</span>
        </button>
        <button class="btn btn-update" :class="{ loading: updatingUsers }" @click="updateExpiredUsers" :disabled="updatingUsers">
          <span class="btn-icon">{{ updatingUsers ? '⟳' : '🔄' }}</span>
          <span>{{ updatingUsers ? 'Atualizando...' : 'Atualizar vencidas desta página' }}</span>
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
          <span class="stat-label">Total de contas</span>
          <span class="stat-value total-val">{{ totalUsers ?? '—' }}</span>
        </div>
        <div class="stat-bar" style="--bar-color: #00c3ff" />
      </div>

      <div
        class="stat-card"
        :class="{ 'stat-active': selectedFilter === 'ativos' }"
        @click="setFilter('ativos')"
      >
        <div class="stat-inner">
          <span class="stat-label">Ativos nesta página</span>
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
          <span class="stat-label">Sem acesso nesta página</span>
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
          placeholder="Filtrar esta página por nome, email, ID ou data…"
        />
        <button v-if="search" class="search-clear" @click="search = ''">✕</button>
      </div>
      <p class="results-hint">
        Exibindo <strong>{{ filteredUsers.length }}</strong>
        <template v-if="selectedFilter === 'todos' && !search"> de {{ allUsers.length }} (página {{ page+1 }})</template>
        <template v-else> usuário(s)</template>
      </p>
    </div>

    <div class="search-box" style="display:flex;gap:8px;flex-wrap:wrap;margin:20px 0"><select v-model="lookupKind"><option value="email">Email exato</option><option value="uid">UID exato</option><option value="customID">ID da conta</option></select><input v-model="lookup" placeholder="Buscar na base inteira" @keyup.enter="findGlobal"/><button @click="findGlobal" :disabled="loading">Buscar conta</button><button v-if="lookupMode" @click="resetPages">Voltar à lista</button></div>
    <div style="display:flex;gap:12px;align-items:center;margin:20px 0"><button class="btn" @click="changePage(-1)" :disabled="loading || page===0">Anterior</button><span>Página {{ page+1 }} · até 25 contas</span><button class="btn" @click="changePage(1)" :disabled="loading || !hasNext">Próxima</button></div>
    <label style="display:block;margin:20px 0">Excel e mensagens em massa: <select v-model="actionScope"><option value="page">Usuários filtrados desta página</option><option value="all">Toda a base, após confirmação</option></select></label>
    <!-- ── LOADING ── -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <p>Carregando usuários…</p>
    </div>

    <!-- ── USER LIST ── -->
    <div v-else class="user-list">
      <TransitionGroup name="card">
        <div v-for="user in filteredUsers" :key="user.uid" class="user-card">
          <div class="card-accent" :class="isActive(user) ? 'accent-active' : 'accent-normal'" />

          <div class="user-info">
            <p class="name">{{ user.firstName }} {{ user.lastName }}</p>
            <div class="info-grid">
              <span class="info-item"><em>Email</em>{{ user.email }}</span>
              <span class="info-item"><em>Número</em>{{ user.numero || '—' }}</span>
              <span class="info-item"><em>ID</em>{{ user.customID || user.uid }}</span>
              <span class="info-item"><em>Inscrito</em>{{ formatDate(user.createdAt) }}</span>
            </div>
            <div v-if="isActive(user)" class="subscription-badge">
              <span class="badge-dot" />
              Ativa · {{ formatDate(user.subscriptionStart) }} → {{ user.subscriptionLifetime ? 'Vitalício' : formatDate(user.subscriptionEnd) }}
            </div>
            <div v-else class="subscription-badge badge-normal">
              <span class="badge-dot badge-dot-off" />
              Normal
            </div>
          </div>

          <div class="user-actions">
            <button class="admin-button user-device-action" @click="$emit('inspect-devices',user.uid)"><i class="mdi mdi-devices"/> Aparelhos · {{ devices.verified?devices.countFor(user.uid):'—' }} recentes</button>
            <button
              class="btn-toggle"
              :class="isActive(user) ? 'toggle-active' : 'toggle-normal'"
              @click="toggleSubscription(user)"
            >
              <span class="toggle-dot" />
              {{ isActive(user) ? '✦ Ativa' : '○ Normal' }}
            </button>
            <EqualizerGrantButton :uid="user.uid" :nome="user.firstName || user.email" />
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
            <template v-if="actionScope==='page'">Será enviado para <strong>{{ filteredUsers.length }}</strong> usuários filtrados desta página.</template><template v-else>Será enviado para usuários da base inteira que atendam aos filtros, após confirmação.</template>
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion, deleteField, getCountFromServer, query, limit, startAfter, orderBy, documentId, where, getDoc,
} from "firebase/firestore";
import { useUserStore } from "@/stores/userStore";
import { useDeviceAdminStore } from "@/stores/useDeviceAdminStore";
import EqualizerGrantButton from "@/components/EqualizerGrantButton.vue";
defineEmits(["inspect-devices"]);
const devices=useDeviceAdminStore();
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";
import * as XLSX from "xlsx";

const router    = useRouter();
const userStore = useUserStore();
const toast     = useToast();

// ── STATE ──────────────────────────────────────────────────────────────────
const totalUsers=ref(null)
const page = ref(0), hasNext=ref(false), lookup=ref(''), lookupKind=ref('email'), lookupMode=ref(false), actionScope=ref('page')
let cursors=[null], lastDoc=null
const allUsers       = ref([]);
const loading        = ref(false);
const updatingUsers  = ref(false);
const search         = ref("");
const selectedFilter = ref("todos");

const showModal      = ref(false);
const selectedUser   = ref(null);
const messageText    = ref("");

const showMassModal  = ref(false);
const massMessageText = ref("");

watch(() => [userStore.user?.uid,userStore.user?.role], async ([uid,role]) => { if(!uid)return; if(role==='admin')await Promise.all([fetchUsers(),fetchTotal()]); },{immediate:true})
async function fetchTotal(){try{totalUsers.value=(await getCountFromServer(collection(db,'users'))).data().count}catch{totalUsers.value=null}}
function mapUser(d){const data=d.data();return {...data,uid:d.id,subscription:data.subscription||'normal',subscriptionStart:toDate(data.subscriptionStart),subscriptionEnd:toDate(data.subscriptionEnd)}}
async function fetchUsers(){if(loading.value)return;loading.value=true;try{
 if(lookupMode.value && lookupKind.value==='uid'){const snap=await getDoc(doc(db,'users',lookup.value.trim()));allUsers.value=snap.exists()?[mapUser(snap)]:[];hasNext.value=false;return}
 const terms=[orderBy(documentId())];if(lookupMode.value)terms.push(where(lookupKind.value,'==',lookupKind.value==='email'?lookup.value.trim().toLowerCase():lookup.value.trim()));if(cursors[page.value])terms.push(startAfter(cursors[page.value]));const snapshot=await getDocs(query(collection(db,'users'),...terms,limit(26)));const docs=snapshot.docs.slice(0,25);allUsers.value=docs.map(mapUser);lastDoc=docs.at(-1);hasNext.value=snapshot.size>25
 }catch(e){toast.error('Erro ao carregar usuários: '+e.message)}finally{loading.value=false}}
async function changePage(direction){if(loading.value)return;if(direction>0){cursors[page.value+1]=lastDoc;page.value++}else page.value=Math.max(0,page.value-1);await fetchUsers()}
async function findGlobal(){if(!lookup.value.trim())return;lookupMode.value=true;page.value=0;cursors=[null];await fetchUsers()}
async function resetPages(){lookupMode.value=false;lookup.value='';page.value=0;cursors=[null];await fetchUsers()}
async function allForAction(){if(actionScope.value==='page')return filteredUsers.value;if(!window.confirm('Consultar toda a base para esta ação? Isso consome leituras no Firebase.'))return [];const list=[];let cursor=null;do{const terms=[orderBy(documentId()),limit(100)];if(cursor)terms.push(startAfter(cursor));const snap=await getDocs(query(collection(db,'users'),...terms));list.push(...snap.docs.map(mapUser));cursor=snap.size===100?snap.docs.at(-1):null}while(cursor);const text=search.value.trim().toLowerCase();return list.filter(u=>(selectedFilter.value==='todos'||(selectedFilter.value==='ativos'?isActive(u):!isActive(u)))&&(!text||`${u.firstName} ${u.lastName} ${u.email} ${u.uid} ${u.customID}`.toLowerCase().includes(text)))}
function isActive(u){return u.subscription==='ativa' && (u.subscriptionLifetime || (u.subscriptionEnd && u.subscriptionEnd>new Date()))}

const activeUsers = computed(() => allUsers.value.filter(isActive).length);
const normalUsers = computed(() => allUsers.value.filter(u => !isActive(u)).length);

const filteredUsers = computed(() => {
  const s = search.value.trim().toLowerCase();
  let list = [...allUsers.value];
  if (selectedFilter.value === "ativos") list = list.filter(isActive);
  else if (selectedFilter.value === "normais") list = list.filter(u => !isActive(u));
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

function setFilter(type) { selectedFilter.value = type }

function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val.toDate === "function") return val.toDate();
  if (typeof val.seconds === "number") return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}
function formatDate(ts) { const d = toDate(ts); return d ? d.toLocaleDateString("pt-BR") : "—" }

// ── ASSINATURA ──
async function toggleSubscription(user) {
  const activate = !isActive(user);
  const ref = doc(db, "users", user.uid);
  try {
    if (activate) {
      const days = Number(window.prompt(`Liberar assinatura de músicas para ${user.firstName || user.email} por quantos dias?`, "30"));
      if (!Number.isFinite(days) || days < 1) return;
      const start = new Date();
      const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
      await updateDoc(ref, {
        subscription: "ativa",
        subscriptionLifetime: false,
        subscriptionStart: start,
        subscriptionEnd: end,
      });
      user.subscription = "ativa";
      user.subscriptionLifetime = false;
      user.subscriptionStart = start;
      user.subscriptionEnd = end;
      toast.success(`Assinatura ativada por ${days} dias para ${user.firstName || user.email}.`);
    } else {
      if (!window.confirm(`Desativar a assinatura de ${user.firstName || user.email}?`)) return;
      await updateDoc(ref, {
        subscription: "normal",
        subscriptionLifetime: false,
        subscriptionStart: null,
        subscriptionEnd: null,
      });
      user.subscription = "normal";
      user.subscriptionLifetime = false;
      user.subscriptionStart = null;
      user.subscriptionEnd = null;
      toast.info(`Assinatura desativada de ${user.firstName || user.email}.`);
    }
  } catch (e) {
    toast.error("Não foi possível alterar a assinatura: " + e.message);
  }
}

// ── ATUALIZAR VENCIDAS ──
async function updateExpiredUsers() {
  updatingUsers.value = true;
  const now = new Date();
  let updated = 0;
  try {
    for (const user of allUsers.value) {
      const endDate = toDate(user.subscriptionEnd);
      if (!user.subscriptionLifetime && user.subscription === "ativa" && endDate && endDate < now) {
        await updateDoc(doc(db, "users", user.uid), {
          subscriptionLifetime: false,
          subscription: "normal",
          subscriptionStart: null,
          subscriptionEnd: null,
        });
        user.subscription = "normal";
        user.subscriptionLifetime = false;
        user.subscriptionStart = null;
        user.subscriptionEnd = null;
        updated++;
      }
    }
    if (updated > 0) toast.success(`${updated} assinatura(s) expirada(s) atualizada(s) para Normal.`);
    else toast.info("Nenhuma assinatura vencida nesta página.");
  } catch (e) {
    toast.error("Erro ao atualizar: " + e.message);
  } finally {
    updatingUsers.value = false;
  }
}

// ── SENHAS LEGADAS ──
async function removeLegacyPasswords() {
  if (!window.confirm("Remover o campo password dos perfis listados nesta página?")) return;
  let removidos = 0;
  try {
    for (const user of allUsers.value) {
      if (!user.password) continue;
      await updateDoc(doc(db, "users", user.uid), { password: deleteField() });
      delete user.password;
      removidos++;
    }
    toast.success(removidos ? `${removidos} senha(s) antiga(s) removida(s).` : "Nenhuma senha antiga nesta página.");
  } catch (e) {
    toast.error("Não foi possível remover as senhas: " + e.message);
  }
}

// ── MENSAGENS ──
function openMessageModal(user) { selectedUser.value = user; messageText.value = ""; showModal.value = true }
function closeMessageModal() { showModal.value = false; selectedUser.value = null; messageText.value = "" }
async function sendMessage() {
  const texto = messageText.value.trim();
  if (!selectedUser.value || !texto) return;
  try {
    await updateDoc(doc(db, "users", selectedUser.value.uid), { messages: arrayUnion(texto) });
    toast.success("Mensagem enviada.");
    closeMessageModal();
  } catch (e) {
    toast.error("Não foi possível enviar: " + e.message);
  }
}
function openMassMessageModal() { massMessageText.value = ""; showMassModal.value = true }
function closeMassMessageModal() { showMassModal.value = false; massMessageText.value = "" }
async function sendMassMessage() {
  const texto = massMessageText.value.trim();
  if (!texto) return;
  const alvos = await allForAction();
  if (!alvos.length) return;
  if (!window.confirm(`Enviar a mensagem para ${alvos.length} conta(s)?`)) return;
  let enviados = 0;
  try {
    for (const u of alvos) {
      await updateDoc(doc(db, "users", u.uid), { messages: arrayUnion(texto) });
      enviados++;
    }
    toast.success(`Mensagem enviada para ${enviados} conta(s).`);
    closeMassMessageModal();
  } catch (e) {
    toast.error("Envio interrompido: " + e.message);
  }
}

// ── EXCEL ──
async function exportUsersToExcel() {
  const lista = await allForAction();
  if (!lista.length) return;
  const linhas = lista.map((u) => ({
    Nome: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
    Email: u.email || "",
    Numero: u.numero || "",
    ID: u.customID || u.uid,
    Assinatura: isActive(u) ? "Ativa" : "Normal",
    Inicio: formatDate(u.subscriptionStart),
    Fim: u.subscriptionLifetime ? "Vitalicio" : formatDate(u.subscriptionEnd),
    Inscrito: formatDate(u.createdAt),
  }));
  const planilha = XLSX.utils.json_to_sheet(linhas);
  const arquivo = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(arquivo, planilha, "Usuarios");
  XLSX.writeFile(arquivo, `usuarios-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
</script>

<style scoped>
.admin-container { max-width: 1200px; margin: 0 auto; padding: 28px 20px 120px; color: #e8f4ec; font-family: Inter, system-ui, sans-serif; }
.header { position: relative; margin-bottom: 26px; }
.title { font-size: clamp(24px, 4vw, 34px); display: flex; align-items: center; gap: 10px; }
.title-icon { color: #58d783; }
.subtitle { color: #9db8a8; font-size: 13px; margin-top: 8px; }
.top-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.btn { min-height: 44px; padding: 10px 14px; border-radius: 10px; border: 1px solid #41624a; background: #1a2b1f; color: #cbebd6; font-size: 12px; cursor: pointer; }
.stats-panel { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
.stat-card { position: relative; padding: 18px; border-radius: 16px; background: #17281d; border: 1px solid #33503c; cursor: pointer; }
.stat-active { border-color: #7fb894; }
.stat-label { font-size: 11px; color: #9db8a8; }
.stat-value { display: block; font-size: 26px; font-weight: 700; margin-top: 6px; }
.search-wrapper { margin-bottom: 18px; }
.search-box { display: flex; align-items: center; gap: 8px; background: #17281d; border: 1px solid #33503c; border-radius: 12px; padding: 10px 12px; }
.search-box input { flex: 1; background: transparent; border: none; color: #e8f4ec; outline: none; font-size: 13px; }
.search-clear { background: transparent; border: none; color: #9db8a8; cursor: pointer; font-size: 16px; }
.results-hint { font-size: 12px; color: #9db8a8; margin-top: 8px; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px; color: #9db8a8; }
.spinner { width: 28px; height: 28px; border: 2px solid #33503c; border-top-color: #58d783; border-radius: 50%; animation: girar 0.8s linear infinite; }
@keyframes girar { to { transform: rotate(360deg) } }
.user-list { display: flex; flex-direction: column; gap: 12px; }
.user-card { position: relative; display: flex; gap: 16px; padding: 18px; border-radius: 16px; background: #17281d; border: 1px solid #33503c; flex-wrap: wrap; }
.card-accent { position: absolute; left: 0; top: 18px; bottom: 18px; width: 3px; border-radius: 0 3px 3px 0; }
.accent-active { background: #1db954; }
.accent-normal { background: #ffb84d; }
.user-info { flex: 1; min-width: 220px; }
.name { font-size: 16px; font-weight: 700; }
.info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 14px; margin: 10px 0; }
.info-item { font-size: 12px; color: #c3d8c9; overflow-wrap: anywhere; }
.info-item em { display: block; font-size: 10px; color: #8fa898; font-style: normal; }
.subscription-badge { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; color: #bff4d1; }
.badge-normal { color: #ffd8a3; }
.badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #1db954; }
.badge-dot-off { background: #ffb84d; }
.user-actions { display: flex; flex-direction: column; gap: 8px; min-width: 190px; }
.user-actions :deep(.btn-eq) { width: 100%; justify-content: center; }
.user-device-action { justify-content: center; }
.btn-toggle, .btn-msg { min-height: 44px; padding: 10px 14px; border-radius: 10px; border: 1px solid #41624a; background: #1a2b1f; color: #cbebd6; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.toggle-active { border-color: #7fb894; color: #d8ffe8; }
.toggle-dot { width: 8px; height: 8px; border-radius: 50%; background: #ffb84d; }
.toggle-active .toggle-dot { background: #1db954; box-shadow: 0 0 8px #1db954; }
.no-results { padding: 40px; text-align: center; color: #9db8a8; }
.modal-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.7); z-index: 9999; padding: 20px; }
.modal-content { width: 100%; max-width: 460px; background: #17281d; border: 1px solid #33503c; border-radius: 18px; padding: 22px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.modal-close { background: transparent; border: none; color: #9db8a8; font-size: 18px; cursor: pointer; }
.modal-hint { font-size: 12px; color: #9db8a8; margin-top: 10px; }
.modal-content textarea { width: 100%; min-height: 120px; background: #0f1c14; border: 1px solid #33503c; border-radius: 10px; padding: 12px; color: #e8f4ec; font-size: 13px; }
.modal-buttons { display: flex; gap: 10px; margin-top: 14px; }
.btn-cancel, .btn-send { flex: 1; min-height: 44px; border-radius: 10px; border: 1px solid #41624a; background: #1a2b1f; color: #cbebd6; cursor: pointer; }
.btn-send { background: #ace8bf; border-color: #ace8bf; color: #152f1d; font-weight: 700; }
@media (max-width: 760px) {
  .stats-panel { grid-template-columns: 1fr; }
  .user-card { flex-direction: column; }
  .user-actions { min-width: 0; }
  .user-actions :deep(.btn-eq), .btn-toggle, .btn-msg, .user-device-action { width: 100%; }
}
@media (max-width: 380px) {
  .stats-panel { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr; }
}
</style>
