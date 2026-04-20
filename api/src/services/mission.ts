// Artemis II Mission Configuration & Timeline

export interface MissionConfig {
  id: string
  name: string
  spacecraft: string
  horizonsId: string
  launchDate: string
  splashdownDate: string
  totalDays: number
  crew: { name: string; role: string; agency: string }[]
  phases: { name: string; startTime: string; endTime: string }[]
  milestones: { name: string; time: string }[]
}

export const ARTEMIS_I: MissionConfig = {
  id: 'artemis-i',
  name: 'Artemis I',
  spacecraft: 'Orion (uncrewed)',
  horizonsId: '-1024',
  launchDate: '2022-11-16T06:47:44Z',
  splashdownDate: '2022-12-11T17:40:00Z',
  totalDays: 26,
  crew: [],
  phases: [
    { name: 'Pre-Launch', startTime: '2022-11-16T00:00:00Z', endTime: '2022-11-16T06:47:44Z' },
    { name: 'Launch & Ascent', startTime: '2022-11-16T06:47:44Z', endTime: '2022-11-16T08:42:00Z' },
    { name: 'Trans-Lunar Injection', startTime: '2022-11-16T08:42:00Z', endTime: '2022-11-16T11:07:00Z' },
    { name: 'Outbound Coast', startTime: '2022-11-16T11:07:00Z', endTime: '2022-11-21T12:00:00Z' },
    { name: 'Lunar Flyby', startTime: '2022-11-21T12:00:00Z', endTime: '2022-11-21T19:00:00Z' },
    { name: 'DRO Insertion', startTime: '2022-11-21T19:00:00Z', endTime: '2022-11-25T20:52:00Z' },
    { name: 'Distant Retrograde Orbit', startTime: '2022-11-25T20:52:00Z', endTime: '2022-12-01T21:53:00Z' },
    { name: 'DRO Departure', startTime: '2022-12-01T21:53:00Z', endTime: '2022-12-05T16:43:00Z' },
    { name: 'Return Coast', startTime: '2022-12-05T16:43:00Z', endTime: '2022-12-11T16:20:00Z' },
    { name: 'Re-entry & Splashdown', startTime: '2022-12-11T16:20:00Z', endTime: '2022-12-11T17:40:00Z' },
  ],
  milestones: [
    { name: 'Launch', time: '2022-11-16T06:47:44Z' },
    { name: 'TLI Burn', time: '2022-11-16T08:42:00Z' },
    { name: 'Outbound Powered Flyby', time: '2022-11-21T12:44:00Z' },
    { name: 'DRO Insertion Burn', time: '2022-11-25T20:52:00Z' },
    { name: 'DRO Departure Burn', time: '2022-12-01T21:53:00Z' },
    { name: 'Return Powered Flyby', time: '2022-12-05T16:43:00Z' },
    { name: 'Splashdown', time: '2022-12-11T17:40:00Z' },
  ],
}

export const ARTEMIS_II: MissionConfig = {
  id: 'artemis-ii',
  name: 'Artemis II',
  spacecraft: 'Orion (Integrity)',
  horizonsId: '-1024',
  launchDate: '2026-04-01T22:35:12Z',
  splashdownDate: '2026-04-11T00:21:00Z',
  totalDays: 10,
  crew: [
    { name: 'Reid Wiseman', role: 'Commander', agency: 'NASA' },
    { name: 'Victor Glover', role: 'Pilot', agency: 'NASA' },
    { name: 'Christina Koch', role: 'Mission Specialist', agency: 'NASA' },
    { name: 'Jeremy Hansen', role: 'Mission Specialist', agency: 'CSA' },
  ],
  // Official NASA Artemis II Overview Timeline (Jan 8 2026, Public Release)
  phases: [
    { name: 'Pre-Launch', startTime: '2026-04-01T00:00:00Z', endTime: '2026-04-01T22:35:12Z' },
    { name: 'LEO', startTime: '2026-04-01T22:35:12Z', endTime: '2026-04-01T23:25:00Z' },
    { name: 'High Earth Orbit', startTime: '2026-04-01T23:25:00Z', endTime: '2026-04-03T00:06:00Z' },
    { name: 'Trans-Lunar', startTime: '2026-04-03T00:06:00Z', endTime: '2026-04-06T23:58:00Z' },
    { name: 'Trans-Earth', startTime: '2026-04-06T23:58:00Z', endTime: '2026-04-10T23:48:00Z' },
    { name: 'EDL', startTime: '2026-04-10T23:48:00Z', endTime: '2026-04-11T00:21:00Z' },
    { name: 'Recovery', startTime: '2026-04-11T00:21:00Z', endTime: '2026-04-11T06:00:00Z' },
  ],
  milestones: [
    { name: 'Launch', time: '2026-04-01T22:35:12Z' },
    { name: 'Perigee Raise', time: '2026-04-01T23:25:00Z' },
    { name: 'TLI Burn', time: '2026-04-03T00:06:00Z' },
    { name: 'OTC-1', time: '2026-04-03T22:42:00Z' },
    { name: 'OTC-2', time: '2026-04-04T22:47:00Z' },
    { name: 'Lunar SOI Entry', time: '2026-04-06T05:34:00Z' },
    { name: 'Lunar Close Approach', time: '2026-04-06T23:58:00Z' },
    { name: 'Lunar SOI Exit', time: '2026-04-07T18:22:00Z' },
    { name: 'RTC-1', time: '2026-04-08T02:58:00Z' },
    { name: 'CM/SM Separation', time: '2026-04-10T23:48:00Z' },
    { name: 'Entry Interface', time: '2026-04-11T00:08:00Z' },
    { name: 'Splashdown', time: '2026-04-11T00:21:00Z' },
  ],
}

export const MISSIONS: Record<string, MissionConfig> = {
  'artemis-i': ARTEMIS_I,
  'artemis-ii': ARTEMIS_II,
}

export function getMissionStatus(config: MissionConfig) {
  const now = new Date()
  const launch = new Date(config.launchDate)
  const splashdown = new Date(config.splashdownDate)
  const elapsed = now.getTime() - launch.getTime()
  const total = splashdown.getTime() - launch.getTime()
  const isComplete = now >= splashdown
  const missionDay = isComplete
    ? config.totalDays
    : Math.max(0, Math.round((elapsed / (24 * 60 * 60 * 1000)) * 10) / 10)
  const progress = isComplete ? 100 : Math.min(100, Math.max(0, (elapsed / total) * 100))

  let currentPhase = config.phases[0].name
  const phases = config.phases.map(phase => {
    const start = new Date(phase.startTime)
    const end = new Date(phase.endTime)
    let status: 'completed' | 'active' | 'upcoming'
    if (now >= end) { status = 'completed' }
    else if (now >= start) { status = 'active'; currentPhase = phase.name }
    else { status = 'upcoming' }
    return { ...phase, status }
  })

  if (isComplete) {
    currentPhase = config.phases[config.phases.length - 1].name
  }

  let nextMilestone = config.milestones[config.milestones.length - 1]
  for (const m of config.milestones) {
    if (new Date(m.time) > now) { nextMilestone = m; break }
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
    nextMilestone: { name: nextMilestone.name, eta: nextMilestone.time },
    crew: config.crew,
  }
}
