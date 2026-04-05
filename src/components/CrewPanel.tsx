import { motion } from 'framer-motion'
import { Users, ChevronRight } from 'lucide-react'
import { Link } from 'wouter'
import type { CrewMember } from '../lib/types'

interface CrewPanelProps {
  crew?: CrewMember[]
  compact?: boolean
}

const CREW_DATA: Record<string, { photo: string; flights: number; bio: string }> = {
  'Reid Wiseman': {
    photo: '/crew/wiseman.jpg',
    flights: 2,
    bio: 'Commander. Former Navy test pilot. Spent 165 days aboard the ISS during Expedition 40/41. Selected as NASA astronaut in 2009. Chief of the Astronaut Office 2020–2022.',
  },
  'Victor Glover': {
    photo: '/crew/glover.jpg',
    flights: 2,
    bio: 'Pilot. Navy fighter pilot and test pilot. Crew member on SpaceX Crew-1, the first operational Crew Dragon mission to the ISS. Over 3,000 flight hours in 40+ aircraft.',
  },
  'Christina Koch': {
    photo: '/crew/koch.jpg',
    flights: 2,
    bio: 'Mission Specialist. Holds the record for longest single spaceflight by a woman (328 days). Conducted the first all-female spacewalk alongside Jessica Meir in October 2019.',
  },
  'Jeremy Hansen': {
    photo: '/crew/hansen.jpg',
    flights: 1,
    bio: 'Mission Specialist. Canadian Space Agency astronaut and former CF-18 fighter pilot. First Canadian to fly beyond low Earth orbit. Selected as CSA astronaut in 2009.',
  },
}

const AGENCY_COLORS: Record<string, string> = {
  NASA: '#2563eb',
  CSA: '#dc2626',
}

export function CrewPanel({ crew, compact = false }: CrewPanelProps) {
  if (!crew || crew.length === 0) return null

  return (
    <motion.div
      className="glass-panel border-glow p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-cyan-glow" strokeWidth={2} />
          <span className="text-[10px] text-slate-400 uppercase tracking-[.2em] font-semibold">
            Crew — {crew.length} Aboard
          </span>
        </div>
        <Link href="/crew" className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-cyan-glow transition-colors">
          View profiles <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className={`grid gap-3 ${compact ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'}`}>
        {crew.map((member, i) => {
          const data = CREW_DATA[member.name]
          const agencyColor = AGENCY_COLORS[member.agency] || '#64748b'

          return (
            <motion.div
              key={member.name}
              className="bg-space-800/40 rounded p-3 border border-slate-800/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                {/* Photo */}
                <div className="h-11 w-11 rounded-full overflow-hidden border border-slate-700/60 shrink-0 bg-space-700">
                  {data?.photo ? (
                    <img src={data.photo} alt={member.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[13px] font-bold text-cyan-glow/60 font-mono">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                  )}
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

              {!compact && data && (
                <>
                  <div className="text-[8px] text-slate-500 leading-relaxed mt-1">{data.bio}</div>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[7px] text-slate-600 uppercase tracking-wider">Flights:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: data.flights }, (_, j) => (
                        <div key={j} className="h-1 w-3 rounded-full bg-cyan-glow/30" />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
