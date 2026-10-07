<template>
 <section class="keys-v2">
  <h2>Chaves e acessos V2</h2><p>Chaves novas com controle de uso. Chaves e assinaturas antigas ficam preservadas na seção abaixo.</p>
  <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert><v-alert v-if="message" type="success" variant="tonal">{{ message }}</v-alert>
  <div class="fields"><v-text-field v-model="label" label="Identificação do lote"/><v-text-field v-model.number="quantity" type="number" min="1" max="100" label="Quantidade (até 100)"/><v-text-field v-model.number="days" type="number" min="1" :disabled="lifetime" label="Dias de acesso"/><v-text-field v-model.number="maxActivations" type="number" min="1" :disabled="unlimited" label="Ativações por chave"/><v-text-field v-model="expiresAt" type="datetime-local" label="Prazo para usar a chave (opcional)"/></div>
  <v-switch v-model="unlimited" label="Ativações ilimitadas — uma vez por conta" color="green"/><v-switch v-model="lifetime" label="Acesso vitalício — sem vencimento" color="green"/>
  <v-btn color="green" @click="generate" :disabled="busy">Gerar chaves únicas</v-btn><v-btn @click="reload" :disabled="busy">Atualizar</v-btn><v-btn @click="exportCsv" :disabled="!keys.length">Exportar chaves carregadas</v-btn>
  <input class="search" v-model="search" placeholder="Buscar chave ou identificação" aria-label="Pesquisar chaves V2"/>
  <p>{{ keys.length }} chaves recentes carregadas. Desativar uma chave impede novas ativações; os acessos já concedidos continuam.</p>
  <div v-for="item in filtered" :key="item.id" class="key-card"><code>{{ item.code }}</code><p>{{ item.label || 'Sem identificação' }} · {{ item.active?'Ativa':'Desativada' }} · {{ item.activationCount }}/{{ item.maxActivations===null?'ilimitadas':item.maxActivations }} ativações · {{ item.lifetime?'Vitalício':item.durationDays+' dias' }}</p><p v-if="item.expiresAt">Usar até {{ new Date(item.expiresAt).toLocaleString('pt-BR') }}</p><v-btn size="small" @click="copy(item.code)">Copiar</v-btn><v-btn size="small" @click="toggle(item)" :disabled="busy">{{ item.active?'Desativar':'Reativar' }}</v-btn></div>
  <v-btn v-if="keyCursor" @click="loadMore" :disabled="busy">Carregar mais chaves</v-btn>
  <h3>Acesso V2 de uma conta</h3><p>Esta ação altera somente accessV2 e não cancela a assinatura antiga do usuário.</p>
  <v-btn @click="loadUsers(false)" :disabled="busy">Carregar usuários</v-btn><input class="search" v-model="userSearch" placeholder="Buscar nos usuários carregados" aria-label="Pesquisar usuários"/><p v-for="u in filteredUsers" :key="u.uid">{{ u.name || u.email }} · {{ u.email }} · <code>{{ u.uid }}</code> <v-btn size="small" @click="targetUid=u.uid">Selecionar</v-btn></p><v-btn v-if="userCursor" @click="loadUsers(true)" :disabled="busy">Carregar mais usuários</v-btn>
  <v-text-field v-model="targetUid" label="UID do usuário"/><v-text-field v-model.number="grantDays" type="number" min="1" label="Dias adicionais"/><v-switch v-model="grantLifetime" label="Conceder acesso V2 vitalício" color="green"/>
  <v-btn @click="grant(false)" :disabled="busy || !targetUid">Conceder acesso V2</v-btn><v-btn @click="grant(true)" :disabled="busy || !targetUid">Revogar somente acesso V2</v-btn>
  <v-btn @click="loadAudit" :disabled="busy">Histórico V2</v-btn><ul><li v-for="event in events" :key="event.id">{{ new Date(event.at).toLocaleString('pt-BR') }} · {{ event.type }} · {{ event.targetUid || event.uid }}</li></ul>
 </section>
</template>
<script setup>
import {ref,computed,onMounted} from 'vue'
import {v2Request} from '@/services/v2'
const label=ref(''),quantity=ref(10),days=ref(30),maxActivations=ref(1),unlimited=ref(false),lifetime=ref(false),expiresAt=ref(''),keys=ref([]),events=ref([]),search=ref(''),busy=ref(false),error=ref(''),message=ref(''),targetUid=ref(''),grantDays=ref(30),grantLifetime=ref(false)
const keyCursor=ref(null),users=ref([]),userCursor=ref(null),userSearch=ref('')
const filteredUsers=computed(()=>users.value.filter(u=>`${u.name} ${u.email} ${u.uid}`.toLowerCase().includes(userSearch.value.toLowerCase())))
let requestId=null
const filtered=computed(()=>keys.value.filter(k=>`${k.code} ${k.label}`.toLowerCase().includes(search.value.toLowerCase())))
async function perform(fn){if(busy.value)return;busy.value=true;error.value='';try{await fn()}catch(e){error.value=e.message}finally{busy.value=false}}
async function reload(){try{const data=await v2Request('list-keys');keys.value=data.keys;keyCursor.value=data.nextCursor}catch(e){error.value=e.message}}
function loadMore(){return perform(async()=>{const data=await v2Request('list-keys',{query:{cursor:keyCursor.value}});keys.value=[...new Map([...keys.value,...data.keys].map(k=>[k.id,k])).values()];keyCursor.value=data.nextCursor})}
function loadUsers(more){return perform(async()=>{const data=await v2Request('list-users',{query:more?{cursor:userCursor.value}:{}});users.value=more?[...new Map([...users.value,...data.users].map(u=>[u.uid,u])).values()]:data.users;userCursor.value=data.nextCursor})}
function generate(){return perform(async()=>{requestId ||= crypto.randomUUID();const data=await v2Request('create-keys',{method:'POST',body:{requestId,label:label.value,quantity:quantity.value,durationDays:days.value,maxActivations:unlimited.value?null:maxActivations.value,lifetime:lifetime.value,expiresAt:expiresAt.value?new Date(expiresAt.value).toISOString():null}});message.value=`${data.codes.length} chaves geradas. Cada chave pode ser copiada ou exportada abaixo.`;requestId=null;await reload()})}
function toggle(item){return perform(async()=>{await v2Request('key-status',{method:'POST',body:{id:item.id,active:!item.active}});await reload()})}
async function copy(value){try{await navigator.clipboard.writeText(value);message.value='Chave copiada.'}catch{error.value='Selecione e copie o texto da chave.'}}
function exportCsv(){const safe=v=>{let s=String(v??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};const lines=[['Chave','Identificação','Ativações','Limite','Vitalícia','Dias','Ativa'],...keys.value.map(k=>[k.code,k.label,k.activationCount,k.maxActivations===null?'ilimitadas':k.maxActivations,k.lifetime?'sim':'não',k.durationDays,k.active?'sim':'não'])];const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.map(r=>r.map(safe).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='chaves-v2.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function grant(revoke){if(revoke&&!window.confirm('Revogar apenas o acesso V2 desta conta? A assinatura antiga será preservada.'))return;return perform(async()=>{await v2Request('set-access',{method:'POST',body:{uid:targetUid.value.trim(),durationDays:grantDays.value,lifetime:grantLifetime.value,revoke}});message.value=revoke?'Acesso V2 revogado.':'Acesso V2 concedido.'})}
function loadAudit(){return perform(async()=>{events.value=(await v2Request('audit')).events})}
onMounted(reload)
</script>
<style scoped>
.keys-v2{width:min(100%,1000px);background:#1a1a1a;padding:24px;border:1px solid #333;border-radius:14px;margin:20px auto;color:#fff}.keys-v2 h2,.keys-v2 h3{margin:14px 0}.keys-v2 p{margin:12px 0;color:#ccc}.fields{display:flex;flex-wrap:wrap;gap:12px}.fields>*{min-width:180px}.key-card{border:1px solid #444;border-radius:10px;padding:16px;margin:12px 0;overflow-wrap:anywhere}.key-card code{color:#a5e6b1;font-size:.95rem}.search{padding:12px;border:1px solid #555;border-radius:8px;color:#fff;display:block;width:100%;margin:20px 0}ul{padding-left:20px}
</style>
