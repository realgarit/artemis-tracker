import { strict as assert } from 'node:assert'
import test from 'node:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { refreshSnapshot } from '../generate-data'

const unavailableWeather = {
  kpIndex: null,
  kpCategory: 'Unavailable',
  solarWindSpeed: null,
  solarWindDensity: null,
  imfBz: null,
  imfBt: null,
  source: 'NOAA SWPC',
  timestamp: '',
  provenance: { mode: 'unavailable', provider: 'NOAA SWPC', retrievedAt: '2026-09-26T00:00:00.000Z', summary: 'No observation available' },
}

test('a second failed refresh retains the last validated observation and original timestamps', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'artemis-snapshot-refresh-'))
  try {
    const live = {
      kpIndex: 3, kpCategory: 'Unsettled', solarWindSpeed: 450, solarWindDensity: 3, imfBz: -2, imfBt: 4,
      source: 'NOAA SWPC', timestamp: '2026-09-20T12:00:00.000Z',
      provenance: { mode: 'observed', provider: 'NOAA SWPC', observedAt: '2026-09-20T12:00:00.000Z', retrievedAt: '2026-09-20T12:01:00.000Z', summary: 'Recorded fixture' },
    }
    const first = await refreshSnapshot('spaceweather.json', async () => live, unavailableWeather, directory)
    assert.equal(first.status, 'fresh')
    assert.equal(first.failureCategory, null)
    const firstEnvelope = JSON.parse(await readFile(join(directory, 'spaceweather.json'), 'utf8'))

    const second = await refreshSnapshot('spaceweather.json', async () => { throw new Error('provider offline') }, unavailableWeather, directory)
    const secondEnvelope = JSON.parse(await readFile(join(directory, 'spaceweather.json'), 'utf8'))
    assert.equal(second.status, 'preserved')
    assert.equal(second.failureCategory, 'other')
    assert.equal(secondEnvelope.schemaVersion, 1)
    assert.equal(secondEnvelope.generatedAt, firstEnvelope.generatedAt)
    assert.equal(secondEnvelope.data.timestamp, live.timestamp)
    assert.equal(secondEnvelope.data.provenance.observedAt, live.provenance.observedAt)
    assert.ok((second.ageSeconds || 0) > 0)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('invalid fresh data is rejected and an explicit unavailable state replaces an unsupported snapshot', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'artemis-snapshot-invalid-'))
  try {
    await import('node:fs/promises').then(({ writeFile }) => writeFile(join(directory, 'spaceweather.json'), JSON.stringify({ schemaVersion: 8, data: { kpIndex: 9 } }), 'utf8'))
    const status = await refreshSnapshot('spaceweather.json', async () => ({ ...unavailableWeather, kpIndex: Number.NaN }), unavailableWeather, directory)
    const envelope = JSON.parse(await readFile(join(directory, 'spaceweather.json'), 'utf8'))
    assert.equal(status.status, 'unavailable')
    assert.equal(status.failureCategory, 'invalid-data')
    assert.equal(envelope.schemaVersion, 1)
    assert.equal(envelope.data.kpIndex, null)
    assert.equal(envelope.data.timestamp, '')
  } finally { await rm(directory, { recursive: true, force: true }) }
})
