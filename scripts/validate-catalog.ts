import { assertValidMissionCatalog } from '../src/data/validateMissionCatalog.ts'
import { GLOSSARY, MISSION_EVENTS } from '../src/data/missionEvents.ts'

assertValidMissionCatalog()
const events = new Set<string>()
for (const event of MISSION_EVENTS) {
  if (events.has(event.id)) throw new Error(`Duplicate mission event ID: ${event.id}`)
  events.add(event.id)
  if (!/^https:\/\//.test(event.sourceUrl) || !Number.isFinite(Date.parse(event.occurredAt))) throw new Error(`Mission event ${event.id} has invalid source metadata.`)
}
for (const missionId of ['artemis-i', 'artemis-ii']) {
  if (MISSION_EVENTS.filter((event) => event.missionId === missionId).length < 6) throw new Error(`${missionId} needs at least six event-guide items.`)
}
if (GLOSSARY.length < 10 || GLOSSARY.some((entry) => !entry.term.trim() || !entry.explanation.trim() || (entry.sourceUrl && !/^https:\/\//.test(entry.sourceUrl)))) throw new Error('Mission glossary metadata is incomplete or has an invalid official reference URL.')
console.log('Mission and event catalogs are valid.')
