// Release-gate dependency audit.
//
// Runs `npm audit` in every directory listed in ACCEPTED (each has its own
// package-lock.json; no install is needed) and fails on every high or
// critical npm advisory except the ones accepted for that directory. An entry
// belongs there only while no patched release of the affected package exists;
// delete it as soon as one does. The script also fails when an accepted
// advisory no longer applies, so a stale exception cannot linger.
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Directory (relative to the repository root) -> accepted advisories.
// Format: 'GHSA-xxxx-xxxx-xxxx': 'package, why it is accepted, date checked'.
const ACCEPTED = {
  '.': {},
  // Legacy Azure Functions API: not deployed and not part of the Pages build.
  api: {
    // extract-zip <= 2.0.1 (every published version) is pinned by the
    // npm-shrinkwrap.json of azure-functions-core-tools, a devDependency whose
    // install script unpacks the Core Tools download with it. Goes away with a
    // patched extract-zip, a Core Tools release without it, or by dropping
    // azure-functions-core-tools from api/package.json.
    'GHSA-jmr9-qjv8-65gv': 'extract-zip symlink path traversal, no patched release (checked 2026-11-23)',
    'GHSA-7pqw-9j4j-h8q3': 'extract-zip symlink file write, no patched release (checked 2026-11-23)',
  },
}

function readAudit(directory) {
  try {
    return execSync('npm audit --json', {
      cwd: fileURLToPath(new URL(`../${directory}/`, import.meta.url)),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (error) {
    // npm audit exits non-zero when it finds anything; its report is still on stdout.
    if (typeof error.stdout === 'string' && error.stdout.trim().startsWith('{')) return error.stdout
    throw error
  }
}

function auditDirectory(directory, acceptedHere) {
  const label = directory === '.' ? 'root' : directory
  const report = JSON.parse(readAudit(directory))
  if (report.error) {
    console.error(`${label}: npm audit could not run: ${report.error.summary || report.error.code}`)
    return { failed: true, accepted: 0 }
  }

  const advisories = new Map()
  for (const vulnerability of Object.values(report.vulnerabilities || {})) {
    for (const via of vulnerability.via) {
      if (typeof via !== 'object' || (via.severity !== 'high' && via.severity !== 'critical')) continue
      const id = /GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/.exec(via.url || '')?.[0] || String(via.source)
      advisories.set(id, via)
    }
  }

  const blocking = [...advisories].filter(([id]) => !(id in acceptedHere))
  const accepted = [...advisories].filter(([id]) => id in acceptedHere)
  const stale = Object.keys(acceptedHere).filter((id) => !advisories.has(id))

  for (const [id, advisory] of accepted) console.warn(`${label}: accepted without a fix: ${id} (${advisory.name} ${advisory.range}) — ${acceptedHere[id]}`)
  for (const [id, advisory] of blocking) console.error(`${label}: ${advisory.severity.toUpperCase()}: ${id} ${advisory.name} ${advisory.range} — ${advisory.title} (${advisory.url})`)
  for (const id of stale) console.error(`${label}: accepted advisory ${id} no longer applies. Remove it from ACCEPTED in scripts/audit-dependencies.mjs.`)

  return { failed: blocking.length > 0 || stale.length > 0, accepted: accepted.length }
}

const results = Object.entries(ACCEPTED).map(([directory, acceptedHere]) => auditDirectory(directory, acceptedHere))
if (results.some((result) => result.failed)) process.exit(1)

const acceptedTotal = results.reduce((sum, result) => sum + result.accepted, 0)
console.log(`Dependency audit passed in ${Object.keys(ACCEPTED).length} directories (${Object.keys(ACCEPTED).join(', ')}): no unaccepted high or critical advisories (${acceptedTotal} accepted without an upstream fix).`)
