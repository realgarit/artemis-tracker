import { strict as assert } from 'node:assert'
import test from 'node:test'
import { alignTimedValues, differenceWithinCoverage, mergeAlignedValues } from '../comparison.ts'

test('identical source samples align with zero profile differences', () => {
  const first = [{ timestamp: 1_000, value: 384_400 }, { timestamp: 2_000, value: 385_100 }]
  const a = alignTimedValues(first, 'utc', null)
  const b = alignTimedValues(first, 'utc', null)
  const rows = mergeAlignedValues(a, b)
  assert.equal(rows.length, 2)
  assert.deepEqual(rows.map(differenceWithinCoverage), [0, 0])
})

test('elapsed and event alignment preserve offsets while UTC remains absolute', () => {
  const point = [{ timestamp: 10 * 3_600_000, value: 1 }]
  assert.equal(alignTimedValues(point, 'elapsed', 8 * 3_600_000)[0].x, 2)
  assert.equal(alignTimedValues(point, 'event', 6 * 3_600_000)[0].x, 4)
  assert.equal(alignTimedValues(point, 'utc', null)[0].x, 10 * 3_600_000)
  assert.deepEqual(alignTimedValues(point, 'event', null), [])
})

test('unequal durations and source gaps remain explicit nulls without joining unsupported epochs', () => {
  const a = alignTimedValues([{ timestamp: 0, value: 10 }, { timestamp: 3_600_000, value: 20 }], 'elapsed', 0)
  const b = alignTimedValues([{ timestamp: 0, value: 11 }], 'elapsed', 0)
  const rows = mergeAlignedValues(a, b)
  assert.deepEqual(rows.map((row) => [row.artemisI, row.artemisII, differenceWithinCoverage(row)]), [[10, 11, 1], [20, null, null]])
  assert.equal(rows.length, 2)
})
