<template>
 <v-app class="repertorio-app">
  <HeaderNav />
  <AppInstall />
  <nav class="library-nav" aria-label="Minha biblioteca"><router-link to="/Playlists"><i class="mdi mdi-playlist-music"/>Playlists</router-link><router-link to="/Historico"><i class="mdi mdi-history"/>Histórico</router-link><router-link to="/Downloads"><i class="mdi mdi-download"/>Downloads</router-link><router-link to="/Seguindo"><i class="mdi mdi-account-heart-outline"/>Seguindo</router-link><router-link to="/Pastas"><i class="mdi mdi-folder-music-outline"/>Pastas</router-link></nav>
  <div class="app-content"><router-view /></div>
  <buttonW />
  <FooterComplete />
  <MusicPlayer />
  <GlobalEqualizer />
  <PlaylistPicker />
  <DownloadsHub />
 </v-app>
</template>
<script setup>
import { watch, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useLibraryStore } from '@/stores/useLibraryStore'
import { useDownloadStore } from '@/stores/useDownloadStore'
import PlaylistPicker from '@/components/PlaylistPicker.vue'
import DownloadsHub from '@/components/DownloadsHub.vue'
import '@/assets/library.css'
import MusicPlayer from '@/components/MusicPlayer.vue'
import GlobalEqualizer from '@/components/GlobalEqualizer.vue'
import AppInstall from '@/components/AppInstall.vue'
const user=useUserStore(),library=useLibraryStore(),downloads=useDownloadStore()
watch(()=>user.user?.uid,uid=>{library.init(uid);downloads.init(uid)},{immediate:true})
watch(()=>user.hasActiveSubscription,active=>{if(!active)downloads.pauseAll()})
const online=()=>library.flush(),offline=()=>downloads.pauseAll()
onMounted(()=>{window.addEventListener('online',online);window.addEventListener('offline',offline)})
onBeforeUnmount(()=>{window.removeEventListener('online',online);window.removeEventListener('offline',offline)})
</script>
<style>html,body,#app{background:#101010}.repertorio-app{background:#101010!important}.app-content{min-height:60vh;padding-bottom:100px}button:focus-visible,a:focus-visible{outline:2px solid #5ee4a0;outline-offset:3px}</style>

<style>.library-nav{display:flex;justify-content:center;gap:8px;padding:8px 12px;background:#101812;overflow-x:auto}.library-nav a{display:flex;align-items:center;gap:7px;color:#aac8b6;text-decoration:none;min-height:44px;padding:8px 14px;border-radius:10px;white-space:nowrap;font-size:13px}.library-nav a.router-link-active{background:#1c3728;color:#baffd6}.library-nav a:hover{background:#202e24}.library-nav i{font-size:20px}@media(max-width:600px){.library-nav{justify-content:flex-start}.library-nav a{padding:8px 12px}}</style>