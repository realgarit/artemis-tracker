import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { MISSIONS } from '../src/data/missionData.ts'
import { assertValidMissionCatalog } from '../src/data/validateMissionCatalog.ts'
import { createMissionCalendar } from '../src/lib/calendar.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const calendarDirectory = join(root, 'public', 'calendar')

async function main() {
  assertValidMissionCatalog()
  await mkdir(calendarDirectory, { recursive: true })
  for (const mission of Object.values(MISSIONS).filter((item) => item.status !== 'completed')) {
    const id = mission.id
    const temporary = join(calendarDirectory, `${id}.${randomUUID()}.tmp`)
    await writeFile(temporary, createMissionCalendar(mission), 'utf8')
    await rename(temporary, join(calendarDirectory, `${id}.ics`))
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Calendar generation failed.')
  process.exitCode = 1
})
