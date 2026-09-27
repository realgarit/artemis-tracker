// === API Response Types ===
import type { DataProvenance } from './provenance'

export interface TrajectoryData {
  distanceFromEarth: number | null
  distanceFromMoon: number | null
  velocity: number | null
  acceleration: number | null
  altitude: number | null
  commsDelay: number | null
  latitude: number | null
  longitude: number | null
  phase: string
  source: string
  timestamp: string
  missionId?: string
  provenance?: DataProvenance
}

export interface MissionPhase {
  name: string
  status: 'completed' | 'active' | 'upcoming'
  startTime: string
  endTime: string
}

export interface CrewMember {
  name: string
  role: string
  agency: string
}

export interface MissionData {
  name: string
  sourceUrl: string
  verifiedAt: string
  launchDate: string
  currentPhase: string
  missionDay: number
  totalDays: number
  progress: number
  phases: MissionPhase[]
  nextMilestone: {
    name: string
    eta: string
  }
  crew: CrewMember[]
}

export interface SpaceWeatherData {
  kpIndex: number | null
  kpCategory: string
  solarWindSpeed: number | null
  solarWindDensity: number | null
  imfBz: number | null
  imfBt: number | null
  source: string
  timestamp: string
  fieldTimestamps?: Partial<Record<'kpIndex' | 'solarWindSpeed' | 'solarWindDensity' | 'imfBz' | 'imfBt', string | null>>
  provenance?: DataProvenance
}

export interface HistoryPoint {
  timestamp: string
  value: number
}

export interface HistoryData {
  data: HistoryPoint[]
  source: string
  provenance?: DataProvenance
}

// === DSN ===

export interface DSNTarget {
  name: string
  upSignal: number
  downSignal: number
}

export interface DSNDish {
  name: string
  site: string
  azimuth: number
  elevation: number
  targets: DSNTarget[]
}

export interface DSNData {
  dishes: DSNDish[]
  timestamp: string
  source: string
  provenance?: DataProvenance
}
