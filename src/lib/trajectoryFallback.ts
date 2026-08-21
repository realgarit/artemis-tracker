import type { TrajectoryData } from './types'
import { EARTH_RADIUS_KM, getMissionConfigs } from '../data/trajectoryData'

const SPEED_OF_LIGHT_KM_S = 299792.458

function interpolateVector(points: number[][], index: number): number[] {
  if (points.length === 0) return [0, 0, 0]
  if (points.length === 1) return points[0]
  const lower = Math.max(0, Math.min(points.length - 1, Math.floor(index)))
  const upper = Math.max(0, Math.min(points.length - 1, lower + 1))
  const fraction = Math.max(0, Math.min(1, index - lower))
  return points[lower].map((value, axis) => value + (points[upper][axis] - value) * fraction)
}

function sampleAtDay(points: number[][], startDay: number, stepDays: number, day: number): number[] {
  if (points.length === 0) return [0, 0, 0]
  const index = (day - startDay) / stepDays
  return interpolateVector(points, index)
}

function distance(a: number[], b = [0, 0, 0]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

function speedAtDay(config: ReturnType<typeof getMissionConfigs>[number], day: number): number {
  const step = Math.max(config.trajStepDays / 10, 0.001)
  const current = sampleAtDay(config.trajectory, config.trajStartDay, config.trajStepDays, day)
  const previous = sampleAtDay(config.trajectory, config.trajStartDay, config.trajStepDays, Math.max(config.trajStartDay, day - step))
  return distance(current, previous) / (step * 86400)
}

export function getTrajectoryFallback(missionId: string, now = new Date()): TrajectoryData {
  const config = getMissionConfigs().find((mission) => mission.id === missionId) || getMissionConfigs()[0]
  const rawDay = (now.getTime() - config.launchTime) / 86400000
  const day = Math.max(0, Math.min(config.missionDays, rawDay))
  const position = sampleAtDay(config.trajectory, config.trajStartDay, config.trajStepDays, day)
  const moon = sampleAtDay(config.moon, config.trajStartDay, config.trajStepDays, day)
  const distanceFromEarth = distance(position)
  const distanceFromMoon = distance(position, moon)
  const velocity = speedAtDay(config, day)
  const previousVelocity = speedAtDay(config, Math.max(0, day - 0.01))

  return {
    timestamp: now.toISOString(),
    distanceFromEarth: Math.round(distanceFromEarth * 100) / 100,
    distanceFromMoon: Math.round(distanceFromMoon * 100) / 100,
    velocity: Math.round(velocity * 1000) / 1000,
    acceleration: Math.round(((velocity - previousVelocity) / 864) * 10000) / 10000,
    altitude: Math.max(0, Math.round((distanceFromEarth - EARTH_RADIUS_KM) * 100) / 100),
    commsDelay: Math.round((distanceFromEarth / SPEED_OF_LIGHT_KM_S) * 100) / 100,
    latitude: Math.round(Math.atan2(position[2], Math.hypot(position[0], position[1])) * (180 / Math.PI) * 100) / 100,
    longitude: Math.round(Math.atan2(position[1], position[0]) * (180 / Math.PI) * 100) / 100,
    phase: config.getPhase(day),
    source: 'Local Artemis trajectory replay',
  }
}
