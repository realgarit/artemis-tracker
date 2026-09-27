import type { MissionConfig } from './missionData'
import { MISSIONS } from './missionData'
import bundled from '../../data/generated/missionEphemerides.generated.json'

export interface CatalogIssue { missionId: string; message: string }

export function validateMissionCatalog(
  missions: MissionConfig[] = Object.values(MISSIONS),
  availableEphemerisIds: string[] = bundled.missions.map((mission) => mission.missionId),
): CatalogIssue[] {
  const issues: CatalogIssue[] = []
  const ids = new Set<string>()
  for (const mission of missions) {
    const add = (message: string) => issues.push({ missionId: mission.id, message })
    if (!/^artemis-[ivxlcdm]+$/.test(mission.id)) add('Mission ID is not a supported canonical route.')
    if (ids.has(mission.id)) add('Mission ID is duplicated.')
    ids.add(mission.id)
    if (!mission.name.trim()) add('Mission name is required.')
    if (!/^https:\/\//.test(mission.sourceUrl)) add('Mission source must be an HTTPS URL.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(mission.verifiedAt) || !Number.isFinite(Date.parse(`${mission.verifiedAt}T00:00:00Z`))) add('Last verification date must be an ISO calendar date.')
    if (!mission.objective.trim()) add('A sourced mission objective is required.')
    if (mission.status === 'planned' || mission.status === 'cancelled') {
      if (!mission.launchWindow?.trim()) add('A planned mission needs a published launch window or TBD label.')
      if (mission.launchDate || mission.splashdownDate || mission.totalDays !== 0) add('A planned mission cannot carry an exact flown-mission timeline.')
      if (mission.trajectoryDatasetId) add('A planned mission cannot point at a flight-ephemeris dataset.')
      if (!Number.isInteger(mission.calendarSequence) || mission.calendarSequence < 0) add('Calendar sequence must be a non-negative integer.')
      continue
    }
    if (mission.trajectoryDatasetId && !availableEphemerisIds.includes(mission.trajectoryDatasetId)) add('The catalog points at a flight-ephemeris dataset that is not available.')
    const launch = Date.parse(mission.launchDate)
    const splashdown = Date.parse(mission.splashdownDate || '')
    if (!Number.isFinite(launch) || !Number.isFinite(splashdown) || splashdown <= launch) {
      add('Completed mission launch and splashdown timestamps must be valid and ordered.')
      continue
    }
    if (mission.phases.length === 0) add('A completed mission must have at least one sourced phase.')
    let previousEnd = launch - 86_400_000
    for (const phase of mission.phases) {
      const phaseStart = Date.parse(phase.startTime)
      const phaseEnd = Date.parse(phase.endTime)
      if (!phase.name.trim() || !Number.isFinite(phaseStart) || !Number.isFinite(phaseEnd) || phaseEnd <= phaseStart) add(`Phase "${phase.name}" has an invalid time interval.`)
      if (phaseStart < previousEnd) add(`Phase "${phase.name}" overlaps or is out of order.`)
      previousEnd = phaseEnd
    }
    let previousMilestone = launch - 86_400_000
    const milestoneNames = new Set<string>()
    for (const milestone of mission.milestones) {
      const time = Date.parse(milestone.time)
      if (!milestone.name.trim() || !Number.isFinite(time)) add(`Milestone "${milestone.name}" has no valid timestamp.`)
      if (time < previousMilestone) add(`Milestone "${milestone.name}" is out of chronological order.`)
      if (milestoneNames.has(milestone.name)) add(`Milestone "${milestone.name}" is duplicated.`)
      milestoneNames.add(milestone.name)
      previousMilestone = time
    }
    if (mission.crew.some((member) => !member.name.trim() || !member.role.trim() || !member.agency.trim())) add('Every listed crew member needs a name, role, and agency.')
  }
  return issues
}

export function assertValidMissionCatalog(): void {
  const issues = validateMissionCatalog()
  if (issues.length) throw new Error(issues.map((issue) => `${issue.missionId}: ${issue.message}`).join('\n'))
}
