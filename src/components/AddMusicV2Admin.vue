<template>
 <section class="v2-admin-block">
  <h2>Adicionar músicas V2</h2><p>Áudios no R2 e cadastro em musicasV2. O envio antigo permanece disponível abaixo.</p>
  <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert><v-alert v-if="message" type="success" variant="tonal">{{ message }}</v-alert>
  <v-btn @click="checkServer" :disabled="busy">Verificar servidor V2</v-btn>
  <div class="v2-form"><v-text-field v-model="artist" label="Cantor padrão" :disabled="busy"/><v-text-field v-model="genres" label="Gêneros padrão (separados por vírgula)" :disabled="busy"/></div>
  <input type="file" multiple accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,.opus" :disabled="busy" @change="selectFiles" aria-label="Selecionar músicas V2"/>
  <div v-for="row in rows" :key="row.requestId" class="v2-row">
   <v-text-field v-model="row.title" label="Título" :disabled="busy || row.done"/><v-text-field v-model="row.cantor" label="Cantor" :disabled="busy || row.done"/><v-text-field v-model="row.estilos" label="Gêneros" :disabled="busy || row.done"/>
   <p>{{ row.file?.name || row.uploaded?.fileName }} · {{ row.status || 'Aguardando envio' }}</p><p v-if="row.error" class="error">{{ row.error }}</p><v-progress-linear v-if="busy && current===row.requestId" :model-value="row.progress || 0" color="green"/>
   <v-btn v-if="!busy" size="small" @click="remove(row)">{{ row.uploaded && !row.done?'Esquecer pendência':'Remover da lista' }}</v-btn>
  </div>
  <v-btn color="green" @click="publishAll" :disabled="busy || !rows.some(r=>!r.done)">{{ busy?'Enviando…':'Publicar músicas V2' }}</v-btn><v-btn v-if="busy" @click="abort?.abort()">Cancelar próximos envios</v-btn>
  <p class="note">Arquivos enviados ficam em musicas-v2/. Esquecer uma pendência não apaga o áudio do R2. Chaves e cadastro são validados pelo servidor.</p>
 </section>
</template>
<script setup>
import {ref,onMounted} from 'vue'
import axios from 'axios'
import {auth} from '@/firebase'
import {v2Request,v2UploadBase} from '@/services/v2'
const artist=ref(''),genres=ref(''),rows=ref([]),busy=ref(false),current=ref(''),message=ref(''),error=ref('')
let abort
const key=()=>`repertorio-v2-pending:${auth.currentUser?.uid || ''}`
function persist(){if(auth.currentUser)localStorage.setItem(key(),JSON.stringify(rows.value.filter(r=>r.uploaded&&!r.done).map(({file,...r})=>r)))}
function selectFiles(event){for(const file of event.target.files || []){if(file.size>300*1024*1024){error.value='Limite de 300 MB por arquivo.';continue}rows.value.push({file,requestId:crypto.randomUUID(),title:file.name.replace(/\.[^.]+$/,''),cantor:artist.value,estilos:genres.value,status:'',done:false})}event.target.value=''}
function remove(row){if(row.uploaded&&!row.done&&!window.confirm('Esquecer o cadastro pendente? O arquivo permanecerá no R2.'))return;rows.value=rows.value.filter(r=>r.requestId!==row.requestId);persist()}
async function checkServer(){error.value='';try{const data=await v2Request('health',{local:true});message.value=`Servidor local V2 autorizado. Projeto Firebase: ${data.projectId}.`}catch(e){error.value=e.message}}
async function publishAll(){busy.value=true;error.value='';message.value='';abort=new AbortController();let successes=0,failures=0
 try{for(const row of rows.value.filter(r=>!r.done)){if(abort.signal.aborted)break;current.value=row.requestId;row.error=''
  try{if(!row.title.trim()||!row.cantor.trim())throw new Error('Informe título e cantor.')
   if(!row.uploaded){if(!row.file)throw new Error('Selecione novamente o arquivo.');row.status='Enviando ao R2';const form=new FormData();form.append('file',row.file)
    const response=await axios.post(v2UploadBase+'/upload-music',form,{headers:{Authorization:'Bearer '+await auth.currentUser.getIdToken(),'X-Upload-ID':row.requestId},signal:abort.signal,onUploadProgress:e=>{row.progress=e.total?Math.round(e.loaded/e.total*100):0}})
    row.uploaded=response.data;row.status='Arquivo no R2; cadastrando no Firebase';persist()
   }
   const data=await v2Request('publish-music',{local:true,method:'POST',body:{...row.uploaded,requestId:row.requestId,title:row.title,cantor:row.cantor,estilos:row.estilos}})
   row.done=true;row.status=`Publicado: ${data.track.id}`;row.file=null;successes++;persist()
  }catch(e){row.error=e.response?.data?.error || e.message;row.status=row.uploaded?'Pendente no Firebase; clique em publicar para tentar novamente':'Não enviado';failures++;persist()}
 }
 message.value=`${successes} publicadas nesta tentativa. ${failures} pendências.`;window.dispatchEvent(new Event('repertorio:v2-catalog-change'))
 }finally{busy.value=false;current.value=''}
}
onMounted(()=>{try{rows.value=JSON.parse(localStorage.getItem(key()) || '[]').map(r=>({...r,status:'Envio pendente recuperado; pronto para cadastrar',file:null}))}catch{rows.value=[]}})
</script>
<style scoped>
.v2-admin-block{width:min(100%,1000px);padding:24px;margin:20px auto;background:#1a1a1a;border:1px solid #333;border-radius:14px;color:white}.v2-admin-block h2{margin-bottom:10px}.v2-admin-block p{margin:12px 0}.v2-form{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}.v2-form>*{min-width:200px}.v2-row{border:1px solid #444;border-radius:10px;margin:16px 0;padding:16px}.error{color:#ffaaa5}.note{color:#aaa;font-size:.9rem}
</style>
