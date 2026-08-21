import { strict as assert } from 'node:assert'
import test from 'node:test'
import { computeTrajectoryPoints, parseHorizonsVectors } from '../horizons'

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

test('trajectory points calculate distances, velocity, acceleration, and coordinates', () => {
  const points = computeTrajectoryPoints(parseHorizonsVectors(horizonsResult), [])

  assert.equal(points.length, 2)
  assert.equal(points[0].distanceFromEarth, 3741.66)
  assert.equal(points[0].distanceFromMoon, 384400)
  assert.equal(points[0].velocity, 3)
  assert.equal(points[0].commsDelay, 0.01)
  assert.equal(points[1].acceleration, -0.0002)
  assert.ok(points[1].latitude > 50 && points[1].latitude < 55)
  assert.ok(points[1].longitude > 110 && points[1].longitude < 120)
})
