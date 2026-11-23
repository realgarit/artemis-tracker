// Release-gate dependency audit.
//
// Fails on every high or critical npm advisory except the ones listed in
// ACCEPTED below. An entry belongs there only while no patched release of the
// affected package exists; delete it as soon as one does. The script also
// fails when an accepted advisory no longer applies, so a stale exception
// cannot linger.
import { execSync } from 'node:child_process'

// Format: 'GHSA-xxxx-xxxx-xxxx': 'package, why it is accepted, date checked'.
const ACCEPTED = {}

function readAudit() {
  try {
    return execSync('npm audit --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 })
  } catch (error) {
    // npm audit exits non-zero when it finds anything; its report is still on stdout.
    if (typeof error.stdout === 'string' && error.stdout.trim().startsWith('{')) return error.stdout
    throw error
  }
}

const report = JSON.parse(readAudit())
if (report.error) {
  console.error(`npm audit could not run: ${report.error.summary || report.error.code}`)
  process.exit(1)
}

const advisories = new Map()
for (const vulnerability of Object.values(report.vulnerabilities || {})) {
  for (const via of vulnerability.via) {
    if (typeof via !== 'object' || (via.severity !== 'high' && via.severity !== 'critical')) continue
    const id = /GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/.exec(via.url || '')?.[0] || String(via.source)
    advisories.set(id, via)
  }
}

const blocking = [...advisories].filter(([id]) => !(id in ACCEPTED))
const accepted = [...advisories].filter(([id]) => id in ACCEPTED)
const stale = Object.keys(ACCEPTED).filter((id) => !advisories.has(id))

for (const [id, advisory] of accepted) console.warn(`Accepted without a fix: ${id} (${advisory.name} ${advisory.range}) — ${ACCEPTED[id]}`)
for (const [id, advisory] of blocking) console.error(`${advisory.severity.toUpperCase()}: ${id} ${advisory.name} ${advisory.range} — ${advisory.title} (${advisory.url})`)
for (const id of stale) console.error(`Accepted advisory ${id} no longer applies. Remove it from ACCEPTED in scripts/audit-dependencies.mjs.`)

if (blocking.length || stale.length) process.exit(1)
console.log(`Dependency audit passed: no unaccepted high or critical advisories (${accepted.length} accepted without an upstream fix).`)
