import { strict as assert } from 'node:assert'
import test from 'node:test'
import { computeTrajectoryPoints, parseHorizonsVectors, vectorAtTime } from '../horizons'

const horizonsResult = `
 $$SOE
 1, 2026-Apr-10 00:00:00.0000 A.D., -1000, 2000, 3000, 1, 2, 2
2, 2026-Apr-10 00:01:00.0000 A.D., -940, 2060, 3060, 2.99, 0, 0
 $$EOE
 `

test('Horizons parser extracts valid vector rows and timestamps', () => {
  const vectors = parseHorizonsVectors(horizonsResult)

  assert.equal(vectors.length, 2)
  assert.equal(vectors[0].timestamp, '2026-04-10T00:00:00.000Z')
  assert.deepEqual(vectors[1], {
    timestamp: '2026-04-10T00:01:00.000Z',
    x: -940,
    y: 2060,
    z: 3060,
    vx: 2.99,
    vy: 0,
    vz: 0,
  })
})

test('Horizons parser ignores malformed responses', () => {
  assert.deepEqual(parseHorizonsVectors('No ephemeris for target'), [])
  assert.deepEqual(parseHorizonsVectors('$$SOE\ninvalid\n$$EOE'), [])
})

test('trajectory points do not invent Moon distances or geographic coordinates', () => {
  const points = computeTrajectoryPoints(parseHorizonsVectors(horizonsResult), [])

  assert.equal(points.length, 2)
  assert.equal(points[0].distanceFromEarth, 3741.66)
  assert.equal(points[0].distanceFromMoon, null)
  assert.equal(points[0].velocity, 3)
  assert.equal(points[0].commsDelay, 0.01)
  assert.equal(points[0].acceleration, null)
  assert.equal(points[1].acceleration, 0.0576)
  assert.equal(points[1].latitude, null)
  assert.equal(points[1].longitude, null)
})

test('spacecraft and Moon states interpolate by epoch, not array index, and reject gaps', () => {
  const base = Date.parse('2026-04-10T00:00:00Z')
  const first = { timestamp: new Date(base).toISOString(), x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }
  const last = { timestamp: new Date(base + 60_000).toISOString(), x: 60, y: 120, z: 180, vx: 6, vy: 12, vz: 18 }
  const result = vectorAtTime([last, first], base + 30_000)
  assert.equal(result?.x, 30)
  assert.equal(result?.y, 60)
  assert.equal(vectorAtTime([first], base - 1), null)
  assert.equal(vectorAtTime([first, { ...last, timestamp: new Date(base + 3_600_000).toISOString() }], base + 1_800_000), null)
})
