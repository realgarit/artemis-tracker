import type { TrajectoryData } from '../lib/types'
import { DataSourceBadge } from './DataSourceBadge'

const APP_VERSION = __APP_VERSION__

interface FooterProps {
  trajectory?: TrajectoryData
}

export function Footer({ trajectory }: FooterProps) {
  return (
    <footer className="mt-8 border-t-2 border-ink">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-3 py-3 font-mono text-[11px] text-ink-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="flex flex-wrap items-center gap-x-2">Position &amp; velocity: <DataSourceBadge provenance={trajectory?.provenance} /></span>
          <span>Space weather: NOAA SWPC</span>
        </div>
        <div className="flex gap-x-6">
          <span>All times UTC</span>
          <span>v{APP_VERSION}</span>
        </div>
      </div>
    </footer>
  )
}
