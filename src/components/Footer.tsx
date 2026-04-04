import type { TrajectoryData } from '../lib/types'

const APP_VERSION = __APP_VERSION__

interface FooterProps {
  trajectory?: TrajectoryData
}

export function Footer({ trajectory }: FooterProps) {
  return (
    <footer className="border-t border-cyan-mid/6 mt-6">
      <div className="mx-auto max-w-[1600px] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4 text-[9px] text-slate-600">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <span>
              Position & velocity:{' '}
              <span className="text-slate-500">
                {trajectory?.source || 'JPL Horizons (SPKID -1024 · Orion)'}
              </span>
            </span>
            <span>
              Space weather: <span className="text-slate-500">NOAA SWPC (live)</span>
            </span>
          </div>
          <div className="flex gap-x-5 gap-y-1 font-mono">
            <span>All times UTC</span>
            <span>Updates every 5s</span>
            <span className="text-slate-700">v{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
