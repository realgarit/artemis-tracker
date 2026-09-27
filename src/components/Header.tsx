import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { Satellite, Radio, ChevronDown } from 'lucide-react'
import { MISSIONS, type MissionConfig } from '../data/missionData'
import { getMissionTrajectory } from '../data/trajectoryData'

interface HeaderProps {
  missionName?: string
  activeMissionId?: string
  onMissionChange?: (missionId: string) => void
}

function launchLabel(mission: MissionConfig): string {
  if (mission.launchWindow) return mission.launchWindow
  return new Date(mission.launchDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function Header({ missionName, activeMissionId, onMissionChange }: HeaderProps) {
  const selectedMission = activeMissionId ? MISSIONS[activeMissionId] : undefined
  const isCompleted = selectedMission?.status === 'completed'
  const hasReplay = isCompleted && Boolean(selectedMission && getMissionTrajectory(selectedMission.id))
  const [showSelector, setShowSelector] = useState(false)
  const selectorButtonRef = useRef<HTMLButtonElement>(null)
  const selectorMenuRef = useRef<HTMLDivElement>(null)
  const [, navigate] = useLocation()

  useEffect(() => {
    if (!showSelector) return
    selectorMenuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [showSelector])

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = [...(selectorMenuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') || [])]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      setShowSelector(false)
      selectorButtonRef.current?.focus()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const offset = event.key === 'ArrowDown' ? 1 : -1
      items[(index + offset + items.length) % items.length]?.focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      items[event.key === 'Home' ? 0 : items.length - 1]?.focus()
    } else if (event.key === 'Tab') setShowSelector(false)
  }

  return (
    <header className="sticky top-0 z-40 glass-panel-solid border-b border-cyan-mid/8">
      <div className="mx-auto flex min-w-0 max-w-[1600px] flex-col gap-2 px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="relative">
            <Satellite className="h-5 w-5 text-cyan-glow" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            {/* Mission name + selector */}
            <div className="relative">
              <button
                type="button"
                ref={selectorButtonRef}
                aria-haspopup="menu"
                aria-expanded={showSelector}
                aria-controls="mission-selector-menu"
                aria-label={`Select mission. Current mission: ${missionName || 'Artemis'}`}
                onClick={() => setShowSelector(!showSelector)}
                className="flex min-h-11 min-w-0 flex-wrap items-center gap-1 font-orbitron text-sm font-bold tracking-[.05em] text-cyan-glow glow-cyan leading-tight hover:text-cyan-glow/90 transition-colors sm:gap-1.5 sm:text-lg sm:tracking-[.15em]"
              >
                {missionName?.toUpperCase() || 'ARTEMIS II'}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Mission dropdown */}
              {showSelector && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSelector(false)} />
                  <div id="mission-selector-menu" ref={selectorMenuRef} role="menu" aria-label="Missions" onKeyDown={handleMenuKeyDown} className="absolute top-7 left-0 z-50 w-60 glass-panel-solid border border-cyan-mid/15 rounded-lg p-1.5 shadow-xl">
                    {Object.values(MISSIONS).map((m) => (
                      <button
                        type="button"
                        role="menuitem"
                        key={m.id}
                        onClick={() => {
                          navigate(`/${m.id}`)
                          onMissionChange?.(m.id)
                          setShowSelector(false)
                        }}
                        className={`min-h-11 w-full text-left px-3 py-2 rounded flex items-center justify-between transition-colors ${
                          'hover:bg-cyan-glow/5 text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow'
                        } ${m.id === activeMissionId ? 'bg-cyan-glow/8' : ''}`}
                      >
                        <div>
                          <div className="text-[11px] font-semibold font-display tracking-wider">
                            {m.name.toUpperCase()}
                          </div>
                          <div className="text-[8px] text-slate-500 mt-0.5">{launchLabel(m)}</div>
                        </div>
                        {m.status === 'completed' && (
                          <span className="text-[7px] text-amber-glow font-mono tracking-wider bg-amber-glow/10 px-1.5 py-0.5 rounded">
                            {getMissionTrajectory(m.id) ? 'REPLAY' : 'ARCHIVE'}
                          </span>
                        )}
                        {m.status === 'planned' && <span className="text-[7px] text-slate-400 font-mono tracking-wider">PLANNED</span>}
                        {m.status === 'cancelled' && <span className="text-[7px] text-slate-400 font-mono tracking-wider">CANCELLED</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="mt-0.5 break-words text-[8px] font-medium uppercase tracking-[.12em] text-slate-500 sm:text-[9px] sm:tracking-[.25em]">
              Mission Control — MCC-Houston
            </p>
          </div>
        </div>

        {isCompleted || selectedMission?.status === 'planned' || selectedMission?.status === 'cancelled' ? (
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-end">
            <a href="/compare" className="inline-flex min-h-11 max-w-full items-center rounded border border-slate-700/60 px-2 text-[11px] text-slate-300 hover:border-cyan-glow/50 hover:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow sm:px-3 sm:text-xs">Compare missions</a>
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5 rounded border border-amber-glow/25 bg-amber-glow/8 px-2.5 py-1">
              <Radio className="h-3 w-3 text-amber-glow" strokeWidth={2} />
              <span className="text-[10px] font-bold text-amber-glow tracking-[.15em]">{hasReplay ? 'REPLAY' : isCompleted ? 'ARCHIVE' : selectedMission?.status === 'cancelled' ? 'CANCELLED' : 'PLANNED'}</span>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-end">
            <a href="/compare" className="inline-flex min-h-11 max-w-full items-center rounded border border-slate-700/60 px-2 text-[11px] text-slate-300 hover:border-cyan-glow/50 hover:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow sm:px-3 sm:text-xs">Compare missions</a>
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5 rounded border border-slate-700/50 bg-slate-800/70 px-2.5 py-1">
              <span className="text-[10px] font-bold text-slate-300 tracking-[.15em]">STATUS UNVERIFIED</span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
