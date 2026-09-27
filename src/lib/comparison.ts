export interface TimedValue { timestamp: number; value: number }
export interface AlignedValue { x: number; timestamp: number; value: number }
export interface ComparisonRow {
  x: number
  artemisI: number | null
  artemisII: number | null
  timeI: number | null
  timeII: number | null
}

export function alignTimedValues(points: TimedValue[], mode: 'utc' | 'elapsed' | 'event', origin: number | null): AlignedValue[] {
  if (mode !== 'utc' && origin === null) return []
  return points.map((point) => ({ x: mode === 'utc' ? point.timestamp : (point.timestamp - origin!) / 3_600_000, ...point }))
}

export function mergeAlignedValues(artemisI: AlignedValue[], artemisII: AlignedValue[]): ComparisonRow[] {
  const rows = new Map<number, ComparisonRow>()
  for (const point of artemisI) {
    const x = Math.round(point.x * 1000) / 1000
    const row = rows.get(x) || { x, artemisI: null, artemisII: null, timeI: null, timeII: null }
    row.artemisI = point.value
    row.timeI = point.timestamp
    rows.set(x, row)
  }
  for (const point of artemisII) {
    const x = Math.round(point.x * 1000) / 1000
    const row = rows.get(x) || { x, artemisI: null, artemisII: null, timeI: null, timeII: null }
    row.artemisII = point.value
    row.timeII = point.timestamp
    rows.set(x, row)
  }
  return [...rows.values()].sort((left, right) => left.x - right.x)
}

export function differenceWithinCoverage(row: ComparisonRow): number | null {
  return row.artemisI === null || row.artemisII === null ? null : row.artemisII - row.artemisI
}

export function nearestCoveredRow(rows: ComparisonRow[], x: number): ComparisonRow | null {
  if (!rows.length || !Number.isFinite(x)) return null
  return rows.reduce((best, row) => Math.abs(row.x - x) < Math.abs(best.x - x) ? row : best)
}
