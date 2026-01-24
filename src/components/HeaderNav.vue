<template>
  <header class="header-container" ref="headerRef">
    <div class="header-esquerda">
      <!-- Logo e Drawer -->
      <div class="logo" @click="drawer = !drawer">
        <div class="checkboxtoggler" :class="{ open: drawer }">
          <div class="line-1"></div>
          <div class="line-2"></div>
          <div class="line-3"></div>
        </div>
      </div>

      <!-- Navigation Drawer -->
      <v-navigation-drawer
        v-model="drawer"
        :location="$vuetify.display.mobile ? 'left' : undefined"
        temporary
        class="custom-drawer"
      >
        <!-- MENU -->
        <v-list>
          <v-list-subheader class="drawer-subtitle">MENU</v-list-subheader>
          <v-list-item v-for="item in menuItems" :key="item.title" class="drawer-item">
            <v-list-item-title>
              <a :href="item.href">{{ item.title }}</a>
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- LIVRARIA -->
        <v-list>
          <v-list-subheader class="drawer-subtitle">LIVRARIA</v-list-subheader>
          <v-list-item v-for="item in libraryItems" :key="item.title" class="drawer-item">
            <v-list-item-title>
              <a :href="item.href">{{ item.title }}</a>
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- EXTRAS -->
        <v-list>
          <v-list-subheader class="drawer-subtitle">EXTRAS</v-list-subheader>

          <v-list-item class="drawer-item">
            <v-list-item-title>
              <a
                href="https://www.instagram.com/repertorio___atualizado?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                >📸 Instagram</a
              >
            </v-list-item-title>
          </v-list-item>

          <v-list-item class="drawer-item">
            <v-list-item-title>
              <a href="https://youtube.com/seuapp" target="_blank">▶️ YouTube</a>
            </v-list-item-title>
          </v-list-item>

          <v-list-item class="drawer-item vip-link">
            <v-list-item-title>
              <a href="#" target="_blank">🌟 Grupo VIP</a>
            </v-list-item-title>
          </v-list-item>

          <v-list-item class="drawer-item support-link">
            <v-list-item-title>
              <a
                href="https://wa.me/8695102595?text=Ol%C3%A1%2C%20quero%20mais%20informa%C3%A7%C3%B5es%20de%20suporte!%20"
                target="_blank"
                >💬 Suporte WhatsApp</a
              >
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- Main Menu -->
      <nav class="main-menu" v-if="!isMobile">
        <ul>
          <li><a href="/AllMusic">MÚSICAS</a></li>
          <li><a href="/Repertorios">REPERTÓRIOS</a></li>
        </ul>
      </nav>
    </div>

    <!-- Header Direito: Usuário -->
    <div class="header-direito">
      <div class="user-menu" ref="userRef" v-show="!(isMobile && searchActive)">
        <template v-if="userStore.user">
          <span class="user-name" @click.stop="toggleDropdown">
            <template v-if="!userStore.loadingUser">Olá, {{ userStore.user.name }}</template>
            <template v-else>Olá...</template>
            <span v-if="hasNotification" class="user-indicator"></span>
            <span class="arrow">▼</span>
          </span>

          <div v-if="dropdownOpen" class="dropdown">
            <ul>
              <li v-if="userStore.user?.role === 'admin'">
                <a href="/admin"> ⚙ Administração</a>
              </li>

              <li>
                <!-- ✅ NADA de .open() aqui -->
                <a href="#" v-if="!assinaturaAtiva" @click.prevent="openAssinaturaModal">
                  🔑 Ativar Assinatura
                </a>
                <span v-else class="ativado">✅Assinatura ativa</span>
              </li>

              <li><a href="#" @click.prevent="openNotificationsModal">🔔 Notificações</a></li>
              <li><a href="#" @click.prevent="logout">🚪 Sair</a></li>
            </ul>
          </div>
        </template>

        <template v-else>
          <span class="auth-links">
            <a href="#" class="LoginAndRegister" @click.prevent="goToAuth('login')">ENTRAR</a>
            <a href="#" class="LoginAndRegister" @click.prevent="goToAuth('register')">REGISTRAR</a>
          </span>
        </template>
      </div>
    </div>

    <!-- ✅ Modal Assinatura (controlado por boolean) -->
    <v-dialog
      v-model="assinaturaModal"
      max-width="980"
      persistent
      transition="dialog-bottom-transition"
    >
      <v-card class="premium-modal" elevation="14">
        <!-- Fechar -->
        <v-btn icon variant="text" class="premium-close" @click="assinaturaModal = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <div class="premium-wrap">
          <!-- LADO ESQUERDO -->
          <div class="premium-left">
            <div class="premium-icon">
              <v-icon size="34">mdi-book-open-variant</v-icon>
            </div>

            <h2 class="premium-title">Acesso Premium</h2>

            <p class="premium-subtitle">
              Desbloqueie player, downloads e fila ilimitada com sua assinatura.
            </p>

            <div class="premium-badge">
              <v-icon size="18">mdi-flash</v-icon>
              <span>Ativação em segundos</span>
            </div>
          </div>

          <!-- LADO DIREITO -->
          <div class="premium-right">
            <h1 class="premium-h1">Escolha como quer continuar</h1>

            <p class="premium-desc">
              Para liberar todos os recursos, você precisa ativar ou adquirir sua assinatura.
            </p>

            <!-- PASSOS -->
            <div class="premium-steps">
              <div class="premium-step">
                <div class="step-num">1</div>
                <div class="step-txt">
                  <div class="step-title">Comprar assinatura</div>
                  <div class="step-sub">Fale direto com nossa equipe pelo WhatsApp.</div>
                </div>
              </div>

              <div class="premium-step">
                <div class="step-num">2</div>
                <div class="step-txt">
                  <div class="step-title">Receber sua chave</div>
                  <div class="step-sub">A liberação é enviada após a confirmação.</div>
                </div>
              </div>

              <div class="premium-step">
                <div class="step-num">3</div>
                <div class="step-txt">
                  <div class="step-title">Ativar assinatura</div>
                  <div class="step-sub">Digite sua chave e aproveite para baixar e ouvir online.</div>
                </div>
              </div>
            </div>

            <!-- INPUT CHAVE -->
            <transition name="fade">
              <div class="premium-input-area">
                <v-text-field
                  v-model="chaveAssinatura"
                  label="Digite sua chave"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-key-variant"
                  @keydown.enter.prevent="ativarAssinatura"
                />
              </div>
            </transition>

            <div class="premium-actions">
              <v-btn class="premium-buy" @click="comprarAssinatura">
                <v-icon start>mdi-whatsapp</v-icon>
                Comprar assinatura
              </v-btn>
            </div>

            <v-btn variant="text" class="premium-cancel" @click="assinaturaModal = false">
              Cancelar
            </v-btn>

            <div class="premium-footer">Suporte disponível para ajudar você</div>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- Modal Notificações -->
    <v-dialog v-model="notificacoesModal" max-width="500px">
      <v-card>
        <v-card-title>📩 Minhas Notificações</v-card-title>
        <v-card-text>
          <div v-if="loadingMessages">Carregando mensagens...</div>
          <div v-else-if="messages.length === 0">Nenhuma notificação encontrada.</div>
          <ul v-else class="messages-list">
            <li v-for="(msg, index) in messages" :key="index" class="message-item">
              {{ msg }}
            </li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="notificacoesModal = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useUserStore } from "@/stores/userStore";
import { useRouter, useRoute } from "vue-router";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, getDocs, setDoc, collection, query, where, limit } from "firebase/firestore";
import "vue-toast-notification/dist/theme-sugar.css";
import { useToast } from "vue-toast-notification";

const dropdownOpen = ref(false);
const hasNotification = ref(true);

const drawer = ref(false);
const $toast = useToast();

const searchActive = ref(false);
const isMobile = ref(window.innerWidth <= 950);
const searchRef = ref(null);
const searchInputRef = ref(null);
const userRef = ref(null);
const headerRef = ref(null);

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// assinatura
const assinaturaModal = ref(false); // ✅ boolean (nada de .open)
const chaveAssinatura = ref("");
const assinaturaAtiva = ref(false);

// notificações
const notificacoesModal = ref(false);
const messages = ref([]);
const loadingMessages = ref(false);

// menus
const menuItems = [
  { title: "INICIO", href: "/" },
  { title: "COMO ATIVAR OU BAIXAR", href: "/Tutoriais" },
  { title: "MÚSICAS", href: "/AllMusic" },
  { title: "REPERTÓRIOS", href: "/Repertorios" },
  { title: "BAIXAR POR CANTORES", href: "/Cantores" },
];
const libraryItems = [{ title: "FAVORITOS ", href: "/favoritos" }];

function comprarAssinatura() {
  window.open("https://wa.me/5586995102595?text=Ol%C3%A1%2C%20tenho%20interesse%20no%20repertorio.", "_blank");
}

/**
 * ✅ VERIFICA ASSINATURA + EXPIRAÇÃO
 * ✅ SE NÃO ESTIVER ATIVA: ABRE O MODAL (ao logar / refresh / troca de rota)
 */
async function verificarAssinatura({ forceOpenModal = true } = {}) {
  try {
    const user = auth.currentUser;

    if (!user) {
      assinaturaAtiva.value = false;
      // sem login: não força abrir
      if (forceOpenModal) assinaturaModal.value = false;
      return;
    }

    const email = (user.email || "").toLowerCase();

    const q = query(collection(db, "users"), where("email", "==", email), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      assinaturaAtiva.value = false;
      if (forceOpenModal) assinaturaModal.value = true;
      return;
    }

    const userDocSnap = snap.docs[0];
    const data = userDocSnap.data();

    const endRaw = data.subscriptionEnd;
    const endDate = endRaw ? new Date(endRaw) : null;
    const now = new Date();

    const aindaValida =
      data.subscription === "ativa" &&
      endDate instanceof Date &&
      !isNaN(endDate) &&
      endDate > now;

    assinaturaAtiva.value = !!aindaValida;

    // expirou -> marca inativa
    if (!aindaValida && data.subscription === "ativa" && endDate && endDate <= now) {
      await setDoc(doc(db, "users", userDocSnap.id), { subscription: "inativa" }, { merge: true });
      assinaturaAtiva.value = false;
    }

    if (forceOpenModal) {
      if (!assinaturaAtiva.value) {
        assinaturaModal.value = true;
        chaveAssinatura.value = "";
      } else {
        assinaturaModal.value = false;
      }
    }
  } catch (err) {
    console.error("Erro ao verificar assinatura:", err);
    assinaturaAtiva.value = false;
    if (forceOpenModal && auth.currentUser) assinaturaModal.value = true;
  }
}

// abrir modal assinatura (manual)
function openAssinaturaModal() {
  if (assinaturaAtiva.value) {
    $toast.info("Sua conta já está ativa!", { position: "top-center" });
    return;
  }
  assinaturaModal.value = true;
  chaveAssinatura.value = "";
}

// ativar assinatura (✅ sem reload pra não “matar” o fluxo)
async function ativarAssinatura() {
  try {
    const user = auth.currentUser;
    if (!user) return $toast.error("Usuário não autenticado");

    const email = (user.email || "").toLowerCase();

    const qUser = query(collection(db, "users"), where("email", "==", email), limit(1));
    const usersSnapshot = await getDocs(qUser);
    if (usersSnapshot.empty) return $toast.error("Usuário não encontrado");

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (userData.subscription === "ativa") {
      assinaturaAtiva.value = true;
      assinaturaModal.value = false;
      return $toast.info("Já possui assinatura");
    }

    const keysSnap = await getDocs(collection(db, "Chaves"));
    if (keysSnap.empty) return $toast.error("Nenhuma chave encontrada!");

    const chaveDoc = keysSnap.docs[0];
    const keys = chaveDoc.data().Keys || [];

    const chave = (chaveAssinatura.value || "").trim();
    if (!keys.includes(chave)) return $toast.error("Chave inválida!");

    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 30);

    await setDoc(
      doc(db, "users", userId),
      {
        subscription: "ativa",
        subscriptionStart: start.toISOString(),
        subscriptionEnd: end.toISOString(),
      },
      { merge: true }
    );

    $toast.success("Ativada com sucesso!", { position: "top" });
    window.location.reload();

    assinaturaAtiva.value = true;
    assinaturaModal.value = false;

    // revalida
    await verificarAssinatura({ forceOpenModal: false });
  } catch (err) {
    console.error(err);
    $toast.error("Erro ao ativar assinatura!");
  }
}

// notificações
async function openNotificationsModal() {
  loadingMessages.value = true;

  try {
    const user = auth.currentUser;
    if (!user) {
      $toast.error("Usuário não autenticado", { position: "top" });
      return;
    }

    const email = (user.email || "").toLowerCase();

    const q = query(collection(db, "users"), where("email", "==", email), limit(1));
    const usersSnapshot = await getDocs(q);

    if (usersSnapshot.empty) {
      $toast.error("Usuário não encontrado no Firestore", { position: "top" });
      return;
    }

    const userData = usersSnapshot.docs[0].data();
    messages.value = userData.messages || [];
    notificacoesModal.value = true;
  } catch (err) {
    console.error("Erro ao abrir notificações:", err);
    $toast.error("Erro ao abrir notificações!", { position: "top" });
  } finally {
    loadingMessages.value = false;
  }
}

// gerais
function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function toggleSearch() {
  if (!isMobile.value) return;
  searchActive.value = !searchActive.value;
  if (searchActive.value) nextTick(() => searchInputRef.value?.focus());
}

async function logout() {
  try {
    await signOut(auth);
    userStore.clearUser();
    window.location.href = "/";
  } catch (err) {
    console.error(err);
  }
}

function goToAuth(mode) {
  router.push({ path: "/RegisterAndLogin", query: { mode } });
}

function handleClickOutside(event) {
  if (dropdownOpen.value && userRef.value && !userRef.value.contains(event.target)) {
    dropdownOpen.value = false;
  }

  if (searchActive.value && searchRef.value && !searchRef.value.contains(event.target)) {
    searchActive.value = false;
  }
}

function handleResize() {
  const wasMobile = isMobile.value;
  isMobile.value = window.innerWidth <= 950;
  if (!isMobile.value && wasMobile) searchActive.value = false;
}

let unsubAuth = null;

onMounted(() => {
  unsubAuth = onAuthStateChanged(auth, async () => {
    await verificarAssinatura({ forceOpenModal: true });
  });

  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  if (unsubAuth) unsubAuth();
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleClickOutside);
});

// ✅ troca de rota -> abre se não tiver assinatura
watch(
  () => route.fullPath,
  async () => {
    await verificarAssinatura({ forceOpenModal: true });
  }
);
</script>




<style scoped>
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  height: 60px;
  background-color: #000000;
  color: #fff;
}

.header-esquerda {
  display: flex;
  align-items: center;
  gap: 20px;
}

.checkboxtoggler {
  width: 1.8em;
  display: flex;
  flex-direction: column;
  gap: 0.3em;
  cursor: pointer;
}

.line-1,
.line-2,
.line-3 {
  background: #00d1b2;
  height: 0.18em;
  border-radius: 10em;
  transition: 0.3s;
}

.checkboxtoggler.open .line-1 {
  transform: rotate(40deg) translate(0.2em, 0.3em);
}
.checkboxtoggler.open .line-2 {
  transform: rotate(-40deg) translate(0em, -0.1em);
}
.checkboxtoggler.open .line-3 {
  transform: scaleX(0);
  transform-origin: left;
}

.main-menu ul {
  display: flex;
  list-style: none;
  gap: 15px;
  margin: 0;
  padding: 0;
}

.main-menu ul li a {
  text-decoration: none;
  color: #fff;
  font-weight: 500;
  transition: 0.2s;
}

.main-menu ul li a:hover {
  color: #00d1b2;
}

.search-box {
  display: flex;
  align-items: center;
  background: #1c1c1c;
  border-radius: 30px;
  padding: 5px 10px;
  max-width: 320px;
  min-width: 300px;
  transition: all 0.3s ease;
}
.LoginAndRegister{
    text-decoration: none;
  color: #fff;
  font-weight: 500;
  transition: 0.2s;
  margin: 10px;

}
.LoginAndRegister:hover{
  color: #00d1b2;

}
.search-box .input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 14px;
  padding: 5px;
}

.search__icon {
  width: 20px;
  height: 20px;
  fill: #00d1b2;
  cursor: pointer;
  transition: 0.2s;
}
.search__icon:hover {
  fill: #fff;
}

@media (max-width: 950px) {
  .search-box {
    min-width: 40px;
    max-width: 40px;
    justify-content: center;
  }
  .search-box.active {
    min-width: 18rem;
    max-width: 220px;
  }
  .search-box .input {
    display: none;
  }
  .search-box.active .input {
    display: block;
  }
}

.header-direito {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-menu {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
}
.messages-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px; /* Limite de altura do modal */
  overflow-y: auto;  /* Scroll quando muitas mensagens */
}

.message-item {
  background-color: #1c1c1c;
  border-radius: 8px;
  padding: 10px 15px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: background 0.3s;
}

.message-item:hover {
  background-color: #00d1b2; /* Cor de destaque ao passar o mouse */
  color: #000;
}

.message-text {
  font-size: 14px;
  color: #fff;
  word-wrap: break-word;
}

.message-date {
  font-size: 11px;
  color: #888;
  text-align: right;
}

.user-name {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.user-indicator {
  position: absolute;
  top: 0;
  right: -6px;
  width: 8px;
  height: 8px;
  background: #00d1b2; 
  border-radius: 50%;
  border: 1px solid #111;
}

.user-menu .arrow {
  font-size: 10px;
}

.dropdown {
  position: absolute;
  top: 40px;
  right: 0;
  background: #222;
  border-radius: 8px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  min-width: 150px;
  z-index: 10;
}

.dropdown ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.dropdown ul li a {
  display: block;
  padding: 10px 15px;
  color: #fff;
  text-decoration: none;
  font-size: 12px;
}
.ativado{
  display: block;
  padding: 10px 15px;
  color: white;
  background-color: #00d1b2;
  text-decoration: none;
  font-size: 12px;
}
.dropdown ul li a:hover {
  background: #00d1b2;
}

.custom-drawer {
  background-color: #111 !important;
  color: #fff !important;
  padding: 15px 10px;
}

.drawer-subtitle {
  color: #888;
  font-size: 12px;
  font-weight: 600;
  margin: 10px 0 5px;
  letter-spacing: 1px;
}

.drawer-item {
  margin: 3px 0;
  border-radius: 8px;
  transition: background 0.3s, transform 0.2s;
}

.drawer-item a {
  display: block;
  padding: 10px 14px;
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s;
}

.drawer-item:hover {
  background: rgba(0, 209, 178, 0.12);
  transform: translateX(3px);
}
.drawer-item a:hover {
  color: #00d1b2;
}

.vip-link a {
  color: #ffd700;
  font-weight: 600;
}
.vip-link a:hover {
  color: #fff;
  background: rgba(255, 215, 0, 0.15);
}

.support-link a {
  color: #25D366;
  font-weight: 600;
}
.support-link a:hover {
  color: #fff;
  background: rgba(37, 211, 102, 0.15);
}
.premium-modal {
  border-radius: 22px;
  overflow: hidden;
  position: relative;
}

.premium-close {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 20;
}

/* GRID */
.premium-wrap {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  min-height: 460px;
}

/* LEFT */
.premium-left {
  background: linear-gradient(135deg, #00d7d2, #00c3be);
  color: white;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  text-align: left;
}

.premium-icon {
  width: 74px;
  height: 74px;
  border-radius: 18px;
  background: rgba(255,255,255,.15);
  display: grid;
  place-items: center;
}

.premium-title {
  font-size: 36px;
  font-weight: 800;
  margin: 0;
}

.premium-subtitle {
  opacity: .95;
  font-size: 15px;
  max-width: 260px;
}

.premium-badge {
  background: rgba(255,255,255,.18);
  padding: 8px 12px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
}

/* RIGHT */
.premium-right {
  padding: 40px 42px;
}

.premium-h1 {
  font-size: 28px;
  font-weight: 900;
}

.premium-desc {
  color: #475569;
  margin-top: 4px;
  margin-bottom: 18px;
}

.premium-steps {
  display: grid;
  gap: 16px;
  margin-bottom: 18px;
}

.premium-step {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
}

.step-num {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: rgba(0, 215, 210, .15);
  display: grid;
  place-items: center;
  font-weight: 800;
}

.step-title {
  font-weight: 800;
}

.step-sub {
  font-size: 13px;
  color: #64748b;
}

.premium-input-area {
  margin-top: 12px;
  margin-bottom: 12px;
}

/* AÇÕES */
.premium-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-wrap: wrap;
}

.premium-cancel {
  color: #64748b !important;
  font-weight: 900;
  border-radius: 12px;
  box-shadow: 0 12px 22px rgba(65, 212, 209, 0.28);
  align-items: center;
  width: 100%;
  margin-top: 1rem;
  background: #d1ffe2 !important;

}

.premium-buy {
  background: #25D366 !important;
  color: #fff !important;
  font-weight: 800;
  border-radius: 12px;
}

.premium-cta {
  background: linear-gradient(135deg, #00d7d2, #00b8b3);
  color: #0b1220 !important;
  font-weight: 900;
  border-radius: 12px;
  box-shadow: 0 12px 22px rgba(0, 215, 210, .28);
}

.premium-footer {
  margin-top: 14px;
  color: #94a3b8;
  text-align: center;
  font-size: 13px;
}

/* TRANSIÇÃO DO INPUT */
.fade-enter-active,
.fade-leave-active {
  transition: all .25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* RESPONSIVO */
@media (max-width: 860px) {
  .premium-wrap {
    grid-template-columns: 1fr;
  }
}

</style>
