import { readFile } from 'node:fs/promises'
import { installMissionEphemerides } from '../../data/trajectoryData'

export async function loadEphemerisFixture(): Promise<void> {
  const source = await readFile(new URL('../../../data/generated/missionEphemerides.generated.json', import.meta.url), 'utf8')
  installMissionEphemerides(JSON.parse(source) as unknown)
}
