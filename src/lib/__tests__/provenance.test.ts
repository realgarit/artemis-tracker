import { strict as assert } from 'node:assert'
import test from 'node:test'
import { provenanceLabel, type DataProvenance } from '../provenance'

const provenance: DataProvenance = {
  mode: 'snapshot', provider: 'NOAA SWPC', summary: 'Earth environment only',
  retrievedAt: '2026-09-26T00:00:00Z', observedAt: '2026-09-26T00:00:00Z', maxAgeSeconds: 3600,
}

test('snapshot freshness threshold is explicit and deterministic at its boundary', () => {
  const fresh = provenanceLabel(provenance, Date.parse(provenance.observedAt!) + 3_600_000)
  const stale = provenanceLabel(provenance, Date.parse(provenance.observedAt!) + 3_600_001)
  assert.match(fresh, /^Cached snapshot · NOAA SWPC · 1 hr old/)
  assert.match(stale, /^Stale cached snapshot · NOAA SWPC · 1 hr old/)
})

test('illustrative replay never receives a fresh-observation age and source clock skew is visible', () => {
  const illustrative = { ...provenance, mode: 'illustrative' as const, observedAt: '2022-11-16T00:00:00Z', summary: 'Bundled path model' }
  assert.equal(provenanceLabel(illustrative), 'Illustrative model · NOAA SWPC · Bundled path model')
  const future = { ...provenance, observedAt: '2026-09-26T02:00:00Z' }
  assert.match(provenanceLabel(future, Date.parse('2026-09-26T00:00:00Z')), /^Clock mismatch/)
})
