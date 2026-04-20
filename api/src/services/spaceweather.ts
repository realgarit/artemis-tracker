// NOAA Space Weather Prediction Center (SWPC) data client

export interface SpaceWeatherResult {
  kpIndex: number
  kpCategory: string
  solarWindSpeed: number
  solarWindDensity: number
  imfBz: number
  imfBt: number
  source: string
  timestamp: string
}

let cache: { data: SpaceWeatherResult; fetchedAt: number } | null = null
const CACHE_TTL = 60_000

function getKpCategory(kp: number): string {
  if (kp < 2) return 'Quiet'
  if (kp < 4) return 'Unsettled'
  if (kp < 5) return 'Active'
  if (kp < 6) return 'Minor Storm'
  if (kp < 7) return 'Moderate Storm'
  if (kp < 8) return 'Strong Storm'
  if (kp < 9) return 'Severe Storm'
  return 'Extreme Storm'
}

async function fetchKpIndex(): Promise<{ kp: number; timestamp: string }> {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json')
    if (!res.ok) throw new Error(`SWPC Kp error: ${res.status}`)
    const data = await res.json() as any[]
    if (data.length < 1) throw new Error('No Kp data')
    const latest = data[data.length - 1]
    const kp = typeof latest === 'object' && !Array.isArray(latest) ? (latest.Kp ?? 0) : parseFloat(latest[1]) || 0
    const timestamp = typeof latest === 'object' && !Array.isArray(latest) ? (latest.time_tag || new Date().toISOString()) : (latest[0] || new Date().toISOString())
    return { kp, timestamp }
  } catch {
    return { kp: 0, timestamp: new Date().toISOString() }
  }
}

async function fetchSolarWind(): Promise<{ speed: number; density: number }> {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json')
    if (!res.ok) throw new Error(`SWPC plasma error: ${res.status}`)
    const data = await res.json() as any[]
    for (let i = data.length - 1; i >= 1; i--) {
      const speed = parseFloat(data[i][2])
      const density = parseFloat(data[i][1])
      if (!isNaN(speed) && !isNaN(density)) return { speed, density }
    }
    return { speed: 0, density: 0 }
  } catch {
    return { speed: 0, density: 0 }
  }
}

async function fetchIMF(): Promise<{ bz: number; bt: number }> {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/solar-wind/mag-5-minute.json')
    if (!res.ok) throw new Error(`SWPC mag error: ${res.status}`)
    const data = await res.json() as any[]
    for (let i = data.length - 1; i >= 1; i--) {
      const bz = parseFloat(data[i][3])
      const bt = parseFloat(data[i][6])
      if (!isNaN(bz) && !isNaN(bt)) return { bz, bt }
    }
    return { bz: 0, bt: 0 }
  } catch {
    return { bz: 0, bt: 0 }
  }
}

export async function fetchSpaceWeather(): Promise<SpaceWeatherResult> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.data

  const [kpData, solarWind, imf] = await Promise.all([fetchKpIndex(), fetchSolarWind(), fetchIMF()])

  const result: SpaceWeatherResult = {
    kpIndex: Math.round(kpData.kp * 100) / 100,
    kpCategory: getKpCategory(kpData.kp),
    solarWindSpeed: Math.round(solarWind.speed * 10) / 10,
    solarWindDensity: Math.round(solarWind.density * 10) / 10,
    imfBz: Math.round(imf.bz * 10) / 10,
    imfBt: Math.round(imf.bt * 10) / 10,
    source: 'NOAA SWPC',
    timestamp: kpData.timestamp,
  }

  cache = { data: result, fetchedAt: Date.now() }
  return result
}
