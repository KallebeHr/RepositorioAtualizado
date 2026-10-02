<template>
 <section class="persistent-player" aria-label="Reprodutor de músicas" v-if="player.current || player.error">
  <div class="player-track"><img src="/Logo.png" alt="" width="44" height="44"><div><strong>{{player.current?.title || 'Reprodução'}}</strong><small>{{player.current?.cantor}}</small><span v-if="player.error" role="alert" class="error">{{player.error}}</span></div></div>
  <div class="player-controls">
   <button class="icon-button" @click="player.prev()" aria-label="Música anterior"><i class="mdi mdi-skip-previous"></i></button>
   <button class="play-button" @click="player.togglePlay()" :aria-label="player.isPlaying?'Pausar':'Reproduzir'" :disabled="player.loading"><i :class="`mdi mdi-${player.loading?'loading mdi-spin':player.isPlaying?'pause':'play'}`"></i></button>
   <button class="icon-button" @click="player.next()" aria-label="Próxima música"><i class="mdi mdi-skip-next"></i></button>
   <span>{{time(position)}}</span><input aria-label="Posição da música" type="range" min="0" :max="duration || 1" :value="position" @input="player.seekTo(Number($event.target.value))"><span>{{time(duration)}}</span>
  </div>
  <div class="player-tools"><button class="icon-button" @click="settings=true" aria-label="Abrir equalizador, fila e temporizador"><i class="mdi mdi-tune"></i></button><button class="icon-button" @click="handleDownload" aria-label="Baixar música"><i class="mdi mdi-download"></i></button></div>
 </section>
 <v-dialog v-model="settings" max-width="620" aria-label="Controles de reprodução">
  <v-card class="player-settings"><v-card-title class="dialog-title">Controles de reprodução <v-btn icon="mdi-close" variant="text" @click="settings=false" aria-label="Fechar controles"/></v-card-title><v-card-text>
   <label class="check"><input type="checkbox" v-model="player.autoContinue"> Continuar com músicas do mesmo gênero</label>
   <label>Encerrar reprodução<select @change="player.setSleep(Number($event.target.value))"><option value="0">Sem temporizador</option><option v-for="minutes in [15,30,45,60,90]" :value="minutes" :key="minutes">Em {{minutes}} minutos</option></select></label>
   <p v-if="player.sleepAt">Encerra às {{new Date(player.sleepAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}}</p>
   <label>Volume<input aria-label="Volume" type="range" min="0" max="1" step="0.01" :value="player.volume" @input="player.setVolume($event.target.value)"></label>
   <h3>Equalizador</h3><label class="check"><input type="checkbox" :checked="player.eq.enabled" @change="player.eqSetEnabled($event.target.checked)"> Ativar equalizador</label>
   <div class="eq-bands"><label v-for="b in player.eq.bands" :key="b.key">{{b.key}} Hz<input type="range" min="-12" max="12" :value="b.gain" :aria-label="`Ganho em ${b.key} Hz`" @input="player.eqSetBandGain(b.key,$event.target.value)"><small>{{b.gain}} dB</small></label></div><button class="secondary" @click="player.eqReset()">Restaurar bandas</button>
   <h3>Fila · {{player.queue.length}} músicas</h3><div class="queue-row" v-for="(track,index) in player.queue" :key="index"><button @click="player.play(index)" :aria-current="index===player.currentIndex?'true':undefined">{{track.title}} <small>{{track.cantor}}</small></button><button class="icon-button" @click="player.removeFromQueue(index)" :aria-label="`Remover ${track.title} da fila`"><i class="mdi mdi-close"></i></button></div>
   <div class="actions"><button class="secondary" @click="player.clearQueue()">Limpar fila</button><button class="primary" @click="handlePackage">Solicitar pacote da fila</button></div><p role="status">{{message}}</p>
   <p class="muted">O áudio pode continuar com a tela bloqueada nos dispositivos compatíveis. Fechar o navegador encerra a reprodução.</p>
  </v-card-text></v-card>
 </v-dialog>
</template>
<script setup>
import {ref,onMounted,onBeforeUnmount,watch} from 'vue'
import {usePlayerStore} from '@/stores/usePlayerStore'
import {useUserStore} from '@/stores/userStore'
import {downloadTrack,downloadPackage} from '@/services/api'
const player=usePlayerStore(),user=useUserStore(),settings=ref(false),message=ref(''),position=ref(0),duration=ref(0)
let interval
function time(v){return `${Math.floor(v/60)}:${String(Math.floor(v%60)).padStart(2,'0')}`}
async function handleDownload(){try{await downloadTrack(player.current)}catch(e){player.error=e.message}}
async function handlePackage(){try{const r=await downloadPackage(player.queue.map(t=>t.id));message.value=r.status==='ready'?'Download autorizado.':'Pedido registrado. Consulte o andamento em Minha conta.'}catch(e){message.value=e.message}}
watch(()=>user.hasActiveSubscription,value=>{if(!value)player.stop()})
onMounted(()=>{interval=setInterval(()=>{position.value=Number(player.sound?.seek() || 0);duration.value=player.sound?.duration() || 0;if('mediaSession' in navigator && duration.value>0)try{navigator.mediaSession.setPositionState({duration:duration.value,playbackRate:1,position:Math.min(position.value,duration.value)})}catch{}},1000)})
onBeforeUnmount(()=>clearInterval(interval))
</script>
