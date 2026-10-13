import { auth, db } from '@/firebase'
import { collection, doc, getDocs, query, orderBy, limit, startAfter, runTransaction, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore'
import { validateKeyPolicy, subscriptionActive } from '@/utils/access-policy.mjs'
import { equalizerPlan } from '@/utils/addon-policy.mjs'
import { keyId } from './access-keys'

export async function createEqualizerKey(code, policy) {
  code = code.trim()
  if (code.length < 6 || code.length > 120) throw new Error('O código deve ter entre 6 e 120 caracteres.')
  const valid = validateKeyPolicy(policy), ref = doc(db, 'equalizerKeys', await keyId(code))
  await runTransaction(db, async tx => {
    if ((await tx.get(ref)).exists()) throw new Error('Este código já existe.')
    tx.set(ref, { code, feature: 'equalizer', ...valid, active: true, activationCount: 0, createdAt: serverTimestamp() })
  })
  return code
}

export async function redeemEqualizerKey(code) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Entre na sua conta para ativar o equalizador.')
  if (!navigator.onLine) throw new Error('Conecte-se à internet para ativar o código.')
  const id = await keyId(code), key = doc(db, 'equalizerKeys', id)
  const receiptId = id + '_' + uid, receipt = doc(db, 'equalizerRedemptions', receiptId)
  const grant = doc(db, 'users', uid, 'addons', 'equalizer'), profile = doc(db, 'users', uid)
  return runTransaction(db, async tx => {
    const [k, r, g, u] = await Promise.all([tx.get(key), tx.get(receipt), tx.get(grant), tx.get(profile)])
    if (auth.currentUser?.uid !== uid) throw new Error('Sua conta mudou. Entre novamente.')
    if (!u.exists() || !subscriptionActive(u.data())) throw new Error('Ative a assinatura da sua conta antes do equalizador.')
    const plan = equalizerPlan(k.exists() ? k.data() : null, g.exists() ? g.data() : null, r.exists())
    const endAt = plan.end === null ? null : Timestamp.fromMillis(plan.end)
    tx.update(key, { activationCount: k.data().activationCount + 1 })
    tx.set(receipt, { uid, keyId: id, feature: 'equalizer', createdAt: serverTimestamp(), lifetime: plan.lifetime, endAt })
    tx.set(grant, { feature: 'equalizer', active: true, lifetime: plan.lifetime, endAt, grantedAt: serverTimestamp(), keyId: id, receiptId })
    return plan
  })
}

export async function listEqualizerKeys(cursor = null) {
  const terms = [orderBy('createdAt', 'desc')]
  if (cursor) terms.push(startAfter(cursor))
  const snap = await getDocs(query(collection(db, 'equalizerKeys'), ...terms, limit(26)))
  return { keys: snap.docs.slice(0, 25).map(d => ({ id: d.id, ...d.data() })), cursor: snap.docs.slice(0, 25).at(-1), more: snap.size > 25 }
}
export async function setEqualizerKeyActive(id, active) { await updateDoc(doc(db, 'equalizerKeys', id), { active }) }
export async function setEqualizerGrantActive(uid, active) {
  await updateDoc(doc(db, 'users', uid, 'addons', 'equalizer'), { active })
}
