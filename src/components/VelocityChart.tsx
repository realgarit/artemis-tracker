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

interface VelocityChartProps {
  data?: HistoryData
}

function formatTime(timestamp: string) {
  const d = new Date(timestamp)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
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
      <div className="text-cyan-glow font-mono font-bold mt-0.5">
        {payload[0].value.toFixed(3)} km/s
      </div>
    </div>
  )
}

export function VelocityChart({ data }: VelocityChartProps) {
  const chartData = data?.data.map((p) => ({
    time: formatTime(p.timestamp),
    fullDate: formatFullDate(p.timestamp),
    velocity: p.value,
  })) || []

  return (
    <div className="glass-panel border-glow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-medium">
          Velocity Profile
        </h3>
        <span className="font-mono text-sm text-cyan-glow font-semibold">
          {chartData.length > 0 ? `${chartData[chartData.length - 1].velocity.toFixed(2)}` : '—'}
          <span className="text-[9px] text-slate-500 ml-1">km/s</span>
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-600">
          Loading velocity data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(34,211,238,0.1)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="velocity"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#velocityFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#22d3ee', stroke: '#fff', strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
