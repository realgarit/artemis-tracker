import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import type { CrewMember } from '../lib/types'

interface CrewPanelProps {
  crew?: CrewMember[]
}

const CREW_BIOS: Record<string, { flights: number; bio: string }> = {
  'Reid Wiseman': {
    flights: 2,
    bio: 'Commander. Former Navy test pilot. Spent 165 days on ISS during Expedition 40/41. Selected as NASA astronaut in 2009.',
  },
  'Victor Glover': {
    flights: 2,
    bio: 'Pilot. Navy fighter pilot. Crew member on SpaceX Crew-1, first operational Crew Dragon mission to the ISS.',
  },
  'Christina Koch': {
    flights: 2,
    bio: 'Mission Specialist. Holds the record for longest single spaceflight by a woman (328 days). Part of first all-female spacewalk.',
  },
  'Jeremy Hansen': {
    flights: 1,
    bio: 'Mission Specialist. Canadian Space Agency astronaut and former CF-18 fighter pilot. First Canadian to fly beyond low Earth orbit.',
  },
}

const AGENCY_COLORS: Record<string, string> = {
  NASA: '#2563eb',
  CSA: '#dc2626',
}

export function CrewPanel({ crew }: CrewPanelProps) {
  if (!crew || crew.length === 0) return null

  return (
    <motion.div
      className="glass-panel border-glow p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-3.5 w-3.5 text-cyan-glow" strokeWidth={2} />
        <span className="text-[10px] text-slate-400 uppercase tracking-[.2em] font-semibold">
          Crew — {crew.length} Aboard
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {crew.map((member, i) => {
          const bio = CREW_BIOS[member.name]
          const agencyColor = AGENCY_COLORS[member.agency] || '#64748b'

          return (
            <motion.div
              key={member.name}
              className="bg-space-800/40 rounded p-3 border border-slate-800/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-9 w-9 rounded-full bg-space-700 border border-slate-700/60 flex items-center justify-center text-[11px] font-bold text-cyan-glow/70 font-mono shrink-0">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-200 font-semibold truncate">{member.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] text-slate-400">{member.role}</span>
                    <span
                      className="text-[7px] font-bold px-1 py-px rounded tracking-wider"
                      style={{ backgroundColor: `${agencyColor}20`, color: agencyColor }}
                    >
                      {member.agency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {bio && (
                <div className="text-[8px] text-slate-500 leading-relaxed mt-1">
                  {bio.bio}
                </div>
              )}

              {/* Flight count */}
              {bio && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-[7px] text-slate-600 uppercase tracking-wider">Flights:</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: bio.flights }, (_, j) => (
                      <div key={j} className="h-1 w-3 rounded-full bg-cyan-glow/30" />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
