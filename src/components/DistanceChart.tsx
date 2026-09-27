import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { HistoryData } from '../lib/types'
import { DataSourceBadge } from './DataSourceBadge'

interface DistanceChartProps {
  data?: HistoryData
  selectedTime?: string
  onSeek?: (time: string) => void
}

function formatTime(timestamp: string) {
  const d = new Date(timestamp)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
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
    <div className="glass-panel-solid px-3 py-2 text-xs">
      <div className="text-slate-400 font-mono">{pt.fullDate}</div>
      <div className="text-amber-glow font-mono font-bold mt-0.5">
        {Math.round(payload[0].value).toLocaleString()} km
      </div>
    </div>
  )
}

export function DistanceChart({ data, selectedTime, onSeek }: DistanceChartProps) {
  const chartData = data?.data.map((p) => ({
    timestamp: p.timestamp,
    time: formatTime(p.timestamp),
    fullDate: formatFullDate(p.timestamp),
    distance: p.value,
  })) || []

  return (
    <div className="glass-panel border-glow-amber p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-medium">
          Distance from Earth center
        </h3>
        <span className="font-mono text-sm text-amber-glow font-semibold">
          {chartData.length > 0 ? `${Math.round(chartData[chartData.length - 1].distance).toLocaleString()}` : '—'}
          <span className="text-[9px] text-slate-500 ml-1">km</span>
        </span>
      </div>
      {data?.provenance && <DataSourceBadge provenance={data.provenance} />}
      {onSeek && <p className="mt-2 text-xs text-slate-500">Select a chart point to seek the map and mission timeline.</p>}

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-600">
          Loading distance data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} onClick={(event: any) => { const point = event?.activePayload?.[0]?.payload; if (point?.timestamp) onSeek?.(point.timestamp) }}>
            <defs>
              <linearGradient id="distanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.06)" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(245,158,11,0.1)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              width={55}
              tickFormatter={formatDistance}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedTime && <ReferenceLine x={chartData.reduce((nearest, point) => Math.abs(Date.parse(point.timestamp) - Date.parse(selectedTime)) < Math.abs(Date.parse(nearest.timestamp) - Date.parse(selectedTime)) ? point : nearest, chartData[0])?.time} stroke="#f8fafc" strokeDasharray="4 4" label={{ value: 'Selected mission time', fill: '#e2e8f0', fontSize: 10 }} />}
            <Area
              type="monotone"
              dataKey="distance"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#distanceFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
      <details className="mt-2">
        <summary className="min-h-11 cursor-pointer py-2 text-xs text-slate-400 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">Read distance samples</summary>
        <div className="max-h-56 overflow-auto">
          <table className="w-full text-left text-xs"><caption className="sr-only">Distance samples in UTC</caption><thead><tr><th scope="col" className="p-2">Time (UTC)</th><th scope="col" className="p-2">Distance (km)</th></tr></thead><tbody>{chartData.map((point) => <tr key={point.timestamp}><td className="p-2 font-mono">{point.fullDate}</td><td className="p-2 font-mono">{point.distance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td></tr>)}</tbody></table>
        </div>
      </details>
    </div>
  )
}
