import type { SpaceWeatherData } from '../lib/types'
import { DataSourceBadge } from './DataSourceBadge'

interface SpaceWeatherProps {
  data?: SpaceWeatherData
}

// Kp bands follow the NOAA scale: quiet, unsettled/active, storm.
function kpTone(kp: number | null): string {
  if (kp === null) return 'text-ink-3'
  if (kp < 4) return 'text-ok'
  if (kp < 5) return 'text-signal'
  return 'text-bad'
}

function KpMeter({ kp }: { kp: number | null }) {
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => {
        const v = i + 1
        const active = kp !== null && kp >= v - 0.5
        return <div key={i} className={`h-3 flex-1 border border-ink ${active ? (v >= 5 ? 'bg-bad' : v >= 4 ? 'bg-signal-hot' : 'bg-ink') : 'bg-transparent'}`} />
      })}
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string | number | null; unit: string }) {
  return (
    <div className="border-l border-rule pl-3">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-mono text-xl font-bold text-ink">{value ?? '—'}</div>
      <div className="font-mono text-[11px] text-ink-3">{unit}</div>
    </div>
  )
}

export function SpaceWeather({ data }: SpaceWeatherProps) {
  if (!data) {
    return (
      <div className="sheet p-5 animate-pulse" aria-hidden="true">
        <div className="mb-6 h-4 w-32 bg-paper-2" />
        <div className="flex gap-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 w-20 bg-paper-2" />)}
        </div>
      </div>
    )
  }

  return (
    <section className="sheet min-w-0 p-3 sm:p-5" aria-labelledby="space-weather-title">
      <div className="mb-3 flex min-w-0 flex-col items-start gap-1">
        <div>
          <p className="eyebrow">Earth context · now, not replay</p>
          <h2 id="space-weather-title" className="font-display text-lg font-semibold text-ink">Space Weather</h2>
        </div>
        <div className="min-w-0">
          <DataSourceBadge provenance={data.provenance} />
          {data.timestamp && <time dateTime={data.timestamp} className="block font-mono text-[11px] text-ink-3">Oldest displayed observation: {new Date(data.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</time>}
        </div>
      </div>

      <div className="grid gap-5 border-t border-ink pt-4 sm:grid-cols-[minmax(150px,auto)_1fr] sm:items-center">
        <div>
          <div className="eyebrow">Kp Index</div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-5xl font-bold leading-none text-ink">{data.kpIndex?.toFixed(1) ?? '—'}</span>
            <span className={`font-mono text-sm font-bold uppercase tracking-wider ${kpTone(data.kpIndex)}`}>{data.kpCategory}</span>
          </div>
          <div className="mt-2 w-full max-w-[220px]">
            <KpMeter kp={data.kpIndex} />
            <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-3">
              <span>1</span><span>3</span><span>5</span><span>7</span><span>9</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
          <Stat label="Solar Wind" value={data.solarWindSpeed} unit="km/s" />
          <Stat label="Density" value={data.solarWindDensity} unit="p/cm³" />
          <Stat label="IMF Bz" value={data.imfBz === null ? null : `${data.imfBz > 0 ? '+' : ''}${data.imfBz}`} unit="nT" />
          <Stat label="IMF Bt" value={data.imfBt} unit="nT" />
        </div>
      </div>
    </section>
  )
}
