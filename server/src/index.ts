import express from 'express'
import cors from 'cors'
import { MISSIONS, getMissionStatus } from './services/mission.js'
import { fetchCurrentTrajectory, fetchTrajectoryHistory } from './services/horizons.js'
import { fetchSpaceWeather } from './services/spaceweather.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Default to Artemis II
const DEFAULT_MISSION = 'artemis-ii'

// Cache for history data (separate from the service-level cache)
let velocityHistoryCache: { data: unknown; fetchedAt: number } | null = null
let distanceHistoryCache: { data: unknown; fetchedAt: number } | null = null
const HISTORY_CACHE_TTL = 5 * 60_000 // 5 minutes

// --- API Routes ---

// Mission metadata & timeline
app.get('/api/artemis/mission', (req, res) => {
  const missionId = (req.query.mission as string) || DEFAULT_MISSION
  const config = MISSIONS[missionId]
  if (!config) {
    res.status(404).json({ error: `Mission '${missionId}' not found` })
    return
  }
  res.json(getMissionStatus(config))
})

// Current trajectory (position, velocity, distances)
app.get('/api/artemis/trajectory', async (req, res) => {
  try {
    const missionId = (req.query.mission as string) || DEFAULT_MISSION
    const config = MISSIONS[missionId]
    if (!config) {
      res.status(404).json({ error: `Mission '${missionId}' not found` })
      return
    }

    const status = getMissionStatus(config)
    const trajectory = await fetchCurrentTrajectory(config.horizonsId)

    if (!trajectory) {
      res.json({
        distanceFromEarth: 0,
        distanceFromMoon: 384400,
        velocity: 0,
        acceleration: 0,
        altitude: 0,
        commsDelay: 0,
        latitude: 0,
        longitude: 0,
        phase: status.currentPhase,
        source: 'Awaiting data from JPL Horizons',
        timestamp: new Date().toISOString(),
      })
      return
    }

    res.json({
      ...trajectory,
      altitude: trajectory.distanceFromEarth,
      phase: status.currentPhase,
      source: `JPL Horizons - LIVE (SPKID ${config.horizonsId} - ${config.spacecraft})`,
    })
  } catch (err) {
    console.error('Trajectory endpoint error:', err)
    res.status(500).json({ error: 'Failed to fetch trajectory data' })
  }
})

// Space weather
app.get('/api/artemis/spaceweather', async (_req, res) => {
  try {
    const weather = await fetchSpaceWeather()
    res.json(weather)
  } catch (err) {
    console.error('Space weather endpoint error:', err)
    res.status(500).json({ error: 'Failed to fetch space weather data' })
  }
})

// Velocity history (24h)
app.get('/api/artemis/velocityhistory', async (req, res) => {
  try {
    const now = Date.now()
    if (velocityHistoryCache && now - velocityHistoryCache.fetchedAt < HISTORY_CACHE_TTL) {
      res.json(velocityHistoryCache.data)
      return
    }

    const missionId = (req.query.mission as string) || DEFAULT_MISSION
    const config = MISSIONS[missionId]
    if (!config) {
      res.status(404).json({ error: `Mission '${missionId}' not found` })
      return
    }

    const history = await fetchTrajectoryHistory(config.horizonsId, 24, 30)
    const result = {
      data: history.map((p) => ({
        timestamp: p.timestamp,
        value: p.velocity,
      })),
      source: 'JPL Horizons',
    }

    velocityHistoryCache = { data: result, fetchedAt: now }
    res.json(result)
  } catch (err) {
    console.error('Velocity history endpoint error:', err)
    res.status(500).json({ error: 'Failed to fetch velocity history' })
  }
})

// Distance history (24h)
app.get('/api/artemis/distancehistory', async (req, res) => {
  try {
    const now = Date.now()
    if (distanceHistoryCache && now - distanceHistoryCache.fetchedAt < HISTORY_CACHE_TTL) {
      res.json(distanceHistoryCache.data)
      return
    }

    const missionId = (req.query.mission as string) || DEFAULT_MISSION
    const config = MISSIONS[missionId]
    if (!config) {
      res.status(404).json({ error: `Mission '${missionId}' not found` })
      return
    }

    const history = await fetchTrajectoryHistory(config.horizonsId, 24, 30)
    const result = {
      data: history.map((p) => ({
        timestamp: p.timestamp,
        value: p.distanceFromEarth,
      })),
      source: 'JPL Horizons',
    }

    distanceHistoryCache = { data: result, fetchedAt: now }
    res.json(result)
  } catch (err) {
    console.error('Distance history endpoint error:', err)
    res.status(500).json({ error: 'Failed to fetch distance history' })
  }
})

// List available missions
app.get('/api/missions', (_req, res) => {
  const missions = Object.entries(MISSIONS).map(([id, config]) => ({
    id,
    name: config.name,
    spacecraft: config.spacecraft,
    launchDate: config.launchDate,
  }))
  res.json(missions)
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Artemis Tracker API running on http://localhost:${PORT}`)
  console.log(`   Tracking: ${Object.values(MISSIONS).map((m) => m.name).join(', ')}`)
})
