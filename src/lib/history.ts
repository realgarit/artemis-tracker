// Persistent mission history using IndexedDB
// Saves trajectory snapshots so the mission can be replayed after splashdown

const DB_NAME = 'artemis-tracker'
const DB_VERSION = 1
const STORE_NAME = 'trajectory-history'

interface HistorySnapshot {
  timestamp: number
  missionDay: number
  distanceFromEarth: number
  distanceFromMoon: number
  velocity: number
  phase: string
  latitude: number
  longitude: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' })
        store.createIndex('missionDay', 'missionDay')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveSnapshot(snapshot: HistorySnapshot): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(snapshot)
    await new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error) })
  } catch {
    // Silently fail — history is non-critical
  }
}

export async function getHistory(): Promise<HistorySnapshot[]> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    return new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

export async function getSnapshotCount(): Promise<number> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    return new Promise((resolve, reject) => {
      const req = tx.objectStore(STORE_NAME).count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return 0
  }
}

// Save a snapshot every 30 seconds from live data
let saveInterval: ReturnType<typeof setInterval> | null = null

export function startHistoryRecording(getData: () => HistorySnapshot | null) {
  if (saveInterval) return
  saveInterval = setInterval(() => {
    const snapshot = getData()
    if (snapshot) saveSnapshot(snapshot)
  }, 30_000)

  // Save immediately on start
  const snapshot = getData()
  if (snapshot) saveSnapshot(snapshot)
}

export function stopHistoryRecording() {
  if (saveInterval) {
    clearInterval(saveInterval)
    saveInterval = null
  }
}
