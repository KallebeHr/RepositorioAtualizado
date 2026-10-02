import {computed,onMounted,ref,nextTick} from 'vue'
import {doc,updateDoc,arrayUnion,arrayRemove} from 'firebase/firestore'
import {db} from '@/firebase'
import {useCatalogStore} from '@/stores/catalogStore'
import {usePlayerStore} from '@/stores/usePlayerStore'
import {useUserStore} from '@/stores/userStore'
import {useToast} from 'vue-toast-notification'
import {filterTracks} from '@/utils/catalog'
import {downloadTrack,downloadPackage} from '@/services/api'
export function useLegacyMusic(){
 const catalog=useCatalogStore(),player=usePlayerStore(),userStore=useUserStore(),toast=useToast(),showSubModal=ref(false),modalRef=ref(null)
 const tracks=computed(()=>filterTracks(catalog.tracks)),ctaLink='https://wa.me/5586995102595?text=Quero%20ativar%20meu%20acesso'
 function openSubModal(){showSubModal.value=true;nextTick(()=>modalRef.value?.focus())}
 function closeSubModal(){showSubModal.value=false}
 function requireSubscription(){if(userStore.hasActiveSubscription)return true;toast.warning('Entre na sua conta e ative sua assinatura.');openSubModal();return false}
 function play(m){if(requireSubscription())player.addToQueue(m,{playNow:true})}
 function addQueue(m){if(requireSubscription()){player.addToQueue(m);toast.success('Adicionada à fila')}}
 async function download(m){if(!requireSubscription())return;try{await downloadTrack(m);toast.success('Download autorizado')}catch(e){toast.error(e.message)}}
 async function packageTracks(list){if(!requireSubscription())return;try{const r=await downloadPackage(list.map(t=>t.id));toast.info(r.status==='ready'?'Download autorizado':'Pacote solicitado. Acompanhe em Minha conta.')}catch(e){toast.error(e.message)}}
 function isFavorite(id){return userStore.user?.favorites?.includes(id) || false}
 async function toggleFavorite(m){if(!userStore.user){toast.warning('Entre para salvar favoritos');return}try{await updateDoc(doc(db,'users',userStore.user.uid),{favorites:isFavorite(m.id)?arrayRemove(m.id):arrayUnion(m.id)})}catch(e){toast.error('Não foi possível salvar o favorito')}}
 onMounted(()=>catalog.load())
 return {catalog,player,userStore,toast,tracks,showSubModal,modalRef,ctaLink,openSubModal,closeSubModal,requireSubscription,play,addQueue,download,packageTracks,isFavorite,toggleFavorite}
}
