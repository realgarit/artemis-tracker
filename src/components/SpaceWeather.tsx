import { motion } from 'framer-motion'
import type { SpaceWeatherData } from '../lib/types'
import { DataSourceBadge } from './DataSourceBadge'

interface SpaceWeatherProps {
  data?: SpaceWeatherData
}

function getKpColor(kp: number | null): string {
  if (kp === null) return '#64748b'
  if (kp < 2) return '#22c55e'
  if (kp < 4) return '#eab308'
  if (kp < 6) return '#f59e0b'
  if (kp < 8) return '#ef4444'
  return '#dc2626'
}

function KpMeter({ kp }: { kp: number | null }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 9 }, (_, i) => {
        const v = i + 1
        const active = kp !== null && kp >= v - 0.5
        let color: string
        if (v <= 3) color = '#22c55e'
        else if (v <= 5) color = '#eab308'
        else if (v <= 7) color = '#f59e0b'
        else color = '#ef4444'
        return (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-sm transition-colors duration-300"
            style={{ backgroundColor: active ? color : 'rgba(100,116,139,0.12)' }}
          />
        )
      })}
    </div>
  )
}

function Stat({ label, value, unit, color, styleColor }: { label: string; value: string | number | null; unit: string; color?: string; styleColor?: string }) {
  return (
    <div className="text-center">
      <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-mono text-lg font-semibold ${color || (styleColor ? '' : 'text-white')}`} style={styleColor ? { color: styleColor } : undefined}>{value ?? '—'}</div>
      <div className="text-[8px] text-slate-600">{unit}</div>
    </div>
  )
}

export function SpaceWeather({ data }: SpaceWeatherProps) {
  if (!data) {
    return (
      <div className="glass-panel p-5 animate-pulse">
        <div className="h-4 bg-slate-700/50 rounded w-32 mb-6" />
        <div className="flex gap-8 justify-center">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-700/50 rounded w-20" />
          ))}
        </div>
      </div>
    )
  }

  const kpColor = getKpColor(data.kpIndex)

  return (
    <motion.div
      className="glass-panel border-glow min-w-0 p-4 sm:p-5"
      initial={false}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-[.2em] font-semibold">
            Space Weather
          </span>
        </div>
        <div className="text-right">
          <DataSourceBadge provenance={data.provenance} />
          {data.timestamp && <time dateTime={data.timestamp} className="block text-[8px] text-slate-500">Oldest displayed observation: {new Date(data.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</time>}
        </div>
      </div>

      {/* Horizontal layout: Kp on left, meter, then stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
        {/* Kp index — hero stat */}
        <div className="shrink-0 text-center min-w-[100px]">
          <div className="font-mono text-4xl font-bold leading-none" style={{ color: kpColor }}>
            {data.kpIndex?.toFixed(1) ?? '—'}
          </div>
          <div className="text-xs font-medium mt-1" style={{ color: kpColor }}>
            {data.kpCategory}
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">Kp Index</div>
        </div>

        {/* Kp meter — vertical separator + bar */}
        <div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-[140px]">
          <KpMeter kp={data.kpIndex} />
          <div className="flex justify-between text-[7px] text-slate-600 font-mono">
            <span>0</span><span>3</span><span>5</span><span>7</span><span>9</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-slate-700/40 shrink-0" />

        {/* Stat grid */}
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Stat label="Solar Wind" value={data.solarWindSpeed} unit="km/s" />
          <Stat label="Density" value={data.solarWindDensity} unit="p/cm³" />
          <Stat
            label="IMF Bz"
            value={data.imfBz === null ? null : `${data.imfBz > 0 ? '+' : ''}${data.imfBz}`}
            unit="nT"
            styleColor={data.imfBz !== null ? (data.imfBz < 0 ? '#ff9e9e' : '#86efac') : undefined}
          />
          <Stat label="IMF Bt" value={data.imfBt} unit="nT" />
        </div>
      </div>
    </motion.div>
  )
}
