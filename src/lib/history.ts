import { getMission } from '../data/missionData'
import { getMissionEphemerisAtTime } from '../data/trajectoryData'

const DB_NAME = 'artemis-tracker'
const DB_VERSION = 2
const STORE_NAME = 'trajectory-history-v2'
const LEGACY_STORE_NAME = 'trajectory-history'
const RECORD_INTERVAL_MS = 30_000

export interface HistorySnapshot {
  missionId: string
  timestamp: number
  missionDay: number | null
  distanceFromEarth: number | null
  distanceFromMoon: number | null
  velocity: number | null
  phase: string
  latitude: null
  longitude: null
  mode: 'historical-replay' | 'unattributed-legacy'
  source: string
  quality: 'source epoch' | 'interpolated state vectors' | 'legacy source unavailable'
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB is unavailable.')); return }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      const transaction = request.transaction
      if (!transaction) return
      const store = database.objectStoreNames.contains(STORE_NAME)
        ? transaction.objectStore(STORE_NAME)
        : database.createObjectStore(STORE_NAME, { keyPath: ['missionId', 'timestamp'] })
      if (!store.indexNames.contains('missionId')) store.createIndex('missionId', 'missionId', { unique: false })
      if (!store.indexNames.contains('missionTime')) store.createIndex('missionTime', ['missionId', 'timestamp'], { unique: false })

      // V1 history was keyed only by timestamp, carried no mission identity,
      // and may contain synthetic values. Keep its records visibly untrusted.
      if (database.objectStoreNames.contains(LEGACY_STORE_NAME)) {
        const cursorRequest = transaction.objectStore(LEGACY_STORE_NAME).openCursor()
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result
          if (!cursor) return
          const value = cursor.value as { timestamp?: unknown; missionDay?: unknown }
          if (typeof value.timestamp === 'number' && Number.isFinite(value.timestamp)) {
            store.put({
              missionId: 'legacy-unassigned', timestamp: value.timestamp,
              missionDay: typeof value.missionDay === 'number' && Number.isFinite(value.missionDay) ? value.missionDay : null,
              distanceFromEarth: null, distanceFromMoon: null, velocity: null, phase: 'Legacy values not attributed to a mission or verified source',
              latitude: null, longitude: null, mode: 'unattributed-legacy', source: 'Legacy history · source unavailable', quality: 'legacy source unavailable',
            } satisfies HistorySnapshot)
          }
          cursor.continue()
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function createReplayHistorySnapshot(missionId: string, epoch: number): HistorySnapshot | null {
  const mission = getMission(missionId)
  if (!mission || mission.status !== 'completed' || !Number.isFinite(epoch)) return null
  const sample = getMissionEphemerisAtTime(missionId, epoch)
  if (!sample) return null
  return {
    missionId,
    timestamp: Date.parse(sample.timestamp),
    missionDay: (epoch - Date.parse(mission.launchDate)) / 86_400_000,
    distanceFromEarth: sample.distanceFromEarth,
    distanceFromMoon: sample.distanceFromMoon,
    velocity: sample.velocity,
    phase: sample.phase,
    latitude: null,
    longitude: null,
    mode: 'historical-replay',
    source: 'NASA/JSC OEM + JPL Horizons replay; not observed telemetry',
    quality: sample.stateQuality,
  }
}

export async function saveSnapshot(snapshot: HistorySnapshot, stillCurrent: () => boolean = () => true): Promise<void> {
  if (snapshot.mode !== 'historical-replay' || !snapshot.missionId || !Number.isFinite(snapshot.timestamp) || !stillCurrent()) return
  try {
    const database = await openDB()
    if (!stillCurrent()) { database.close(); return }
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(snapshot)
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    database.close()
  } catch {
    // Local history is optional and must not block the mission replay.
  }
}

export async function getHistory(missionId: string): Promise<HistorySnapshot[]> {
  try {
    const database = await openDB()
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const values = await new Promise<HistorySnapshot[]>((resolve, reject) => {
      const request = transaction.objectStore(STORE_NAME).index('missionId').getAll(IDBKeyRange.only(missionId))
      request.onsuccess = () => resolve(request.result as HistorySnapshot[])
      request.onerror = () => reject(request.error)
    })
    database.close()
    return values.sort((left, right) => left.timestamp - right.timestamp)
  } catch { return [] }
}

export async function getLegacyHistoryCount(): Promise<number> {
  try {
    const database = await openDB()
    const count = await new Promise<number>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).index('missionId').count(IDBKeyRange.only('legacy-unassigned'))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return count
  } catch { return 0 }
}

let saveInterval: ReturnType<typeof setInterval> | null = null
let recordingGeneration = 0

export function startHistoryRecording(missionId: string, getData: () => HistorySnapshot | null, intervalMs = RECORD_INTERVAL_MS): void {
  stopHistoryRecording()
  const generation = recordingGeneration
  const save = () => {
    const snapshot = getData()
    if (snapshot?.missionId === missionId && snapshot.mode === 'historical-replay') {
      void saveSnapshot(snapshot, () => recordingGeneration === generation)
    }
  }
  saveInterval = setInterval(save, intervalMs)
  save()
}

export function stopHistoryRecording(): void {
  recordingGeneration++
  if (saveInterval) clearInterval(saveInterval)
  saveInterval = null
}
