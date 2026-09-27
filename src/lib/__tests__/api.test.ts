import { gzipSync } from 'node:zlib'
import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeFlightBundleResponse } from '../api.ts'

const bundle = { schemaVersion: 1, missions: [{ schemaVersion: 1, missionId: 'artemis-ii' }] }

test('flight bundle loader accepts a host-decoded gzip response', async () => {
  const response = new Response(JSON.stringify(bundle), { headers: { 'content-encoding': 'gzip', 'content-type': 'application/json' } })
  assert.deepEqual(await decodeFlightBundleResponse(response), bundle)
})

test('flight bundle loader decompresses a raw gzip response', { skip: typeof DecompressionStream === 'undefined' }, async () => {
  const response = new Response(gzipSync(JSON.stringify(bundle)), { headers: { 'content-type': 'application/gzip' } })
  assert.deepEqual(await decodeFlightBundleResponse(response), bundle)
})
