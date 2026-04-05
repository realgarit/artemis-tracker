import { useState } from 'react'
import { Satellite, Radio, ChevronDown } from 'lucide-react'

interface HeaderProps {
  missionName?: string
  activeMissionId?: string
  onMissionChange?: (missionId: string) => void
}

const MISSIONS = [
  { id: 'artemis-i', name: 'Artemis I', status: 'completed', date: 'Nov 2022' },
  { id: 'artemis-ii', name: 'Artemis II', status: 'active', date: 'Apr 2026' },
  { id: 'artemis-iii', name: 'Artemis III', status: 'upcoming', date: '2027' },
  { id: 'artemis-iv', name: 'Artemis IV', status: 'planned', date: '2028' },
]

export function Header({ missionName, activeMissionId, onMissionChange }: HeaderProps) {
  const isCompleted = MISSIONS.find(m => m.id === activeMissionId)?.status === 'completed'
  const [showSelector, setShowSelector] = useState(false)

  return (
    <header className="sticky top-0 z-40 glass-panel-solid border-b border-cyan-mid/8">
      <div className="mx-auto max-w-[1600px] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Satellite className="h-5 w-5 text-cyan-glow" strokeWidth={1.5} />
          </div>
          <div>
            {/* Mission name + selector */}
            <div className="relative">
              <button
                onClick={() => setShowSelector(!showSelector)}
                className="flex items-center gap-1.5 font-display text-base sm:text-lg font-bold tracking-[.15em] text-cyan-glow glow-cyan leading-none hover:text-cyan-glow/90 transition-colors"
              >
                {missionName?.toUpperCase() || 'ARTEMIS II'}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Mission dropdown */}
              {showSelector && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSelector(false)} />
                  <div className="absolute top-7 left-0 z-50 w-56 glass-panel-solid border border-cyan-mid/15 rounded-lg p-1.5 shadow-xl">
                    {MISSIONS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onMissionChange?.(m.id)
                          setShowSelector(false)
                        }}
                        disabled={m.status !== 'active' && m.status !== 'completed'}
                        className={`w-full text-left px-3 py-2 rounded flex items-center justify-between transition-colors ${
                          m.status === 'active' || m.status === 'completed'
                            ? 'hover:bg-cyan-glow/5 text-slate-200'
                            : 'text-slate-600 cursor-not-allowed'
                        } ${m.id === activeMissionId ? 'bg-cyan-glow/8' : ''}`}
                      >
                        <div>
                          <div className="text-[11px] font-semibold font-display tracking-wider">
                            {m.name.toUpperCase()}
                          </div>
                          <div className="text-[8px] text-slate-500 mt-0.5">{m.date}</div>
                        </div>
                        {m.status === 'completed' && (
                          <span className="text-[7px] text-amber-glow font-mono tracking-wider bg-amber-glow/10 px-1.5 py-0.5 rounded">
                            REPLAY
                          </span>
                        )}
                        {m.status === 'active' && (
                          <span className="text-[7px] text-green-glow font-mono font-bold tracking-wider bg-green-glow/10 px-1.5 py-0.5 rounded">
                            LIVE
                          </span>
                        )}
                        {m.status === 'upcoming' && (
                          <span className="text-[7px] text-amber-glow font-mono tracking-wider">UPCOMING</span>
                        )}
                        {m.status === 'planned' && (
                          <span className="text-[7px] text-slate-600 font-mono tracking-wider">PLANNED</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="text-[9px] text-slate-500 tracking-[.25em] uppercase mt-0.5 font-medium">
              Mission Control — MCC-Houston
            </p>
          </div>
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-1.5 rounded bg-amber-glow/8 border border-amber-glow/25 px-2.5 py-1">
            <Radio className="h-3 w-3 text-amber-glow" strokeWidth={2} />
            <span className="text-[10px] font-bold text-amber-glow tracking-[.15em]">REPLAY</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded bg-red-glow/8 border border-red-glow/25 px-2.5 py-1">
            <Radio className="h-3 w-3 text-red-glow live-pulse" strokeWidth={2} />
            <span className="text-[10px] font-bold text-red-glow tracking-[.15em]">LIVE</span>
          </div>
        )}
      </div>
    </header>
  )
}
