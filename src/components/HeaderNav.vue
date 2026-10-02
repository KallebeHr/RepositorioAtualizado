<template>
 <header class="site-header">
  <router-link to="/" class="brand"><img src="/Logo.png" alt="" width="38" height="38"><span>REPERTÓRIO<small>ATUALIZADO</small></span></router-link>
  <button class="icon-button menu-toggle" @click="open=!open" :aria-expanded="open" aria-controls="main-nav" :aria-label="open?'Fechar menu':'Abrir menu'"><i :class="`mdi mdi-${open?'close':'menu'}`"></i></button>
  <nav id="main-nav" :class="{open}" aria-label="Navegação principal">
   <router-link v-for="item in links" :key="item.to" :to="item.to" @click="open=false">{{item.title}}</router-link>
   <router-link v-if="user.user?.role==='admin'" to="/admin" @click="open=false">Administração</router-link>
  </nav>
  <router-link :to="user.user?'/Conta':'/RegisterAndLogin?mode=login'" class="account-link"><i class="mdi mdi-account-circle-outline"></i><span>{{user.user?'Minha conta':'Entrar'}}</span></router-link>
 </header>
</template>
<script setup>
import {ref,watch} from 'vue'
import {useRoute} from 'vue-router'
import {useUserStore} from '@/stores/userStore'
const user=useUserStore(),route=useRoute(),open=ref(false)
const links=[{title:'Músicas',to:'/AllMusic'},{title:'Cantores',to:'/Cantores'},{title:'Gêneros',to:'/Pastas'},{title:'Novidades',to:'/Repertorios'},{title:'Minha biblioteca',to:'/Biblioteca'}]
watch(()=>route.fullPath,()=>open.value=false)
</script>
