import { strict as assert } from 'node:assert'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { explainOfflinePackFailure, sha256Hex } from '../offline.ts'

test('offline resource digest uses lowercase SHA-256 hex', async () => {
  const content = new TextEncoder().encode('verified offline resource')
  assert.equal(await sha256Hex(content), createHash('sha256').update(content).digest('hex'))
})

test('offline pack failures give specific storage-quota and private-profile recovery paths', () => {
  const quota = explainOfflinePackFailure(new DOMException('quota reached', 'QuotaExceededError'))
  assert.match(quota, /remove another offline pack/i)
  assert.match(quota, /without optional 3D files/i)
  assert.match(quota, /previous complete pack is kept/i)

  const privateProfile = explainOfflinePackFailure(new DOMException('storage denied', 'SecurityError'))
  assert.match(privateProfile, /private browsing/i)
  assert.match(privateProfile, /normal browsing window/i)
  assert.match(privateProfile, /online tracker still works/i)
})
