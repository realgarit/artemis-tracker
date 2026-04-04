import { motion } from 'framer-motion'
import type { SpaceWeatherData } from '../lib/types'

interface SpaceWeatherProps {
  data?: SpaceWeatherData
}

function getKpColor(kp: number): string {
  if (kp < 2) return '#22c55e' // green
  if (kp < 4) return '#eab308' // yellow
  if (kp < 6) return '#f59e0b' // amber
  if (kp < 8) return '#ef4444' // red
  return '#dc2626' // dark red
}

function KpMeter({ kp }: { kp: number }) {
  const segments = 9
  return (
    <div className="flex gap-1 mt-2">
      {Array.from({ length: segments }, (_, i) => {
        const segmentValue = i + 1
        const isActive = kp >= segmentValue - 0.5
        let color: string

        if (segmentValue <= 3) color = '#22c55e'
        else if (segmentValue <= 5) color = '#eab308'
        else if (segmentValue <= 7) color = '#f59e0b'
        else color = '#ef4444'

        return (
          <div
            key={i}
            className="flex-1 h-2 rounded-sm transition-colors duration-300"
            style={{
              backgroundColor: isActive ? color : 'rgba(100,116,139,0.15)',
            }}
          />
        )
      })}
    </div>
  )
}

export function SpaceWeather({ data }: SpaceWeatherProps) {
  if (!data) {
    return (
      <div className="glass-panel p-4 animate-pulse">
        <div className="h-4 bg-slate-700/50 rounded w-32 mb-4" />
        <div className="h-16 bg-slate-700/50 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-700/50 rounded w-full" />
          <div className="h-4 bg-slate-700/50 rounded w-3/4" />
        </div>
      </div>
    )
  }

  const kpColor = getKpColor(data.kpIndex)

  return (
    <motion.div
      className="glass-panel border-glow p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-medium">
          Space Weather
        </h3>
        <span className="text-[9px] text-slate-500 font-mono">{data.source}</span>
      </div>

      {/* Kp Index - main display */}
      <div className="text-center mb-4">
        <div
          className="font-mono text-5xl font-bold"
          style={{ color: kpColor }}
        >
          {data.kpIndex.toFixed(1)}
        </div>
        <div
          className="text-sm font-medium mt-1"
          style={{ color: kpColor }}
        >
          {data.kpCategory}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Kp Index</div>
        <KpMeter kp={data.kpIndex} />
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-slate-800/40 rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Solar Wind</div>
          <div className="font-mono text-lg text-white mt-1">{data.solarWindSpeed}</div>
          <div className="text-[10px] text-slate-500">km/s</div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Density</div>
          <div className="font-mono text-lg text-white mt-1">{data.solarWindDensity}</div>
          <div className="text-[10px] text-slate-500">p/cm³</div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">IMF Bz</div>
          <div className={`font-mono text-lg mt-1 ${data.imfBz < 0 ? 'text-red-glow' : 'text-green-glow'}`}>
            {data.imfBz > 0 ? '+' : ''}{data.imfBz}
          </div>
          <div className="text-[10px] text-slate-500">nT</div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">IMF Bt</div>
          <div className="font-mono text-lg text-white mt-1">{data.imfBt}</div>
          <div className="text-[10px] text-slate-500">nT</div>
        </div>
      </div>
    </motion.div>
  )
}
