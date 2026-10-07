<template>
 <nav class="app-tools" aria-label="Aplicativo e áudio">
  <div class="app-tools-intro"><strong>Seu repertório, sempre com você</strong><span :class="{disconnected:!online}"><i class="mdi" :class="online?'mdi-wifi':'mdi-wifi-off'" aria-hidden="true"/> {{ online?'Conectado':'Sem internet' }}</span></div>
  <div class="app-tool-actions">
   <button class="install-action" @click="requestInstallation"><i class="mdi mdi-cellphone-arrow-down" aria-hidden="true"/><span>{{ appInstalled?'App instalado':'Instalar app' }}</span></button>
   <router-link to="/Offline" title="Biblioteca offline"><i class="mdi mdi-cloud-download-outline" aria-hidden="true"/><span>Ouvir offline</span></router-link>
   <button @click="player.eqOpen=true" aria-label="Abrir equalizador pela barra"><i class="mdi mdi-tune-vertical" aria-hidden="true"/><span>Equalizador</span></button>
   <button v-if="updateAvailable" class="update-action" :disabled="player.isPlaying" @click="applyUpdate">{{ player.isPlaying?'Pause para atualizar':'Atualizar app' }}</button>
  </div>
 </nav>
 <v-dialog v-model="installDialogOpen" max-width="560" :z-index="15000" aria-labelledby="install-title">
  <section class="install-dialog">
   <div class="install-heading"><img src="/icons/icon-192.png" alt=""/><div><span>REPERTÓRIO ATUALIZADO</span><h2 id="install-title">{{ appInstalled?'Seu aplicativo está instalado':'Instale o aplicativo' }}</h2></div><button class="close-install" @click="installDialogOpen=false" aria-label="Fechar instalação"><i class="mdi mdi-close"/></button></div>
   <p>Abra pelo ícone do seu aparelho e leve suas músicas com você. Salve os áudios antes de ficar sem internet.</p>
   <button v-if="installPrompt && !appInstalled" class="install-now" @click="installApp" :disabled="installBusy">{{ installBusy?'Abrindo instalação…':'Instalar agora' }}</button>
   <p v-if="installMessage" role="status" class="install-status">{{ installMessage }}</p>
   <div v-if="!appInstalled" class="install-instructions">
    <p v-if="platform.embedded" class="embedded-notice">Este navegador está dentro de outro aplicativo. Abra o endereço no Safari, no iPhone, ou no Chrome, no Android, para instalar.</p>
    <template v-if="platform.ios">
     <h3>No iPhone ou iPad</h3>
     <p class="platform-explanation">A instalação no iPhone é feita pelo menu de Compartilhar. Siga estes passos:</p>
     <ol><li>Abra este endereço no <strong>Safari</strong>.</li><li>Toque em <strong>Compartilhar</strong> <i class="mdi mdi-tray-arrow-up" aria-hidden="true"/> (quadrado com seta para cima). Em alguns layouts, fica no menu <strong>…</strong>.</li><li>Role as opções e escolha <strong>Adicionar à Tela de Início</strong>.</li><li>Se aparecer <strong>Abrir como App Web</strong>, mantenha ativado. Toque em <strong>Adicionar</strong>.</li></ol>
     <p>Não encontrou a opção? No final do menu Compartilhar, toque em <strong>Editar Ações</strong> e adicione <strong>Adicionar à Tela de Início</strong>.</p>
    </template>
    <template v-else-if="platform.android">
     <h3>No Android</h3>
     <p class="platform-explanation">Use Instalar agora quando aparecer. Você também pode instalar pelo menu do Chrome:</p>
     <ol><li>Abra este endereço no <strong>Chrome</strong>.</li><li>Toque no menu <strong>⋮</strong>, no canto superior.</li><li>Escolha <strong>Adicionar à tela inicial</strong> ou <strong>Instalar aplicativo</strong>.</li><li>Se houver a opção <strong>Instalar</strong>, escolha-a e confirme.</li></ol>
     <p>Se a opção não aparecer, use uma aba normal do Chrome, fora do modo anônimo, e aguarde o site terminar de carregar.</p>
    </template>
    <template v-else><h3>No computador</h3><ol><li>Abra no Chrome ou Edge.</li><li>Use <strong>Instalar agora</strong>, quando disponível, ou abra o menu do navegador.</li><li>Escolha <strong>Instalar aplicativo</strong>.</li></ol></template>
   </div>
   <div v-if="!appInstalled && (platform.ios || platform.android || platform.embedded)" class="install-link">
    <label for="install-url">Endereço para abrir no navegador do aparelho</label>
    <input id="install-url" :value="installUrl" readonly @focus="$event.target.select()"/>
    <button @click="copyInstallLink"><i class="mdi mdi-content-copy" aria-hidden="true"/> Copiar endereço do aplicativo</button>
    <p v-if="copyMessage" role="status">{{ copyMessage }}</p>
   </div>
   <p v-if="development || !secure" class="install-notice">Para instalar no celular e abrir sem internet, acesse o site publicado em HTTPS: www.repertorioatualizado.com.br.</p>
   <p v-else-if="pwaError" class="install-notice" role="alert">{{ pwaError }}</p>
   <p v-else class="install-status">{{ pwaReady?'Aplicativo preparado para abrir offline.':'Preparando o aplicativo. Mantenha a conexão por alguns instantes.' }}</p>
   <router-link class="open-offline" to="/Offline" @click="installDialogOpen=false"><i class="mdi mdi-cloud-download-outline"/> Abrir biblioteca offline</router-link>
  </section>
 </v-dialog>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { appInstalled, updateAvailable, installPrompt, installDialogOpen, installBusy, installMessage, pwaReady, pwaError, installApp, requestInstallation, applyUpdate } from '@/services/pwa'
import { usePlayerStore } from '@/stores/usePlayerStore'
import { installationPlatform } from '@/utils/pwa-platform.mjs'
const player = usePlayerStore(), online = ref(navigator.onLine), development = import.meta.env.DEV
const platform = installationPlatform(navigator), secure = window.isSecureContext
const installUrl = location.protocol === 'https:' ? location.origin + '/' : 'https://www.repertorioatualizado.com.br/'
const copyMessage = ref('')
async function copyInstallLink() {
 try { await navigator.clipboard.writeText(installUrl); copyMessage.value = 'Endereço copiado. Abra-o no navegador do aparelho.' }
 catch { copyMessage.value = 'Toque no endereço acima, selecione e copie para abrir no navegador do aparelho.' }
}
function connection(){online.value=navigator.onLine}
onMounted(()=>{window.addEventListener('online',connection);window.addEventListener('offline',connection)})
onBeforeUnmount(()=>{window.removeEventListener('online',connection);window.removeEventListener('offline',connection)})
</script>
<style scoped>
.app-tools{position:sticky;top:0;z-index:900;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 22px;background:#12221bd9;backdrop-filter:blur(16px);border-bottom:1px solid #345443;color:#e8f9ee}
.app-tools-intro{display:flex;flex-direction:column;gap:3px}.app-tools-intro strong{font-size:14px}.app-tools-intro>span{font-size:11px;color:#9ddbb6}.app-tools-intro .disconnected{color:#ffc47e}.app-tool-actions{display:flex;gap:9px;align-items:stretch}
.app-tool-actions button,.app-tool-actions a{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:9px 14px;background:#233b2e;color:#e8f9ee;border:1px solid #466952;border-radius:12px;font-size:13px;font-weight:650;text-decoration:none;cursor:pointer;white-space:nowrap}.app-tool-actions .install-action{background:#66e5a1;color:#092016;border-color:#66e5a1}.mdi{font-size:21px}.app-tool-actions button:disabled{opacity:.55;cursor:default}
.install-dialog{padding:26px;background:#122019;color:#e8f9ee;border:1px solid #42694f;border-radius:20px;max-height:85dvh;overflow:auto}.install-heading{display:flex;gap:12px;align-items:center}.install-heading img{width:58px;height:58px;border-radius:14px}.install-heading>div{flex:1;min-width:0}.install-heading span{font-size:10px;color:#83d9a6;letter-spacing:.1em}.install-heading h2{font-size:23px;line-height:1.2;margin-top:5px}.close-install{min-width:44px;min-height:44px;background:#22372b;border-radius:12px;color:#e8f9ee}.install-dialog p{font-size:14px;line-height:1.6;margin:18px 0;color:#c1d7c9}.install-instructions{padding:16px;background:#1c3124;border-radius:14px}.install-instructions h3{font-size:15px}.install-instructions ol{padding-left:20px;margin-top:10px;font-size:14px;line-height:1.6}.install-instructions li+li{margin-top:6px}.install-instructions p{font-size:12px;margin-bottom:0}.install-now,.open-offline{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;min-height:46px;background:#66e5a1;color:#092016;border-radius:12px;font-weight:700;text-decoration:none;padding:12px;cursor:pointer}.install-now:disabled{opacity:.6}.install-dialog .install-notice{padding:12px;border:1px solid #836735;border-radius:12px;color:#ffdb98}.install-dialog .install-status{color:#9be8ba}
.install-instructions .platform-explanation{margin:10px 0;font-size:13px}.install-instructions .embedded-notice{margin:0 0 15px;padding:10px;border:1px solid #c6a35e;border-radius:8px;color:#ffdb98}.install-instructions li .mdi{font-size:18px;vertical-align:middle}.install-link{margin:18px 0;padding:14px;border:1px solid #42694f;border-radius:12px}.install-link label{display:block;font-size:12px;margin-bottom:9px}.install-link input{width:100%;padding:10px;background:#09140e;border:1px solid #42694f;border-radius:8px;color:#ccecd7;font-size:12px}.install-link button{width:100%;min-height:44px;margin-top:10px;background:#284d37;border:1px solid #6da983;border-radius:10px;color:#e8f9ee;font-size:13px}.install-link p{font-size:12px;margin:9px 0 0}
@media(max-width:700px){.app-tools{padding:10px 12px;display:block}.app-tools-intro{flex-direction:row;justify-content:space-between;gap:8px;margin-bottom:9px}.app-tools-intro strong{font-size:11px}.app-tool-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.app-tool-actions button,.app-tool-actions a{padding:8px 4px;font-size:11px;gap:4px;flex-direction:column;white-space:normal;min-height:57px}.app-tool-actions .update-action{grid-column:1/-1;min-height:44px}.install-dialog{padding:18px}.install-heading h2{font-size:20px}}
</style>
