<template>
 <v-app class="repertorio-app">
  <HeaderNav />
  <AppInstall />
  <router-link class="news-banner" to="/Novidades"><span><i aria-hidden="true" class="mdi mdi-sparkles"/> Novidades e adicionais</span><span>Equalizador por código · Consulte o suporte <i aria-hidden="true" class="mdi mdi-arrow-right"/></span></router-link>
  <nav class="library-nav" aria-label="Minha biblioteca"><router-link to="/Playlists"><i class="mdi mdi-playlist-music"/>Playlists</router-link><router-link to="/Historico"><i class="mdi mdi-history"/>Histórico</router-link><router-link to="/Downloads"><i class="mdi mdi-download"/>Downloads</router-link><router-link to="/Seguindo"><i class="mdi mdi-account-heart-outline"/>Seguindo</router-link><router-link to="/Pastas"><i class="mdi mdi-folder-music-outline"/>Pastas</router-link></nav>
  <div class="app-content"><router-view /></div>
  <buttonW />
  <FooterComplete />
  <MusicPlayer />
  <GlobalEqualizer />
  <PlaylistPicker />
  <DownloadsHub />
  <FeatureNotice />
  <EqualizerActivation />
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
import FeatureNotice from '@/components/FeatureNotice.vue'
import EqualizerActivation from '@/components/EqualizerActivation.vue'
import { useAddonStore } from '@/stores/useAddonStore'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { startDevicePresence } from '@/services/devices'
const user=useUserStore(),library=useLibraryStore(),downloads=useDownloadStore()
const addons=useAddonStore(),player=usePlayerStore()
let stopPresence
watch(()=>user.user?.uid,uid=>{stopPresence?.();stopPresence=startDevicePresence(uid,()=>player.isPlaying)},{immediate:true})
watch(()=>addons.canEqualize,()=>player._applyEq())
watch(()=>user.user?.uid,uid=>{library.init(uid);downloads.init(uid)},{immediate:true})
watch(()=>user.hasActiveSubscription,active=>{if(!active)downloads.pauseAll()})
const online=()=>library.flush(),offline=()=>downloads.pauseAll()
onMounted(()=>{window.addEventListener('online',online);window.addEventListener('offline',offline)})
onBeforeUnmount(()=>{stopPresence?.();window.removeEventListener('online',online);window.removeEventListener('offline',offline)})
</script>
<style>html,body,#app{background:#101010}.repertorio-app{background:#101010!important}.app-content{min-height:60vh;padding-bottom:100px}button:focus-visible,a:focus-visible{outline:2px solid #5ee4a0;outline-offset:3px}</style>

<style>.library-nav{display:flex;justify-content:center;gap:8px;padding:8px 12px;background:#101812;overflow-x:auto}.library-nav a{display:flex;align-items:center;gap:7px;color:#aac8b6;text-decoration:none;min-height:44px;padding:8px 14px;border-radius:10px;white-space:nowrap;font-size:13px}.library-nav a.router-link-active{background:#1c3728;color:#baffd6}.library-nav a:hover{background:#202e24}.library-nav i{font-size:20px}@media(max-width:600px){.library-nav{justify-content:flex-start}.library-nav a{padding:8px 12px}}</style>

<style>.news-banner{display:flex;align-items:center;justify-content:center;gap:24px;padding:12px 16px;background:#193323;color:#c5f2d7;text-decoration:none;font-size:12px;border-bottom:1px solid #31523c}.news-banner span{display:flex;align-items:center;gap:7px}.news-banner span:first-child{font-weight:700;color:#90edb4}.news-banner .mdi{font-size:17px}@media(max-width:600px){.news-banner{gap:5px;align-items:flex-start;flex-direction:column;font-size:10px}.news-banner span:first-child{font-size:12px}}</style>
