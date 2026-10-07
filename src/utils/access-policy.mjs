export function dateMillis(value) {
 if (!value) return 0
 if (typeof value.toMillis === 'function') return value.toMillis()
 if (typeof value.toDate === 'function') return value.toDate().getTime()
 if (typeof value.seconds === 'number') return value.seconds * 1000
 const result = new Date(value).getTime(); return Number.isFinite(result) ? result : 0
}
export function subscriptionActive(user, now = Date.now()) {
 return !!user && !user.disabled && user.subscription === 'ativa' && (user.subscriptionLifetime === true || dateMillis(user.subscriptionEnd) > now)
}
export function validateKeyPolicy(policy) {
 if (policy.maxActivations !== null && (!Number.isInteger(policy.maxActivations) || policy.maxActivations < 1 || policy.maxActivations > 1000000)) throw new Error('Informe de 1 a 1.000.000 ativações ou escolha ilimitadas.')
 if (!policy.lifetime && (!Number.isInteger(policy.durationDays) || policy.durationDays < 1 || policy.durationDays > 36500)) throw new Error('Informe de 1 a 36.500 dias ou escolha vitalício.')
 return { maxActivations: policy.maxActivations, lifetime: !!policy.lifetime, durationDays: policy.lifetime ? 0 : policy.durationDays }
}
export function redemptionPlan(key, user, alreadyUsed, now = Date.now()) {
 if (alreadyUsed && !(key?.legacy === true && key.maxActivations === null && !subscriptionActive(user, now))) throw new Error('Esta conta já utilizou esta chave.')
 if (!key || key.active !== true) throw new Error('Chave inválida ou desativada.')
 const policy = validateKeyPolicy(key)
 if (policy.maxActivations !== null && key.activationCount >= policy.maxActivations) throw new Error('Esta chave atingiu o limite de ativações.')
 const lifetime = policy.lifetime || (subscriptionActive(user, now) && user.subscriptionLifetime === true)
 const base = now
 return { lifetime, end: lifetime ? null : base + policy.durationDays * 86400000 }
}
