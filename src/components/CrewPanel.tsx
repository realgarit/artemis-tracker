import { ChevronRight } from 'lucide-react'
import { Link } from 'wouter'
import type { CrewMember } from '../lib/types'
import { SOURCE_URLS } from '../lib/provenance'

interface CrewPanelProps {
  crew?: CrewMember[]
  compact?: boolean
  missionId?: string
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

export function CrewPanel({ crew, compact = false, missionId = 'artemis-ii' }: CrewPanelProps) {
  if (!crew || crew.length === 0) return (
    <div className="sheet p-4 text-center">
      <span className="eyebrow">Uncrewed Test Flight</span>
    </div>
  )

  return (
    <section className="sheet min-w-0 p-3 sm:p-5" aria-labelledby="crew-panel-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Flight crew</p>
          <h2 id="crew-panel-title" className="font-display text-lg font-semibold text-ink">Crew — {crew.length} Aboard</h2>
        </div>
        <Link href={`/${missionId}/crew`} className="inline-flex min-h-11 items-center gap-1 text-sm text-blue underline underline-offset-4 hover:text-signal">
          View profiles <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <ul className={`grid border-l border-t border-ink ${compact ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'}`}>
        {crew.map((member) => {
          const data = CREW_DATA[member.name]
          return (
            <li key={member.name} className="border-b border-r border-ink bg-paper p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden border border-ink bg-paper-2">
                  {data?.photo ? (
                    <img src={data.photo} alt={member.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-mono text-sm font-bold text-ink-3">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-base font-semibold leading-tight text-ink">{member.name}</div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-3">{member.role} · {member.agency}</div>
                </div>
              </div>

              {!compact && data && (
                <>
                  <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{data.bio}</p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-ink-3">Spaceflights: {data.flights}</p>
                </>
              )}
            </li>
          )
        })}
      </ul>
      <a href={SOURCE_URLS.nasaArtemisII} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm text-blue underline underline-offset-4 hover:text-signal">NASA crew source <ChevronRight className="h-3.5 w-3.5" /></a>
    </section>
  )
}
