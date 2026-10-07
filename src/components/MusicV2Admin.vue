<template><section class="manage-v2"><h2>Catálogo V2 publicado</h2><v-btn @click="reload">Atualizar músicas V2</v-btn><p v-if="error" role="alert">{{ error }}</p><p>Ocultar não apaga o áudio e não afeta músicas antigas nem cópias já salvas offline.</p><article v-for="track in tracks" :key="track.id"><v-text-field v-model="track.title" label="Título"/><v-text-field v-model="track.cantor" label="Cantor"/><v-text-field v-model="track.genreText" label="Gêneros"/><p>{{ track.fileName }} · {{ track.published?'Publicada':'Oculta' }}</p><v-btn @click="save(track)" :disabled="busy">Salvar informações</v-btn><v-btn @click="visibility(track)" :disabled="busy">{{ track.published?'Ocultar':'Publicar novamente' }}</v-btn></article><v-btn v-if="cursor" @click="loadMore" :disabled="busy">Carregar mais músicas V2</v-btn></section></template>
<script setup>
import {ref,onMounted,onBeforeUnmount} from 'vue'
import {v2Request} from '@/services/v2'
const tracks=ref([]),error=ref(''),busy=ref(false),cursor=ref(null)
async function reload(){try{const data=await v2Request('admin-music');tracks.value=data.tracks.map(t=>({...t,genreText:(t.estilos||[]).join(', ')}));cursor.value=data.nextCursor;error.value=''}catch(e){error.value=e.message}}
async function loadMore(){if(busy.value)return;busy.value=true;try{const data=await v2Request('admin-music',{query:{cursor:cursor.value}});tracks.value=[...new Map([...tracks.value,...data.tracks.map(t=>({...t,genreText:(t.estilos||[]).join(', ')}))].map(t=>[t.id,t])).values()];cursor.value=data.nextCursor}catch(e){error.value=e.message}finally{busy.value=false}}
async function execute(fn){if(busy.value)return;busy.value=true;error.value='';try{await fn();await reload()}catch(e){error.value=e.message}finally{busy.value=false}}
const save=t=>execute(()=>v2Request('music-edit',{method:'POST',body:{id:t.id,title:t.title,cantor:t.cantor,estilos:t.genreText}}))
const visibility=t=>execute(()=>v2Request('music-status',{method:'POST',body:{id:t.id,published:!t.published}}))
onMounted(()=>{reload();window.addEventListener('repertorio:v2-catalog-change',reload)})
onBeforeUnmount(()=>window.removeEventListener('repertorio:v2-catalog-change',reload))
</script>
<style scoped>.manage-v2{width:min(100%,1000px);padding:24px;border:1px solid #333;border-radius:14px;background:#1a1a1a;color:#fff;margin:20px auto}.manage-v2 h2{margin-bottom:16px}.manage-v2 p{margin:12px 0}.manage-v2 article{padding:16px;border:1px solid #444;border-radius:10px;margin:16px 0}</style>
