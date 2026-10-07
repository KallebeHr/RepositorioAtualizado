export const playerCorsRule = {
  corsRuleName: 'repertorio-player-downloads',
  allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://www.repertorioatualizado.com.br', 'https://repertorioatualizado.com.br'],
  allowedOperations: ['b2_download_file_by_name', 'b2_download_file_by_id'],
  allowedHeaders: ['range'],
  exposeHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges', 'Content-Type', 'ETag'],
  maxAgeSeconds: 3600,
}

export function mergePlayerCors(existing = []) {
  // A primeira regra que corresponde é usada pelo B2. Preserve as demais regras.
  const others = existing.filter(rule => rule.corsRuleName !== playerCorsRule.corsRuleName)
  if (others.length >= 100) throw new Error('O bucket já tem 100 regras CORS. Ajuste as regras no painel antes de continuar.')
  return [structuredClone(playerCorsRule), ...structuredClone(others)]
}

export async function configureB2Cors({ client, credentials, apply = false, backup = async () => {} }) {
  const { B2_KEY_ID, B2_APP_KEY, B2_BUCKET_ID, B2_BUCKET_NAME } = credentials
  if (![B2_KEY_ID, B2_APP_KEY, B2_BUCKET_ID, B2_BUCKET_NAME].every(Boolean)) throw new Error('Confira B2_KEY_ID, B2_APP_KEY, B2_BUCKET_ID e B2_BUCKET_NAME no arquivo do backend.')
  const { data: auth } = await client.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    auth: { username: B2_KEY_ID, password: B2_APP_KEY }, timeout: 20000,
  })
  const capabilities = auth.allowed?.capabilities || []
  if (!capabilities.includes('listBuckets')) throw new Error('A chave B2 precisa de listBuckets para consultar as regras existentes. Ajuste CORS no painel ou use uma chave com essa permissão somente no backend.')
  if (auth.allowed?.bucketId && auth.allowed.bucketId !== B2_BUCKET_ID) throw new Error('A chave B2 pertence a outro bucket.')
  const headers = { Authorization: auth.authorizationToken }
  const { data: listed } = await client.post(auth.apiUrl + '/b2api/v2/b2_list_buckets', {
    accountId: auth.accountId, bucketId: B2_BUCKET_ID,
  }, { headers, timeout: 20000 })
  const bucket = listed.buckets?.find(item => item.bucketId === B2_BUCKET_ID && item.bucketName === B2_BUCKET_NAME)
  if (!bucket) throw new Error('O bucket configurado não foi encontrado nesta conta.')
  const rules = mergePlayerCors(bucket.corsRules || [])
  const changed = JSON.stringify(rules) !== JSON.stringify(bucket.corsRules || [])
  if (apply && changed) {
    if (!capabilities.includes('writeBuckets')) throw new Error('A chave B2 não possui writeBuckets para alterar CORS. Configure as regras no painel ou use uma chave com essa permissão somente no backend.')
    if (!Number.isInteger(bucket.revision)) throw new Error('Não foi possível conferir a revisão do bucket. Nenhuma alteração foi feita.')
    await backup({ bucketName: bucket.bucketName, bucketId: bucket.bucketId, revision: bucket.revision, corsRules: bucket.corsRules || [] })
    await client.post(auth.apiUrl + '/b2api/v2/b2_update_bucket', {
      accountId: auth.accountId, bucketId: bucket.bucketId, ifRevisionIs: bucket.revision, corsRules: rules,
    }, { headers, timeout: 20000 })
  }
  return { bucketName: bucket.bucketName, changed, applied: apply && changed, currentRules: bucket.corsRules || [], proposedRules: rules }
}
