import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { collection, collectionGroup, doc, getDoc, onSnapshot, query, where, orderBy, limit, Timestamp, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useUserStore } from './userStore'
import { DEVICE_RECENT_MS, DEVICE_ALERT_LIMIT, groupRecentDevices } from '@/utils/device-policy.mjs'

export const useDeviceAdminStore = defineStore('device-admin', () => {
  const user = useUserStore(), records = ref([]), alerts = ref([]), profiles = ref({})
  const loading = ref(false), error = ref(''), verified = ref(false), clock = ref(Date.now()), online = ref(navigator.onLine)
  const groups = computed(() => groupRecentDevices(records.value, clock.value))
  const connected = computed(() => groups.value.reduce((n,g) => n + g.count, 0))
  const excess = computed(() => groups.value.filter(g => g.alert))
  let started = false, unsubscribeDevices, unsubscribeAlerts, timer, refreshTimer, generation = 0, synchronizing = false
  const observed = new Map(), loadingProfiles = new Set()
  function reset() {
    unsubscribeDevices?.(); unsubscribeAlerts?.(); unsubscribeDevices = null; unsubscribeAlerts = null
    clearInterval(timer); clearInterval(refreshTimer); records.value = []; alerts.value = []; profiles.value = {}
    observed.clear(); loadingProfiles.clear(); verified.value = false; loading.value = false; error.value = ''; generation++
  }
  function subscribeDevices() {
    unsubscribeDevices?.(); verified.value = false
    const run = generation
    unsubscribeDevices = onSnapshot(query(collectionGroup(db, 'devices'), where('lastSeen', '>=', Timestamp.fromMillis(Date.now() - DEVICE_RECENT_MS)), orderBy('lastSeen','desc')), { includeMetadataChanges: true }, snap => {
      if (run !== generation) return
      records.value = snap.docs.map(d => ({ id:d.id, ...d.data() })); loading.value = false
      verified.value = !snap.metadata.fromCache && !snap.metadata.hasPendingWrites
      if (verified.value) error.value = ''
    }, e => { if(run === generation) { loading.value=false; verified.value=false; error.value = e.code==='permission-denied' ? 'Sem permissão para monitorar dispositivos. Publique as regras atualizadas e confira o perfil administrador.' : e.code==='failed-precondition' ? 'O índice de dispositivos ainda não está pronto. Publique firestore.indexes.json e aguarde a criação.' : 'Não foi possível acompanhar os dispositivos. Confira a conexão.' } })
  }
  function connect() {
    reset()
    if (!started || user.user?.role !== 'admin' || user.user?.disabled) return
    loading.value = true; clock.value = Date.now()
    subscribeDevices()
    const run = generation
    unsubscribeAlerts = onSnapshot(query(collection(db,'adminDeviceAlerts'),orderBy('createdAt','desc'),limit(50)), snap => {
      if (run===generation) alerts.value=snap.docs.map(d=>({id:d.id,...d.data()}))
    }, () => { if(run===generation) error.value='Não foi possível abrir o histórico de alertas. Confira as regras do Firebase.' })
    timer=setInterval(()=>{clock.value=Date.now();online.value=navigator.onLine},15000)
    refreshTimer=setInterval(()=>{if(navigator.onLine)subscribeDevices()},3*60*1000)
  }
  function start(){if(started)return;started=true;connect()}
  function stop(){started=false;reset()}
  function refresh(){if(started)connect()}
  watch([()=>user.user?.uid,()=>user.user?.role,()=>user.user?.disabled],()=>{if(started)connect()})
  async function ensureProfiles(uids) {
    const run=generation
    await Promise.all([...new Set(uids)].filter(uid=>!profiles.value[uid]&&!loadingProfiles.has(uid)).map(async uid=>{
      loadingProfiles.add(uid)
      try { const snap=await getDoc(doc(db,'users',uid));if(run===generation)profiles.value[uid]=snap.exists()?{uid,...snap.data()}:{uid} }
      catch {} finally { if(run===generation)loadingProfiles.delete(uid) }
    }))
  }
  async function syncAlerts() {
    if(synchronizing || !started || !verified.value || !navigator.onLine || user.user?.role!=='admin')return
    synchronizing=true; const run=generation, current=new Map(groups.value.map(g=>[g.uid,g.count]))
    try {
      for(const uid of new Set([...current.keys(),...observed.keys()])) {
        if(run!==generation)break
        const count=current.get(uid)||0,previous=observed.get(uid)
        if(count===previous)continue
        if(count<=DEVICE_ALERT_LIMIT && (!previous || previous<=DEVICE_ALERT_LIMIT)){observed.set(uid,count);continue}
        const ref=doc(db,'adminDeviceAlerts',uid)
        await runTransaction(db,async tx=>{
          const snap=await tx.get(ref),old=snap.exists()?snap.data():null
          if(run!==generation)throw new Error('Painel fechado.')
          if(count>DEVICE_ALERT_LIMIT) {
            if(old?.active===true && old.count===count)return
            const continuing=old?.active===true
            tx.set(ref,{uid,count,threshold:DEVICE_ALERT_LIMIT,active:true,createdAt:continuing?old.createdAt:serverTimestamp(),updatedAt:serverTimestamp(),acknowledgedAt:continuing?old.acknowledgedAt||null:null,acknowledgedBy:continuing?old.acknowledgedBy||null:null,resolvedAt:null})
          } else if(old?.active===true)tx.update(ref,{active:false,count,updatedAt:serverTimestamp(),resolvedAt:serverTimestamp()})
        })
        observed.set(uid,count)
      }
    } catch { if(run===generation)error.value='Não foi possível registrar o alerta. A contagem recente continua disponível; confira a conexão e as regras.' }
    finally { synchronizing=false }
  }
  watch([groups,verified],syncAlerts)
  async function acknowledge(uid){await updateDoc(doc(db,'adminDeviceAlerts',uid),{acknowledgedAt:serverTimestamp(),acknowledgedBy:user.user.uid})}
  function countFor(uid){return groups.value.find(g=>g.uid===uid)?.count||0}
  return {records,alerts,profiles,groups,connected,excess,loading,error,verified,online,start,stop,refresh,ensureProfiles,acknowledge,countFor}
})
