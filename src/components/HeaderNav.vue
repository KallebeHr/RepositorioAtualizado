<template>
  <header class="header-container" ref="headerRef">
    <!-- Esquerda -->
    <div class="header-esquerda">

      <!-- Logo / Menu Toggle -->
      <div class="logo" @click="drawer = !drawer">
        <div class="checkboxtoggler" :class="{ open: drawer }">
          <div class="line-1"></div>
          <div class="line-2"></div>
          <div class="line-3"></div>
        </div>
      </div>

      <!-- Drawer Vuetify -->
      <v-navigation-drawer v-model="drawer" :location="$vuetify.display.mobile ? 'left' : undefined" temporary
        class="custom-drawer">
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

        <!-- CONFIGURAÇÕES -->
        <v-list>
          <v-list-subheader class="drawer-subtitle">CONFIGURAÇÕES</v-list-subheader>
          <v-list-item v-for="item in settingsItems" :key="item.title" class="drawer-item">
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
              <a href="https://instagram.com/seuapp" target="_blank">📸 Instagram</a>
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
              <a href="https://wa.me/5599999999999" target="_blank">💬 Suporte WhatsApp</a>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- Menu Principal -->
      <nav class="main-menu" v-if="!isMobile">
        <ul>
          <li><a href="/AllMusic">MÚSICAS E CANTORES</a></li>
          <li><a href="#">REPERTÓRIOS</a></li>
        </ul>
      </nav>

      <!-- Barra de Pesquisa -->
      <div class="search-box" :class="{ active: searchActive }" ref="searchRef">
        <input v-if="!isMobile || searchActive" ref="searchInputRef" class="input" type="text"
          placeholder="Buscar por Cantor, Música ou Repertório" />
        <svg viewBox="0 0 24 24" class="search__icon" @click="toggleSearch">
          <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 
               4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 
               5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 
               11c0-4.135 3.365-7.5 7.5-7.5s7.5 
               3.365 7.5 7.5-3.365 7.5-7.5 
               7.5-7.5-3.365-7.5-7.5z" />
        </svg>
      </div>
    </div>

    <!-- Direita -->
    <div class="header-direito">
      <!-- Usuário -->
      <div class="user-menu" ref="userRef" v-show="!(isMobile && searchActive)">
        <!-- Se usuário logado -->
        <template v-if="userStore.user">
<span class="user-name" @click.stop="toggleDropdown">
  <template v-if="!userStore.loadingUser">
    Olá, {{ userStore.user.name }}
  </template>
  <template v-else>
    Olá...
  </template>
  <span v-if="hasNotification" class="user-indicator"></span>
  <span class="arrow">▼</span>
</span>

          <!-- Dropdown -->
          <div v-if="dropdownOpen" class="dropdown">
            <ul>
              <li><a href="#">🛒 Meu Carrinho</a></li>
              <li v-if="userStore.user?.role === 'admin'">
                <a href="/admin"> ⚙   Administração</a>
              </li>
              <li><a href="#">🔑 Versão Premium</a></li>
              <li><a href="#">🔔 Notificações</a></li>
              <li><a href="#" @click.prevent="logout">🚪 Sair</a></li>
            </ul>
          </div>
        </template>

        <!-- Se usuário não logado -->
        <template v-else>
          <span class="auth-links">
            <a href="#" class="LoginAndRegister" @click.prevent="goToAuth('login')">ENTRAR</a>
            <a href="#" class="LoginAndRegister" @click.prevent="goToAuth('register')">REGISTRAR</a>
          </span>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useUserStore } from "@/stores/userStore";
import { useRouter } from "vue-router";
import { signOut } from "firebase/auth"
import { auth } from "@/firebase"

const dropdownOpen = ref(false);
const hasNotification = ref(true);
const drawer = ref(false);

const searchActive = ref(false);
const isMobile = ref(window.innerWidth <= 950);

const searchRef = ref(null);
const searchInputRef = ref(null);
const userRef = ref(null);
const headerRef = ref(null);

const router = useRouter();
const userStore = useUserStore();

const menuItems = [
  {title:"INICIO", href:"/"},
  { title: "MÚSICAS", href: "#" },
  { title: "CANTORES", href: "#" },
  { title: "REPERTÓRIOS", href: "#" },
  { title: "RITMOS", href: "#" },
  { title: "PLAYLISTS", href: "#" },
  { title: "EM ALTA", href: "#" },
];

const libraryItems = [
  { title: "FAVORITOS", href: "#" },
  { title: "RECENTES", href: "#" },
  { title: "LOCAL (BAIXADAS)", href: "#" },
  { title: "MINHAS PLAYLISTS", href: "#" },
];

const settingsItems = [
  { title: "PERFIL", href: "#" },
  { title: "NOTIFICAÇÕES", href: "#" },
  { title: "ASSINATURAS", href: "#" },
  { title: "CONFIGURAÇÕES", href: "#" },
];

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function toggleSearch() {
  if (!isMobile.value) return;
  searchActive.value = !searchActive.value;
  if (searchActive.value) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
}
async function logout() {
  handleLogout()
  try {
    await signOut(auth)
    userStore.clearUser()  // limpa o estado do Pinia
    window.location.href = "/"  // recarrega a página
  } catch (err) {
    console.error("Erro ao sair:", err)
  }
}
function goToAuth(mode) {
  router.push({ path: '/RegisterAndLogin', query: { mode } })
}

async function handleLogout() {
  await userStore.logout();
  dropdownOpen.value = false;
}

// Fecha dropdown e search ao clicar fora
function handleClickOutside(event) {
  // fecha dropdown do usuário
  if (
    dropdownOpen.value &&
    userRef.value &&
    !userRef.value.contains(event.target)
  ) {
    dropdownOpen.value = false;
  }

  // fecha a busca expandida no mobile
  if (
    searchActive.value &&
    searchRef.value &&
    !searchRef.value.contains(event.target)
  ) {
    searchActive.value = false;
  }
}

function handleResize() {
  const wasMobile = isMobile.value;
  isMobile.value = window.innerWidth <= 950;
  // ao voltar para desktop, garante input normal
  if (!isMobile.value && wasMobile) {
    searchActive.value = false;
  }
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleClickOutside);
});
</script>


<style scoped>
/* HEADER */
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

/* TOGGLER MENU */
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

/* Animação do hamburger aberto */
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

/* MENU */
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

/* SEARCH BOX */
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

/* MOBILE SEARCH (lupa -> expandir) */
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

/* DIREITA */
.header-direito {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* USER MENU */
.user-menu {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
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

/* Dropdown */
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

.dropdown ul li a:hover {
  background: #00d1b2;
}

/* Drawer */
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

/* Links especiais */
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
