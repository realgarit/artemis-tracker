import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { Radio, ChevronDown } from 'lucide-react'
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

  const stampLabel = selectedMission
    ? hasReplay ? 'REPLAY' : isCompleted ? 'ARCHIVE' : selectedMission.status === 'cancelled' ? 'CANCELLED' : selectedMission.status === 'planned' ? 'PLANNED' : 'STATUS UNVERIFIED'
    : 'STATUS UNVERIFIED'

  return (
    <header className="relative z-40 border-b-2 border-ink bg-paper">
      <div className="mx-auto flex min-w-0 max-w-[1600px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mission mark: Earth, the outbound track, the Moon. */}
          <svg aria-hidden="true" viewBox="0 0 40 40" className="h-9 w-9 shrink-0">
            <circle cx="12" cy="27" r="7" fill="var(--color-blue)" />
            <path d="M12 27C14 6 30 4 32 11" fill="none" stroke="var(--color-signal-hot)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="12" r="3.5" fill="var(--color-ink)" />
          </svg>
          <div className="min-w-0">
            <div className="relative">
              <button
                type="button"
                ref={selectorButtonRef}
                aria-haspopup="menu"
                aria-expanded={showSelector}
                aria-controls="mission-selector-menu"
                aria-label={`Select mission. Current mission: ${missionName || 'Artemis'}`}
                onClick={() => setShowSelector(!showSelector)}
                className="flex min-h-11 min-w-0 flex-wrap items-center gap-1.5 text-left font-display text-xl font-bold uppercase leading-none tracking-tight text-ink hover:text-signal sm:text-2xl"
              >
                {missionName || 'Artemis II'}
                <ChevronDown className={`h-4 w-4 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
              </button>

              {showSelector && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSelector(false)} />
                  <div id="mission-selector-menu" ref={selectorMenuRef} role="menu" aria-label="Missions" onKeyDown={handleMenuKeyDown} className="absolute left-0 top-full z-50 w-72 max-w-[calc(100vw-1.5rem)] border-2 border-ink bg-card shadow-[6px_6px_0_rgba(21,24,29,0.15)]">
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
                        className={`flex min-h-11 w-full items-center justify-between gap-3 border-b border-rule px-3 py-2 text-left last:border-b-0 hover:bg-paper-2 ${m.id === activeMissionId ? 'bg-paper-2' : ''}`}
                      >
                        <span>
                          <span className="block font-display text-sm font-bold uppercase tracking-tight text-ink">{m.name}</span>
                          <span className="mt-0.5 block font-mono text-[11px] text-ink-3">{launchLabel(m)}</span>
                        </span>
                        <span className={`font-mono text-[11px] tracking-wider ${m.status === 'completed' ? 'font-bold text-signal' : 'text-ink-3'}`}>
                          {m.status === 'completed' ? (getMissionTrajectory(m.id) ? 'REPLAY' : 'ARCHIVE') : m.status === 'planned' ? 'PLANNED' : m.status === 'cancelled' ? 'CANCELLED' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="eyebrow -mt-1.5 break-words">Flight data file · NASA sources</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <a href="/compare" className="inline-flex min-h-11 items-center text-sm text-ink underline decoration-rule decoration-2 underline-offset-4 hover:decoration-signal-hot">Compare missions</a>
          <span className="stamp -rotate-2"><Radio className="h-3 w-3" strokeWidth={2.5} />{stampLabel}</span>
        </div>
      </div>
    </header>
  )
}
