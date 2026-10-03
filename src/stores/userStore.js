import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { dateOf } from '@/utils/catalog'
import { api } from '@/services/api'
export const useUserStore = defineStore('user',()=>{
 const user=ref(null),loadingUser=ref(true),clock=ref(Date.now());let unsubscribe=null
 setInterval(()=>{clock.value=Date.now()},30000)
 const hasActiveSubscription=computed(()=>!!user.value && !user.value.disabled && user.value.subscription==='ativa' && dateOf(user.value.subscriptionEnd).getTime()>clock.value)
 const daysRemaining=computed(()=>hasActiveSubscription.value?Math.ceil((dateOf(user.value.subscriptionEnd).getTime()-clock.value)/86400000):0)
 onAuthStateChanged(auth, firebaseUser=>{unsubscribe?.();loadingUser.value=true;if(!firebaseUser){user.value=null;loadingUser.value=false;return}const basic={uid:firebaseUser.uid,name:firebaseUser.displayName || firebaseUser.email,email:firebaseUser.email,role:'user',favorites:[]};user.value=basic;unsubscribe=onSnapshot(doc(db,'users',firebaseUser.uid),snap=>{const data=snap.data() || {};user.value={...basic,...data,uid:firebaseUser.uid,name:[data.firstName,data.lastName].filter(Boolean).join(' ') || basic.name,favorites:data.favorites || []};loadingUser.value=false},()=>{user.value=basic;loadingUser.value=false})})
 async function ativarAssinaturaComChave(key,router){const result=await api('activate',{key});if(user.value)user.value={...user.value,subscription:'ativa',subscriptionEnd:result.subscriptionEnd};if(router)router.push('/AllMusic');return 'Assinatura renovada. Seus dias restantes foram preservados.'}
 const ativarAssinatura=ativarAssinaturaComChave
 async function logout(){await signOut(auth);user.value=null}
 return {user,loadingUser,hasActiveSubscription,daysRemaining,ativarAssinatura,ativarAssinaturaComChave,logout,setUser:data=>user.value=data,clearUser:()=>user.value=null}
})
