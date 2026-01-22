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
              <a :href="item.href" @click="test">{{ item.title }}</a>
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
              >📸 Instagram</a>
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
              <a href="https://wa.me/8695102595?text=Ol%C3%A1%2C%20quero%20mais%20informa%C3%A7%C3%B5es%20de%20suporte!%20" target="_blank">💬 Suporte WhatsApp</a>
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
                <a href="#" v-if="!assinaturaAtiva" @click.prevent="openAssinaturaModal">🔑 Ativar Assinatura</a>
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

    <!-- Modal Ativar Assinatura -->
    <v-dialog v-model="assinaturaModal" max-width="400px">
      <v-card>
        <v-card-title>Ativar Assinatura</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="chaveAssinatura"
            label="Digite sua chave"
            outlined
            dense
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="assinaturaModal = false">Cancelar</v-btn>
          <v-btn color="primary" @click="ativarAssinatura">Ativar</v-btn>
        </v-card-actions>
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
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useUserStore } from "@/stores/userStore";
import { useRouter } from "vue-router";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import {
  doc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  limit,
} from "firebase/firestore";
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
const userStore = useUserStore();

// assinatura
const assinaturaModal = ref(false);
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


// 🔥 FUNÇÃO CORRIGIDA — VERIFICA ASSINATURA E EXPIRAÇÃO
async function verificarAssinatura() {
  try {
    const user = auth.currentUser;

    if (!user) {
      assinaturaAtiva.value = false;
      return;
    }

    const email = (user.email || "").toLowerCase();

    const q = query(
      collection(db, "users"),
      where("email", "==", email),
      limit(1)
    );

    const snap = await getDocs(q);
    if (snap.empty) {
      assinaturaAtiva.value = false;
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

    // Se expirou → marcar automaticamente como inativa
    if (!aindaValida &&
        data.subscription === "ativa" &&
        endDate &&
        endDate <= now) {
      await setDoc(
        doc(db, "users", userDocSnap.id),
        { subscription: "inativa" },
        { merge: true }
      );
    }
  } catch (err) {
    console.error("Erro ao verificar assinatura:", err);
    assinaturaAtiva.value = false;
  }
}


// abrir modal assinatura
function openAssinaturaModal() {
  if (assinaturaAtiva.value) {
    $toast.info("Sua conta já está ativa!", { position: "top-center" });
    return;
  }
  assinaturaModal.value = true;
  chaveAssinatura.value = "";
}


// ativar assinatura
async function ativarAssinatura() {
  try {
    const user = auth.currentUser;
    if (!user) return $toast.error("Usuário não autenticado");

    const email = (user.email || "").toLowerCase();

    // busca direta com query
    const q = query(
      collection(db, "users"),
      where("email", "==", email),
      limit(1)
    );

    const usersSnapshot = await getDocs(q);
    if (usersSnapshot.empty) return $toast.error("Usuário não encontrado");

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (userData.subscription === "ativa") {
      assinaturaAtiva.value = true;
      assinaturaModal.value = false;
      return $toast.info("Já possui assinatura");
    }

    const querySnapshot = await getDocs(collection(db, "Chaves"));
    if (querySnapshot.empty) return $toast.error("Nenhuma chave encontrada!");

    const chaveDoc = querySnapshot.docs[0];
    const keys = chaveDoc.data().Keys || [];
    if (!keys.includes(chaveAssinatura.value))
      return $toast.error("Chave inválida!");

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

    assinaturaAtiva.value = true;
    assinaturaModal.value = false;

    $toast.success("Ativada com sucesso! A página será recarregada", {
      position: "top",
    });

    for (let i = 3; i > 0; i--) {
      $toast.info(`Recarregando em ${i}...`, { position: "top" });
      await new Promise((res) => setTimeout(res, 1000));
    }
    window.location.reload();
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

    const q = query(
      collection(db, "users"),
      where("email", "==", email),
      limit(1)
    );

    const usersSnapshot = await getDocs(q);
    if (usersSnapshot.empty) {
      $toast.error("Usuário não encontrado no Firestore", { position: "top" });
      loadingMessages.value = false;
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


// funções gerais
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
  if (
    dropdownOpen.value &&
    userRef.value &&
    !userRef.value.contains(event.target)
  )
    dropdownOpen.value = false;

  if (
    searchActive.value &&
    searchRef.value &&
    !searchRef.value.contains(event.target)
  )
    searchActive.value = false;
}

function handleResize() {
  const wasMobile = isMobile.value;
  isMobile.value = window.innerWidth <= 950;
  if (!isMobile.value && wasMobile) searchActive.value = false;
}


// 🚀 AUTENTICAÇÃO MONITORA E VERIFICA ASSINATURA AUTOMÁTICA
onMounted(() => {
  const unsub = onAuthStateChanged(auth, () => {
    verificarAssinatura();
  });

  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleClickOutside);

  onBeforeUnmount(() => unsub());
});
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
</style>
