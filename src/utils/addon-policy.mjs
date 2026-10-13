import { dateMillis, subscriptionActive, validateKeyPolicy } from './access-policy.mjs'

export function equalizerActive(grant, now = Date.now()) {
  return grant?.feature === 'equalizer' && grant.active === true &&
    (grant.lifetime === true || dateMillis(grant.endAt) > now)
}

export function equalizerPlan(key, grant, alreadyUsed, now = Date.now()) {
  if (alreadyUsed) throw new Error('Esta conta já usou este código do equalizador.')
  if (!key || key.feature !== 'equalizer' || key.active !== true) throw new Error('Código do equalizador inválido ou desativado.')
  const policy = validateKeyPolicy(key)
  if (!Number.isInteger(key.activationCount) || key.activationCount < 0) throw new Error('Código com configuração inválida. Fale com o suporte.')
  if (policy.maxActivations !== null && key.activationCount >= policy.maxActivations) throw new Error('Este código atingiu o limite de ativações.')
  const current = equalizerActive(grant, now)
  const lifetime = policy.lifetime || (current && grant.lifetime === true)
  const base = current ? Math.max(now, dateMillis(grant.endAt)) : now
  return { lifetime, end: lifetime ? null : base + policy.durationDays * 86400000 }
}

export function canUseEqualizer(user, grant, verified, now = Date.now()) {
  return subscriptionActive(user, now) && (user.role === 'admin' || (verified === true && equalizerActive(grant, now)))
}
