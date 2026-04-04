import type { TrajectoryData } from '../lib/types'

const APP_VERSION = __APP_VERSION__

interface FooterProps {
  trajectory?: TrajectoryData
}

export function Footer({ trajectory }: FooterProps) {
  return (
    <footer className="border-t border-cyan-glow/10 mt-8">
      <div className="mx-auto max-w-[1600px] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] text-slate-500">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>
              Position & velocity:{' '}
              <span className="text-slate-400">
                {trajectory?.source || 'JPL Horizons (SPKID -1024 - Orion/Integrity)'}
              </span>
            </span>
            <span>
              Space weather: <span className="text-slate-400">NOAA SWPC (live)</span>
            </span>
          </div>
          <div className="flex gap-x-6 gap-y-1">
            <span>All times UTC</span>
            <span>Updates every 5s</span>
            <span className="font-mono text-slate-600">v{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
