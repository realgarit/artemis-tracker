import { strict as assert } from 'node:assert'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { sha256Hex } from '../offline.ts'

test('offline resource digest uses lowercase SHA-256 hex', async () => {
  const content = new TextEncoder().encode('verified offline resource')
  assert.equal(await sha256Hex(content), createHash('sha256').update(content).digest('hex'))
})
