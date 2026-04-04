import { Satellite, Radio } from 'lucide-react'

interface HeaderProps {
  missionName?: string
}

export function Header({ missionName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass-panel-solid border-b border-cyan-mid/8">
      <div className="mx-auto max-w-[1600px] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Satellite className="h-5 w-5 text-cyan-glow" strokeWidth={1.5} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-glow live-pulse" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg font-bold tracking-[.15em] text-cyan-glow glow-cyan leading-none">
              {missionName?.toUpperCase() || 'ARTEMIS II'}
            </h1>
            <p className="text-[9px] text-slate-500 tracking-[.25em] uppercase mt-0.5 font-medium">
              Mission Control — MCC-Houston
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded bg-red-glow/8 border border-red-glow/25 px-2.5 py-1">
          <Radio className="h-3 w-3 text-red-glow live-pulse" strokeWidth={2} />
          <span className="text-[10px] font-bold text-red-glow tracking-[.15em]">LIVE</span>
        </div>
      </div>
    </header>
  )
}
