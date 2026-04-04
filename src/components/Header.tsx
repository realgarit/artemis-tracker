import { Satellite, Radio } from 'lucide-react'

interface HeaderProps {
  missionName?: string
}

export function Header({ missionName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass-panel-solid border-b border-cyan-glow/10">
      <div className="mx-auto max-w-[1600px] px-4 py-3 flex items-center justify-between">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Satellite className="h-6 w-6 text-cyan-glow" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-glow live-pulse" />
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-wider text-cyan-glow glow-cyan">
              {missionName || 'ARTEMIS II'}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 tracking-widest uppercase">
              Mission Control — MCC-Houston
            </p>
          </div>
        </div>

        {/* Right: Live Badge */}
        <div className="flex items-center gap-2 rounded-full bg-red-glow/10 border border-red-glow/30 px-3 py-1.5">
          <Radio className="h-3.5 w-3.5 text-red-glow live-pulse" />
          <span className="text-xs font-semibold text-red-glow tracking-wider">LIVE</span>
        </div>
      </div>
    </header>
  )
}
