import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { HistoryData } from '../lib/types'

interface DistanceChartProps {
  data?: HistoryData
}

function formatTime(timestamp: string) {
  const d = new Date(timestamp)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

function formatDistance(km: number) {
  if (km >= 1000) return `${(km / 1000).toFixed(0)}k`
  return km.toFixed(0)
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-panel-solid px-3 py-2 text-xs">
      <div className="text-slate-400 font-mono">{label} UTC</div>
      <div className="text-amber-glow font-mono font-bold mt-0.5">
        {Math.round(payload[0].value).toLocaleString()} km
      </div>
    </div>
  )
}

export function DistanceChart({ data }: DistanceChartProps) {
  const chartData = data?.data.map((p) => ({
    time: formatTime(p.timestamp),
    distance: p.value,
  })) || []

  return (
    <div className="glass-panel border-glow-amber p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-medium">
          Distance from Earth
        </h3>
        <span className="font-mono text-sm text-amber-glow font-semibold">
          {chartData.length > 0 ? `${Math.round(chartData[chartData.length - 1].distance).toLocaleString()}` : '—'}
          <span className="text-[9px] text-slate-500 ml-1">km</span>
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-600">
          Loading distance data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
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
    </div>
  )
}
