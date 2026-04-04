import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'

let cache: { data: unknown; fetchedAt: number } | null = null
const CACHE_TTL = 10_000 // 10 seconds

export async function dsn(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
      return { jsonBody: cache.data }
    }

    const res = await fetch('https://eyes.nasa.gov/dsn/data/dsn.xml')
    if (!res.ok) throw new Error(`DSN error: ${res.status}`)

    const xml = await res.text()
    const dishes = parseDSNXml(xml)

    // Filter for Artemis II / Orion signals
    const result = {
      dishes,
      timestamp: new Date().toISOString(),
      source: 'NASA DSN Now',
    }

    cache = { data: result, fetchedAt: Date.now() }
    return { jsonBody: result }
  } catch (err) {
    context.error('DSN error:', err)
    return { status: 500, jsonBody: { error: 'Failed to fetch DSN data' } }
  }
}

interface DSNDish {
  name: string
  site: string
  azimuth: number
  elevation: number
  targets: { name: string; upSignal: number; downSignal: number }[]
}

function parseDSNXml(xml: string): DSNDish[] {
  const dishes: DSNDish[] = []
  const dishRegex = /<dish\s+([^>]+)>/g
  const targetRegex = /<target\s+([^>]+)\/>/g
  const upRegex = /<upSignal\s+([^>]+)\/>/g
  const downRegex = /<downSignal\s+([^>]+)\/>/g

  const attrVal = (attrs: string, name: string): string => {
    const m = attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'))
    return m ? m[1] : ''
  }

  // Split by </dish> to get dish blocks
  const dishBlocks = xml.split('</dish>')
  for (const block of dishBlocks) {
    const dishMatch = /<dish\s+([^>]+)>/.exec(block)
    if (!dishMatch) continue

    const attrs = dishMatch[1]
    const name = attrVal(attrs, 'name')
    const azimuth = parseFloat(attrVal(attrs, 'azimuthAngle')) || 0
    const elevation = parseFloat(attrVal(attrs, 'elevationAngle')) || 0

    let site = 'Unknown'
    if (name.startsWith('DSS')) {
      const num = parseInt(name.replace('DSS', ''))
      if (num >= 10 && num < 30) site = 'Goldstone'
      else if (num >= 30 && num < 50) site = 'Canberra'
      else if (num >= 50 && num < 70) site = 'Madrid'
    }

    const targets: { name: string; upSignal: number; downSignal: number }[] = []
    let tMatch
    while ((tMatch = targetRegex.exec(block)) !== null) {
      targets.push({
        name: attrVal(tMatch[1], 'name'),
        upSignal: parseFloat(attrVal(tMatch[1], 'uplegRange')) || 0,
        downSignal: parseFloat(attrVal(tMatch[1], 'downlegRange')) || 0,
      })
    }

    if (targets.length > 0) {
      dishes.push({ name, site, azimuth, elevation, targets })
    }
  }

  return dishes
}

app.http('dsn', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'artemis/dsn',
  handler: dsn,
})
