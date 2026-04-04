import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ActivityLogProps {
  phase?: string
}

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
    '> Navigation state vector update received',
    '> TLI window open in T-minus 45 min',
  ],
  'Trans-Lunar Injection': [
    '> TLI burn ignition confirmed',
    '> ICPS performance nominal — 18 min burn',
    '> Velocity: 10.8 km/s — escape trajectory',
    '> TLI burn cutoff — SECO-2',
    '> ICPS separation confirmed — Orion free-flight',
  ],
  'Outbound Coast': [
    '> Coasting toward the Moon',
    '> Velocity decreasing — gravity gradient',
    '> MCC-1 correction burn complete',
    '> Distance increasing: ~130,000 km',
    '> Crew resting periods on schedule',
    '> NOAA solar wind nominal',
    '> Radiation dose within mission limits',
    '> MCC-2 scheduled for T+60h',
  ],
  'Lunar Flyby': [
    '> Approaching lunar closest approach',
    '> Powered flyby burn ignition',
    '> Closest approach: ~6,400 km above surface',
    '> Far side of Moon — signal occultation',
    '> AOS — acquisition of signal restored',
    '> Free-return trajectory confirmed',
  ],
  'Return Coast': [
    '> Homeward bound — return coast initiated',
    '> Velocity increasing — Earth gravity capture',
    '> MCC-3 correction burn window open',
    '> CM/SM separation timeline review',
    '> Entry interface targeting update received',
  ],
  'Re-entry & Splashdown': [
    '> CM/SM separation confirmed',
    '> Entry interface — 122 km altitude',
    '> Peak deceleration — ~4g',
    '> Main parachutes deployed — 3 of 3',
    '> Splashdown confirmed — crew safe',
  ],
}

interface LogEntry { id: string; time: string; message: string }

export function ActivityLog({ phase }: ActivityLogProps) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(phase)

  useEffect(() => {
    if (!phase) return
    const messages = PHASE_MESSAGES[phase] || PHASE_MESSAGES['Outbound Coast']

    if (phase !== phaseRef.current) {
      phaseRef.current = phase
      const now = new Date()
      const newEntries = messages.slice(0, 3).map((msg, i) => ({
        id: `${Date.now()}-${i}`,
        time: new Date(now.getTime() - (2 - i) * 60000).toISOString(),
        message: msg,
      }))
      setEntries((prev) => [...prev, ...newEntries].slice(-15))
    }

    const interval = setInterval(() => {
      const msg = messages[Math.floor(Math.random() * messages.length)]
      setEntries((prev) => [...prev, {
        id: Date.now().toString(),
        time: new Date().toISOString(),
        message: msg,
      }].slice(-15))
    }, 15_000 + Math.random() * 10_000)

    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (entries.length === 0 && phase) {
      const messages = PHASE_MESSAGES[phase] || PHASE_MESSAGES['Outbound Coast']
      const now = new Date()
      setEntries(messages.slice(0, 6).map((msg, i) => ({
        id: `init-${i}`,
        time: new Date(now.getTime() - (5 - i) * 120_000).toISOString(),
        message: msg,
      })))
    }
  }, [phase, entries.length])

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight
  }, [entries])

  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`
  }

  return (
    <div className="glass-panel border-glow p-4 h-full flex flex-col">
      {/* Terminal-style header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>
          <span className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">
            MCC-H Flight Log // {phase || 'Standby'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded bg-red-500/15 border border-red-500/30 px-2 py-0.5">
          <span className="text-[9px] font-semibold text-red-400 tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Log entries */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1 font-mono text-xs min-h-[160px]">
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 py-0.5"
            >
              <span className="text-slate-600 shrink-0">{fmt(entry.time)}</span>
              <span className="text-cyan-glow/80">{entry.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {entries.length === 0 && (
          <div className="text-slate-600 text-center py-8">Awaiting telemetry feed...</div>
        )}
      </div>
    </div>
  )
}
