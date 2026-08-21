import type { DSNData, DSNDish } from './types'

export const DSN_ENDPOINT = 'https://eyes.nasa.gov/dsn/data/dsn.xml'

function attribute(attributes: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = attributes.match(new RegExp(`${escaped}\\s*=\\s*["']([^"']*)["']`, 'i'))
  return match?.[1] || ''
}

function numberAttribute(attributes: string, name: string): number {
  const value = Number.parseFloat(attribute(attributes, name))
  return Number.isFinite(value) ? value : 0
}

function siteForDish(name: string): string {
  const number = Number.parseInt(name.replace(/^DSS/i, ''), 10)
  if (number >= 10 && number < 30) return 'Goldstone'
  if (number >= 30 && number < 50) return 'Canberra'
  if (number >= 50 && number < 70) return 'Madrid'
  return 'Unknown'
}

export function parseDSNXml(xml: string): DSNDish[] {
  const dishes: DSNDish[] = []
  const blocks = xml.split(/<\/dish\s*>/i)
  for (const block of blocks) {
    const dishMatch = block.match(/<dish\s+([^>]+)>/i)
    if (!dishMatch) continue

    const dishAttributes = dishMatch[1]
    const targets: DSNDish['targets'] = []
    const targetRegex = /<target\s+([^>]*?)(?:\/?>)/gi
    let targetMatch: RegExpExecArray | null
    while ((targetMatch = targetRegex.exec(block)) !== null) {
      const targetAttributes = targetMatch[1]
      targets.push({
        name: attribute(targetAttributes, 'name'),
        upSignal: numberAttribute(targetAttributes, 'uplegRange'),
        downSignal: numberAttribute(targetAttributes, 'downlegRange'),
      })
    }

    if (targets.length === 0) continue
    const name = attribute(dishAttributes, 'name')
    dishes.push({
      name,
      site: siteForDish(name),
      azimuth: numberAttribute(dishAttributes, 'azimuthAngle'),
      elevation: numberAttribute(dishAttributes, 'elevationAngle'),
      targets,
    })
  }
  return dishes
}

async function fetchWithTimeout(url: string, timeoutMs = 15_000): Promise<Response> {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`DSN API error: ${response.status}`)
    return response
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

export async function fetchDSN(): Promise<DSNData> {
  const xml = await (await fetchWithTimeout(DSN_ENDPOINT)).text()
  return {
    dishes: parseDSNXml(xml),
    timestamp: new Date().toISOString(),
    source: 'NASA DSN Now',
  }
}
