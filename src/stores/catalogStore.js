import { defineStore } from 'pinia'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { normalizeTrack } from '@/utils/catalog'
import { usePlayerStore } from './usePlayerStore'
export const useCatalogStore = defineStore('catalog',{
 state:()=>({tracks:[],loading:false,error:'',loaded:false}),
 actions:{async load(force=false){if(this.loading || this.loaded && !force)return;this.loading=true;this.error='';try{const snapshot=await getDocs(collection(db,'musicas'));this.tracks=snapshot.docs.map(d=>normalizeTrack({...d.data(),id:d.id}));usePlayerStore().setFullList(this.tracks);this.loaded=true}catch{this.error='Não foi possível carregar o catálogo. Verifique a conexão e tente novamente.'}finally{this.loading=false}}}
})
