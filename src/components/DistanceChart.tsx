import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts'
import type { HistoryData } from '../lib/types'
import { DataSourceBadge } from './DataSourceBadge'

interface DistanceChartProps {
  data?: HistoryData
  selectedTime?: string
  onSeek?: (time: string) => void
}

function formatDistance(km: number) {
  if (km >= 1000) return `${(km / 1000).toFixed(0)}k`
  return km.toFixed(0)
}

function formatFullDate(timestamp: string) {
  const d = new Date(timestamp)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    + ' ' + `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const pt = payload[0].payload
  return (
    <div className="border border-ink bg-card px-3 py-2 text-xs shadow-[4px_4px_0_rgba(21,24,29,0.15)]">
      <div className="text-ink-3 font-mono">{pt.fullDate}</div>
      <div className="mt-0.5 font-mono font-bold text-ink">
        {Math.round(payload[0].value).toLocaleString()} km
      </div>
    </div>
  )
}

export function DistanceChart({ data, selectedTime, onSeek }: DistanceChartProps) {
  const chartData = data?.data.map((p) => ({
    timestamp: p.timestamp,
    epoch: Date.parse(p.timestamp),
    fullDate: formatFullDate(p.timestamp),
    distance: p.value,
  })) || []
  const firstEpoch = chartData[0]?.epoch ?? 0
  const lastEpoch = chartData[chartData.length - 1]?.epoch ?? 0
  const selectedEpoch = selectedTime ? Date.parse(selectedTime) : Number.NaN
  const selectedPoint = chartData.length && selectedEpoch >= firstEpoch && selectedEpoch <= lastEpoch
    ? chartData.reduce((nearest, point) => Math.abs(point.epoch - selectedEpoch) < Math.abs(nearest.epoch - selectedEpoch) ? point : nearest, chartData[0])
    : null
  const dayTicks = Array.from({ length: Math.floor((lastEpoch - firstEpoch) / 86_400_000) + 1 }, (_, index) => firstEpoch + index * 86_400_000)
  const tickStep = Math.max(1, Math.ceil(dayTicks.length / 9))

  return (
    <div className="sheet min-w-0 p-3 sm:p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-ink">Distance from Earth center</h3>
        <p className="font-mono text-sm text-ink">
          <span className="eyebrow mr-2">Selected</span>
          {selectedPoint ? Math.round(selectedPoint.distance).toLocaleString() : '—'} km
        </p>
      </div>
      {data?.provenance && <DataSourceBadge provenance={data.provenance} />}
      {onSeek && <p className="mt-2 text-xs text-ink-3">Select a chart point to seek the map and mission timeline.</p>}

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-ink-3">
          Loading distance data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} onClick={(event: any) => { const point = event?.activePayload?.[0]?.payload; if (point?.timestamp) onSeek?.(point.timestamp) }}>
            <CartesianGrid vertical={false} stroke="var(--color-rule)" />
            <XAxis
              dataKey="epoch"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={dayTicks.filter((_, index) => index % tickStep === 0)}
              tickFormatter={(value) => `+${Math.round((Number(value) - firstEpoch) / 86_400_000)}d`}
              tick={{ fill: 'var(--color-ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickLine={{ stroke: 'var(--color-ink)' }}
              axisLine={{ stroke: 'var(--color-ink)' }}
            />
            <YAxis
              tick={{ fill: 'var(--color-ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              width={55}
              tickFormatter={formatDistance}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedPoint && <ReferenceLine x={selectedPoint.epoch} stroke="var(--color-signal-hot)" strokeWidth={1.5} />}
            {selectedPoint && <ReferenceDot x={selectedPoint.epoch} y={selectedPoint.distance} r={5} fill="var(--color-signal-hot)" stroke="var(--color-ink)" strokeWidth={1.5} />}
            <Area
              type="linear"
              dataKey="distance"
              stroke="var(--color-ink)"
              strokeWidth={1.75}
              fill="var(--color-ink)"
              fillOpacity={0.06}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-blue)', stroke: 'var(--color-card)', strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
      <details className="mt-2">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm text-blue underline underline-offset-4">Read distance samples</summary>
        <div className="max-h-56 overflow-auto">
          <table className="w-full text-left text-xs"><caption className="sr-only">Distance samples in UTC</caption><thead><tr><th scope="col" className="p-2">Time (UTC)</th><th scope="col" className="p-2">Distance (km)</th></tr></thead><tbody>{chartData.map((point) => <tr key={point.timestamp}><td className="p-2 font-mono">{point.fullDate}</td><td className="p-2 font-mono">{point.distance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td></tr>)}</tbody></table>
        </div>
      </details>
    </div>
  )
}
