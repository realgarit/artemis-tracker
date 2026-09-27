import { getMissionEphemerisAtTime, getMissionTrajectory } from '../data/trajectoryData'
import type { TrajectoryData } from './types'

export function getTrajectoryFallback(missionId: string, at = new Date()): TrajectoryData {
  const config = getMissionTrajectory(missionId)
  if (!config) throw new Error(`No validated ephemeris is available for mission ${missionId}`)
  const timestamp = at.toISOString()
  const sample = getMissionEphemerisAtTime(missionId, at.getTime())
  if (!sample) {
    return {
      timestamp,
      missionId,
      distanceFromEarth: null,
      distanceFromMoon: null,
      velocity: null,
      acceleration: null,
      altitude: null,
      commsDelay: null,
      latitude: null,
      longitude: null,
      phase: config.getPhase((at.getTime() - config.launchTime) / 86_400_000),
      source: config.provenance.provider,
      provenance: { ...config.provenance, observedAt: undefined, summary: 'No state-vector sample covers this mission time; no extrapolation is shown' },
    }
  }
  return {
    timestamp: sample.timestamp,
    missionId,
    distanceFromEarth: sample.distanceFromEarth,
    distanceFromMoon: sample.distanceFromMoon,
    velocity: sample.velocity,
    acceleration: sample.acceleration,
    altitude: sample.altitude,
    commsDelay: sample.commsDelay,
    latitude: null,
    longitude: null,
    phase: sample.phase,
    source: sample.provenance.provider,
    provenance: sample.provenance,
  }
}
