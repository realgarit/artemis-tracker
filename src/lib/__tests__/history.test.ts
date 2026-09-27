import { strict as assert } from 'node:assert'
import test from 'node:test'
import 'fake-indexeddb/auto'
import { createReplayHistorySnapshot, getHistory, getLegacyHistoryCount, saveSnapshot, startHistoryRecording, stopHistoryRecording } from '../history.ts'
import { loadEphemerisFixture } from './ephemerisFixture.ts'

await loadEphemerisFixture()

test('history records identify mission, replay source, and unavailable inertial-frame coordinates', () => {
  const record = createReplayHistorySnapshot('artemis-ii', Date.parse('2026-04-06T23:00:00Z'))
  assert.ok(record)
  assert.equal(record.missionId, 'artemis-ii')
  assert.equal(record.mode, 'historical-replay')
  assert.match(record.source, /not observed telemetry/)
  assert.equal(record.latitude, null)
  assert.equal(record.longitude, null)
  assert.ok(record.distanceFromEarth)
})

test('history does not save times outside source ephemeris coverage', () => {
  assert.equal(createReplayHistorySnapshot('artemis-ii', Date.parse('2026-04-01T22:35:12Z')), null)
  assert.equal(createReplayHistorySnapshot('artemis-iii', Date.parse('2027-01-01T00:00:00Z')), null)
})

test('history migrates old timestamp-only values as unattributed and keeps replay records mission-keyed', async () => {
  const request = indexedDB.open('artemis-tracker', 1)
  await new Promise<void>((resolve, reject) => {
    request.onupgradeneeded = () => request.result.createObjectStore('trajectory-history', { keyPath: 'timestamp' })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('trajectory-history', 'readwrite')
      transaction.objectStore('trajectory-history').put({ timestamp: 1_700_000_000_000, missionDay: 1, distanceFromEarth: 100, distanceFromMoon: 50, velocity: 2, phase: 'legacy', latitude: 1, longitude: 2 })
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error)
    }
  })

  const legacy = await getHistory('legacy-unassigned')
  assert.equal(await getLegacyHistoryCount(), 1)
  assert.equal(legacy[0].mode, 'unattributed-legacy')
  assert.equal(legacy[0].distanceFromEarth, null)
  assert.equal(legacy[0].latitude, null)

  const replay = createReplayHistorySnapshot('artemis-ii', Date.parse('2026-04-06T23:00:00Z'))
  assert.ok(replay)
  await saveSnapshot(replay)
  assert.equal((await getHistory('artemis-ii')).length, 1)
  assert.equal((await getHistory('artemis-i')).length, 0)
})

test('recorder stops the prior mission on switch and stops its interval on unmount', async () => {
  let firstMissionCalls = 0
  let secondMissionCalls = 0
  startHistoryRecording('artemis-i', () => { firstMissionCalls++; return null }, 5)
  startHistoryRecording('artemis-ii', () => { secondMissionCalls++; return null }, 5)
  await new Promise((resolve) => setTimeout(resolve, 20))
  stopHistoryRecording()
  const stoppedAt = secondMissionCalls
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(firstMissionCalls, 1)
  assert.ok(stoppedAt > 1)
  assert.equal(secondMissionCalls, stoppedAt)
})
