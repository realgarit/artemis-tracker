import { assertValidMissionCatalog } from '../src/data/validateMissionCatalog.ts'
import { GLOSSARY, MISSION_EVENTS, validateMissionEvents } from '../src/data/missionEvents.ts'

assertValidMissionCatalog()
const eventIssues = validateMissionEvents()
if (eventIssues.length) throw new Error(eventIssues.join('\n'))
for (const missionId of ['artemis-i', 'artemis-ii']) {
  if (MISSION_EVENTS.filter((event) => event.missionId === missionId).length < 6) throw new Error(`${missionId} needs at least six event-guide items.`)
}
if (GLOSSARY.length < 10 || GLOSSARY.some((entry) => !entry.term.trim() || !entry.explanation.trim() || (entry.sourceUrl && !/^https:\/\//.test(entry.sourceUrl)))) throw new Error('Mission glossary metadata is incomplete or has an invalid official reference URL.')
console.log('Mission and event catalogs are valid.')
