import type { MissionConfig } from '../data/missionData'

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function foldLine(line: string): string[] {
  const chunks: string[] = []
  let current = ''
  let width = 0
  for (const character of line) {
    const bytes = new TextEncoder().encode(character).length
    if (width + bytes > 73) {
      chunks.push(current)
      current = ` ${character}`
      width = 1 + bytes
    } else {
      current += character
      width += bytes
    }
  }
  chunks.push(current)
  return chunks
}

export function createMissionCalendar(mission: MissionConfig, sequence = mission.calendarSequence): string {
  const stamp = `${mission.verifiedAt.replace(/-/g, '')}T000000Z`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Artemis Mission Tracker//Schedule Follow-up//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTODO',
    `UID:follow-${mission.id}@artemis.realgar.ch`,
    `DTSTAMP:${stamp}`,
    `LAST-MODIFIED:${stamp}`,
    `SEQUENCE:${Math.max(0, Math.floor(sequence))}`,
    `SUMMARY:${escapeText(mission.status === 'cancelled' ? `${mission.name} mission cancelled` : `Check the ${mission.name} schedule`)}`,
    `DESCRIPTION:${escapeText(mission.status === 'cancelled' ? `NASA has marked ${mission.name} as cancelled. Check the official mission page for the latest record.` : `${mission.launchWindow || 'Schedule date unavailable'} · ${mission.objective}\nFollow the official schedule at NASA. No event time is confirmed.`)}`,
    `URL:${mission.sourceUrl}`,
    `STATUS:${mission.status === 'cancelled' ? 'CANCELLED' : 'NEEDS-ACTION'}`,
    'END:VTODO',
    'END:VCALENDAR',
  ]
  return `${lines.flatMap(foldLine).join('\r\n')}\r\n`
}

export async function downloadMissionCalendar(mission: MissionConfig): Promise<void> {
  const content = createMissionCalendar(mission)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = `${mission.id}.ics`
    link.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}
