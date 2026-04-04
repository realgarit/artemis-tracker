import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ActivityLogProps {
  phase?: string
}

// Phase-specific telemetry log messages
const PHASE_MESSAGES: Record<string, string[]> = {
  'Pre-Launch': [
    '> Terminal countdown in progress',
    '> Launch vehicle systems nominal',
    '> Crew ingress complete — all 4 aboard',
    '> Launch abort system armed',
    '> Ground support equipment disconnect scheduled',
    '> Weather: GO for launch',
  ],
  'Launch & Ascent': [
    '> Liftoff confirmed — all engines nominal',
    '> Roll program initiated',
    '> Max Q — throttle bucket',
    '> SRB separation confirmed',
    '> Core stage MECO confirmed',
    '> ICPS ignition — orbit insertion',
  ],
  'Earth Orbit': [
    '> Stable orbit achieved — 185 km circular',
    '> Solar array deployment confirmed',
    '> Systems checkout in progress',
    '> ICPS ullage settling burn complete',
    '> Navigation state vector update received',
    '> TLI window open in T-minus 45 min',
  ],
  'Trans-Lunar Injection': [
    '> TLI burn ignition confirmed',
    '> ICPS performance nominal — 18 min burn duration',
    '> Velocity: 10.8 km/s — escape trajectory confirmed',
    '> TLI burn cutoff — SECO-2',
    '> ICPS separation confirmed — Orion free-flight',
    '> Trans-lunar coast initiated',
  ],
  'Outbound Coast': [
    '> Coasting toward the Moon',
    '> Velocity decreasing — gravity gradient',
    '> MCC-1 correction burn complete',
    '> Star tracker calibration nominal',
    '> Crew resting periods on schedule',
    '> Thermal management systems nominal',
    '> Deep Space Network tracking acquired',
    '> All consumables within nominal margins',
  ],
  'Lunar Flyby': [
    '> Approaching lunar closest approach',
    '> Powered flyby burn ignition',
    '> Lunar gravity assist — trajectory bending',
    '> Closest approach: ~6,400 km above lunar surface',
    '> Far side of Moon — signal occultation',
    '> AOS — acquisition of signal restored',
    '> Free-return trajectory confirmed',
    '> Crew observations of lunar far side',
  ],
  'Return Coast': [
    '> Homeward bound — return coast initiated',
    '> Velocity increasing — Earth gravity capture',
    '> MCC-3 correction burn window open',
    '> Service module consumables nominal',
    '> Entry interface targeting update received',
    '> Crew stow operations in progress',
    '> CM/SM separation timeline review',
  ],
  'Re-entry & Splashdown': [
    '> CM/SM separation confirmed',
    '> Entry interface — 122 km altitude',
    '> Communications blackout — plasma sheath',
    '> Peak deceleration — ~4g',
    '> Drogue chutes deployed',
    '> Main parachutes deployed — 3 of 3',
    '> Splashdown confirmed — USS San Diego en route',
    '> Crew safe — mission complete',
  ],
}

interface LogEntry {
  id: string
  time: string
  message: string
}

export function ActivityLog({ phase }: ActivityLogProps) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(phase)

  useEffect(() => {
    // When phase changes, add new entries
    if (!phase) return

    const messages = PHASE_MESSAGES[phase] || PHASE_MESSAGES['Outbound Coast']

    // If phase changed, add the first few messages
    if (phase !== phaseRef.current) {
      phaseRef.current = phase
      const now = new Date()
      const newEntries = messages.slice(0, 3).map((msg, i) => ({
        id: `${Date.now()}-${i}`,
        time: new Date(now.getTime() - (2 - i) * 60000).toISOString(),
        message: msg,
      }))
      setEntries((prev) => [...prev, ...newEntries].slice(-20))
    }

    // Add a new message periodically
    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)]
      const entry: LogEntry = {
        id: Date.now().toString(),
        time: new Date().toISOString(),
        message: randomMsg,
      }
      setEntries((prev) => [...prev, entry].slice(-20))
    }, 15_000 + Math.random() * 10_000)

    return () => clearInterval(interval)
  }, [phase])

  // Initialize with some entries on mount
  useEffect(() => {
    if (entries.length === 0 && phase) {
      const messages = PHASE_MESSAGES[phase] || PHASE_MESSAGES['Outbound Coast']
      const now = new Date()
      const initial = messages.slice(0, 5).map((msg, i) => ({
        id: `init-${i}`,
        time: new Date(now.getTime() - (4 - i) * 120_000).toISOString(),
        message: msg,
      }))
      setEntries(initial)
    }
  }, [phase, entries.length])

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [entries])

  function formatTime(iso: string) {
    const d = new Date(iso)
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`
  }

  return (
    <div className="glass-panel border-glow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-medium">
          Mission Activity Log
        </h3>
        <span className="text-[9px] text-slate-500 font-mono">
          {phase || 'Standby'}
        </span>
      </div>

      <div
        ref={containerRef}
        className="h-48 overflow-y-auto space-y-1.5 font-mono text-xs"
      >
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 py-0.5"
            >
              <span className="text-slate-600 shrink-0">{formatTime(entry.time)}</span>
              <span className="text-cyan-glow/80">{entry.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {entries.length === 0 && (
          <div className="text-slate-600 text-center py-8">
            Awaiting telemetry feed...
          </div>
        )}
      </div>
    </div>
  )
}
