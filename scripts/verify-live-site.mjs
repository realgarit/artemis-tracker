import { readFile } from 'node:fs/promises'

const base = process.env.DEPLOYMENT_URL || 'https://artemis.realgar.ch/'
const timeout = (ms = 12_000) => AbortSignal.timeout(ms)

async function fetchPublic(path) {
  const response = await fetch(new URL(path, base), { signal: timeout() })
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`)
  return response
}

async function main() {
  const domain = (await readFile(new URL('../CNAME', import.meta.url), 'utf8')).trim()
  if (domain !== 'artemis.realgar.ch') throw new Error('The custom-domain CNAME does not match the configured production host.')

  const home = await fetchPublic('/')
  const homeHtml = await home.text()
  if (!homeHtml.includes('<div id="root">')) throw new Error('The production root is missing the application mount point.')

  for (const route of ['artemis-i', 'artemis-ii', 'artemis-ii/crew']) {
    const response = await fetch(new URL(route, base), { signal: timeout() })
    if (!response.ok && response.status !== 404) throw new Error(`Direct route ${route} returned HTTP ${response.status}.`)
    if (!(await response.text()).includes('<div id="root">')) throw new Error(`Direct route ${route} did not return the application shell.`)
  }

  const manifest = await (await fetchPublic('data/status.json')).json()
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.feeds)) throw new Error('Snapshot status manifest is missing or has an unsupported schema.')
  const feedStatuses = new Set(['fresh', 'preserved', 'unavailable', 'not-applicable'])
  const failureCategories = new Set(['no-observation', 'timeout', 'http', 'network', 'parse', 'invalid-data', 'invalid-previous-data', 'other'])
  if (!manifest.generatedAt || !Number.isFinite(Date.parse(manifest.generatedAt)) || manifest.feeds.some((feed) => !feedStatuses.has(feed.status) || (feed.failureCategory !== null && !failureCategories.has(feed.failureCategory)) || (feed.observationAt !== null && !Number.isFinite(Date.parse(feed.observationAt))) || (feed.ageSeconds !== null && !Number.isFinite(feed.ageSeconds)))) {
    throw new Error('Snapshot status manifest contains invalid feed state, failure category, observation time, or age.')
  }
  for (const file of ['spaceweather.json', 'dsn.json']) {
    const envelope = await (await fetchPublic(`data/${file}`)).json()
    if (envelope.schemaVersion !== 1 || !envelope.generatedAt || !envelope.data) throw new Error(`${file} is missing a supported versioned snapshot.`)
  }
  for (const missionId of ['artemis-i', 'artemis-ii']) {
    const ephemeris = await (await fetchPublic(`data/missionEphemerides-${missionId}.json`)).json()
    if (ephemeris.schemaVersion !== 1 || !Array.isArray(ephemeris.missions) || !ephemeris.missions.some((mission) => mission.missionId === missionId)) throw new Error(`The NASA/JPL ${missionId} ephemeris bundle is missing or has an unsupported schema.`)
    await fetchPublic(`data/missionEphemerides-${missionId}.json.gz`)
  }
  await fetchPublic('calendar/artemis-iii.ics')
  await fetchPublic('calendar/artemis-iv.ics')
  console.log(`Live Pages verification passed for ${base}. Feed states: ${manifest.feeds.map((feed) => `${feed.id}=${feed.status}`).join(', ')}.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Live Pages verification failed.')
  process.exitCode = 1
})
