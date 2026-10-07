<template>
 <section class="keys-page"><h1>Chaves de acesso</h1><p>Defina quantas contas podem ativar cada chave e por quanto tempo. Chaves novas: uma ativação por conta. Chaves antigas importadas permitem renovar após expirar.</p>
  <p v-if="error" role="alert" class="error">{{ error }}</p><p v-if="message" role="status">{{ message }}</p>
  <div class="key-form"><label>Ativações<select v-model="unlimited"><option :value="true">Ilimitadas</option><option :value="false">Limitadas</option></select></label><label v-if="!unlimited">Máximo de contas<input v-model.number="maximum" type="number" min="1" max="1000000"/></label><label>Duração<select v-model="lifetime"><option :value="false">Por dias</option><option :value="true">Vitalício</option></select></label><label v-if="!lifetime">Dias de acesso<input v-model.number="days" type="number" min="1" max="36500"/></label><label>Chave manual (opcional)<input v-model="manual" placeholder="Vazio para gerar uma chave segura" maxlength="120"/></label><button @click="create" :disabled="busy">{{ busy?'Aguarde…':'Criar chave' }}</button></div>
  <div class="tools"><button @click="load(true)" :disabled="busy">Atualizar</button><button @click="importOld" :disabled="busy">Importar chaves antigas</button></div><p class="note">A importação preserva os códigos antigos, com 30 dias e ativações ilimitadas. Não apaga a coleção Chaves.</p>
  <article v-for="key in keys" :key="key.id"><div><code>{{ key.code }}</code><p>{{ key.activationCount }} / {{ key.maxActivations===null?'ilimitadas':key.maxActivations }} ativações · {{ key.lifetime?'Vitalício':key.durationDays+' dias' }} · {{ key.active?'Ativa':'Desativada' }}</p></div><button @click="copy(key.code)">Copiar</button><button @click="toggle(key)" :disabled="busy">{{ key.active?'Desativar':'Reativar' }}</button></article><button v-if="more" @click="load(false)" :disabled="busy">Carregar mais chaves</button>
 </section>
</template>
<script setup>
import { ref,onMounted } from 'vue'
import {createAccessKey,listAccessKeys,setKeyActive,importLegacyKeys} from '@/services/access-keys'
const keys=ref([]),manual=ref(''),unlimited=ref(true),maximum=ref(1),lifetime=ref(false),days=ref(30),error=ref(''),message=ref(''),busy=ref(false),more=ref(false)
let cursor=null
async function load(reset=true){busy.value=true;error.value='';try{const data=await listAccessKeys(reset?null:cursor);keys.value=reset?data.keys:[...keys.value,...data.keys];cursor=data.cursor;more.value=data.more}catch(e){error.value=e.message}finally{busy.value=false}}
async function create(){busy.value=true;error.value='';try{const code=await createAccessKey(manual.value||crypto.randomUUID(),{maxActivations:unlimited.value?null:maximum.value,lifetime:lifetime.value,durationDays:days.value});manual.value='';message.value='Chave criada: '+code;await load(true)}catch(e){error.value=e.message}finally{busy.value=false}}
async function toggle(key){busy.value=true;try{await setKeyActive(key.id,!key.active);key.active=!key.active}catch(e){error.value=e.message}finally{busy.value=false}}
async function copy(code){try{await navigator.clipboard.writeText(code);message.value='Chave copiada.'}catch{message.value='Selecione e copie o código exibido.'}}
async function importOld(){busy.value=true;error.value='';try{message.value=`${await importLegacyKeys()} chaves antigas importadas.`;await load(true)}catch(e){error.value=e.message}finally{busy.value=false}}
onMounted(()=>load(true))
</script>
<style scoped>.keys-page{width:min(100%,1100px);color:#eefaf3;padding:24px}h1{font-size:28px}p{color:#adc0b4;margin:12px 0}.key-form,.tools{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}label{display:grid;gap:6px;font-size:13px}input,select,button{background:#20372b;color:white;padding:11px;border:1px solid #40604b;border-radius:10px}button{cursor:pointer}article{display:flex;gap:10px;align-items:center;border-bottom:1px solid #2d4436;padding:18px 0}article>div{flex:1;min-width:0}code{overflow-wrap:anywhere;font-size:16px}.error{color:#ffa6a6}.note{font-size:12px}button:disabled{opacity:.5}</style>
