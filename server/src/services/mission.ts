// Artemis II Mission Configuration & Timeline
// All times in UTC. Source: NASA Artemis II mission plan.

export interface MissionConfig {
  id: string
  name: string
  spacecraft: string
  horizonsId: string // JPL Horizons COMMAND ID
  launchDate: string
  splashdownDate: string
  totalDays: number
  crew: { name: string; role: string; agency: string }[]
  phases: {
    name: string
    startTime: string
    endTime: string
  }[]
  milestones: {
    name: string
    time: string
  }[]
}

// Artemis II mission definition
export const ARTEMIS_II: MissionConfig = {
  id: 'artemis-ii',
  name: 'Artemis II',
  spacecraft: 'Orion (Integrity)',
  horizonsId: '-1024',
  launchDate: '2026-04-01T22:35:12Z',
  splashdownDate: '2026-04-11T17:30:00Z',
  totalDays: 10,
  crew: [
    { name: 'Reid Wiseman', role: 'Commander', agency: 'NASA' },
    { name: 'Victor Glover', role: 'Pilot', agency: 'NASA' },
    { name: 'Christina Koch', role: 'Mission Specialist', agency: 'NASA' },
    { name: 'Jeremy Hansen', role: 'Mission Specialist', agency: 'CSA' },
  ],
  phases: [
    {
      name: 'Pre-Launch',
      startTime: '2026-04-01T00:00:00Z',
      endTime: '2026-04-01T22:35:12Z',
    },
    {
      name: 'Launch & Ascent',
      startTime: '2026-04-01T22:35:12Z',
      endTime: '2026-04-01T22:53:00Z',
    },
    {
      name: 'Earth Orbit',
      startTime: '2026-04-01T22:53:00Z',
      endTime: '2026-04-02T00:35:00Z',
    },
    {
      name: 'Trans-Lunar Injection',
      startTime: '2026-04-02T00:35:00Z',
      endTime: '2026-04-02T01:05:00Z',
    },
    {
      name: 'Outbound Coast',
      startTime: '2026-04-02T01:05:00Z',
      endTime: '2026-04-06T22:00:00Z',
    },
    {
      name: 'Lunar Flyby',
      startTime: '2026-04-06T22:00:00Z',
      endTime: '2026-04-07T02:00:00Z',
    },
    {
      name: 'Return Coast',
      startTime: '2026-04-07T02:00:00Z',
      endTime: '2026-04-11T14:00:00Z',
    },
    {
      name: 'Re-entry & Splashdown',
      startTime: '2026-04-11T14:00:00Z',
      endTime: '2026-04-11T17:30:00Z',
    },
  ],
  milestones: [
    { name: 'Launch', time: '2026-04-01T22:35:12Z' },
    { name: 'ICPS Separation', time: '2026-04-02T01:05:00Z' },
    { name: 'Outbound Correction Burn', time: '2026-04-03T12:00:00Z' },
    { name: 'Lunar Flyby', time: '2026-04-06T23:05:12Z' },
    { name: 'Return Correction Burn', time: '2026-04-08T18:00:00Z' },
    { name: 'Service Module Separation', time: '2026-04-11T14:00:00Z' },
    { name: 'Re-entry Interface', time: '2026-04-11T16:45:00Z' },
    { name: 'Splashdown', time: '2026-04-11T17:30:00Z' },
  ],
}

// Registry of all missions (extensible for Artemis III, IV, etc.)
export const MISSIONS: Record<string, MissionConfig> = {
  'artemis-ii': ARTEMIS_II,
}

export function getMissionStatus(config: MissionConfig) {
  const now = new Date()
  const launch = new Date(config.launchDate)
  const splashdown = new Date(config.splashdownDate)

  const missionElapsedMs = now.getTime() - launch.getTime()
  const totalMissionMs = splashdown.getTime() - launch.getTime()
  const isComplete = now >= splashdown
  const missionDay = isComplete
    ? config.totalDays
    : Math.max(1, Math.ceil(missionElapsedMs / (24 * 60 * 60 * 1000)))
  const progress = isComplete ? 100 : Math.min(100, Math.max(0, (missionElapsedMs / totalMissionMs) * 100))

  // Determine current phase
  let currentPhase = config.phases[0].name
  const phases = config.phases.map((phase) => {
    const start = new Date(phase.startTime)
    const end = new Date(phase.endTime)
    let status: 'completed' | 'active' | 'upcoming'

    if (now >= end) {
      status = 'completed'
    } else if (now >= start) {
      status = 'active'
      currentPhase = phase.name
    } else {
      status = 'upcoming'
    }

    return { ...phase, status }
  })

  // For completed missions, set phase to last phase
  if (isComplete) {
    currentPhase = config.phases[config.phases.length - 1].name
  }

  // Find next milestone
  let nextMilestone = config.milestones[config.milestones.length - 1]
  for (const milestone of config.milestones) {
    if (new Date(milestone.time) > now) {
      nextMilestone = milestone
      break
    }
  }

  return {
    name: config.name,
    spacecraft: config.spacecraft,
    launchDate: config.launchDate,
    currentPhase,
    missionDay,
    totalDays: config.totalDays,
    progress: Math.round(progress * 100) / 100,
    phases,
    nextMilestone: {
      name: nextMilestone.name,
      eta: nextMilestone.time,
    },
    crew: config.crew,
  }
}
