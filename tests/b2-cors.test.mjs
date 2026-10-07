import test from 'node:test'
import assert from 'node:assert/strict'
import { configureB2Cors, mergePlayerCors, playerCorsRule } from '../b2-backend/b2-cors-policy.mjs'

const credentials = { B2_KEY_ID: 'test-key', B2_APP_KEY: 'test-secret', B2_BUCKET_ID: 'bucket', B2_BUCKET_NAME: 'RepertorioAtualizado' }
const old = { corsRuleName: 'existing-upload', allowedOrigins: ['https://admin.test'], allowedOperations: ['b2_upload_file'], allowedHeaders: ['*'], maxAgeSeconds: 60 }
function client(capabilities = ['listBuckets', 'writeBuckets'], rules = [old]) {
  const calls = []
  return { calls, get: async () => ({ data: { accountId: 'account', apiUrl: 'https://api.test', authorizationToken: 'test-token', allowed: { bucketId: 'bucket', capabilities } } }),
    post: async (url, body) => { calls.push({ url, body }); return url.endsWith('b2_list_buckets') ? { data: { buckets: [{ bucketId: 'bucket', bucketName: 'RepertorioAtualizado', revision: 7, bucketType: 'allPublic', corsRules: rules }] } } : { data: {} } },
  }
}
test('CORS do player preserva uploads existentes e não duplica a regra ao repetir', () => {
  const existing = [structuredClone(old)]
  const rules = mergePlayerCors(existing)
  assert.deepEqual(rules, [playerCorsRule, old]); assert.deepEqual(mergePlayerCors(rules), rules)
  assert.deepEqual(existing, [old]); assert.ok(rules[0].allowedOrigins.includes('http://localhost:3000'))
  assert.ok(rules[0].allowedOperations.includes('b2_download_file_by_name'))
})
test('consulta CORS usa o bucket exato e não envia atualização', async () => {
  const api = client(['listBuckets'])
  const result = await configureB2Cors({ client: api, credentials })
  assert.equal(result.applied, false); assert.equal(api.calls.length, 1)
  assert.equal(api.calls[0].body.bucketId, 'bucket')
})
test('aplica somente CORS com backup e proteção de revisão; não muda visibilidade ou ciclo de vida', async () => {
  const api = client(); let backup
  const result = await configureB2Cors({ client: api, credentials, apply: true, backup: async data => { backup = data } })
  assert.equal(result.applied, true); assert.deepEqual(backup.corsRules, [old])
  const write = api.calls[1].body
  assert.deepEqual(Object.keys(write).sort(), ['accountId', 'bucketId', 'corsRules', 'ifRevisionIs'].sort())
  assert.equal(write.ifRevisionIs, 7); assert.deepEqual(write.corsRules[1], old)
  const repeat = client(['listBuckets','writeBuckets'],result.proposedRules)
  assert.equal((await configureB2Cors({ client: repeat, credentials, apply: true })).applied, false)
  assert.equal(repeat.calls.length, 1)
})
test('permissão insuficiente e conflito de revisão não prosseguem com sobrescrita', async () => {
  const api = client(['listBuckets'])
  await assert.rejects(configureB2Cors({ client: api, credentials, apply: true }), /writeBuckets/)
  assert.equal(api.calls.length, 1)
  const conflict = client(), original = conflict.post
  conflict.post = async (...args) => { const result = await original(...args); if (args[0].endsWith('b2_update_bucket')) throw new Error('conflict'); return result }
  await assert.rejects(configureB2Cors({ client: conflict, credentials, apply: true }), /conflict/)
  assert.equal(conflict.calls.length, 2)
})
