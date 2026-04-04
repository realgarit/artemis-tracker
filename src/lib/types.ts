// === API Response Types ===

export interface TrajectoryData {
  distanceFromEarth: number
  distanceFromMoon: number
  velocity: number
  acceleration: number
  altitude: number
  commsDelay: number
  latitude: number
  longitude: number
  phase: string
  source: string
  timestamp: string
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
  kpIndex: number
  kpCategory: string
  solarWindSpeed: number
  solarWindDensity: number
  imfBz: number
  imfBt: number
  source: string
  timestamp: string
}

export interface HistoryPoint {
  timestamp: string
  value: number
}

export interface HistoryData {
  data: HistoryPoint[]
  source: string
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
}

// === Activity Log ===

export interface ActivityLogEntry {
  id: string
  timestamp: string
  message: string
  phase: string
}
