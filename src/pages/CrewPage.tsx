import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'

const CREW = [
  {
    name: 'Reid Wiseman',
    role: 'Commander',
    agency: 'NASA',
    photo: '/crew/wiseman.jpg',
    callsign: 'CDR',
    born: '1975, Baltimore, MD',
    flights: ['ISS Expedition 40/41 (2014)', 'Artemis II (2026)'],
    bio: 'Captain, U.S. Navy (retired). Reid Wiseman was selected as a NASA astronaut in 2009. He served as flight engineer on Expedition 40/41 aboard the International Space Station in 2014, spending 165 days in space. He served as Chief of the Astronaut Office from 2020 to 2022. A graduate of Rensselaer Polytechnic Institute and Johns Hopkins University, Wiseman accumulated more than 3,000 flight hours as a Navy test pilot before joining NASA.',
  },
  {
    name: 'Victor Glover',
    role: 'Pilot',
    agency: 'NASA',
    photo: '/crew/glover.jpg',
    callsign: 'PLT',
    born: '1976, Pomona, CA',
    flights: ['SpaceX Crew-1 / ISS (2020-2021)', 'Artemis II (2026)'],
    bio: 'Captain, U.S. Navy. Victor Glover was selected as a NASA astronaut in 2013. He served as pilot on SpaceX Crew-1, the first operational flight of the Crew Dragon spacecraft, spending 167 days aboard the ISS. A graduate of the Air Force Academy and multiple advanced degree programs, Glover has logged over 3,000 hours in more than 40 aircraft types. He will be the first person of color to fly beyond low Earth orbit.',
  },
  {
    name: 'Christina Koch',
    role: 'Mission Specialist',
    agency: 'NASA',
    photo: '/crew/koch.jpg',
    callsign: 'MS1',
    born: '1979, Grand Rapids, MI',
    flights: ['ISS Expedition 59-61 (2019-2020)', 'Artemis II (2026)'],
    bio: 'Christina Koch was selected as a NASA astronaut in 2013. She holds the record for the longest single spaceflight by a woman at 328 consecutive days aboard the ISS. During her mission, she participated in the first all-female spacewalk alongside Jessica Meir. Koch holds a B.S. in Electrical Engineering and Physics from NC State University and an M.S. in Electrical Engineering from Johns Hopkins. Before NASA, she worked at Goddard Space Flight Center and NOAA.',
  },
  {
    name: 'Jeremy Hansen',
    role: 'Mission Specialist',
    agency: 'CSA',
    photo: '/crew/hansen.jpg',
    callsign: 'MS2',
    born: '1976, London, Ontario',
    flights: ['Artemis II (2026)'],
    bio: 'Colonel, Royal Canadian Air Force. Jeremy Hansen was selected as a Canadian Space Agency astronaut in 2009. A former CF-18 Hornet fighter pilot, he has over 2,500 hours of flying experience. Hansen will be the first Canadian to fly beyond low Earth orbit and the first non-American to fly on a lunar mission. He holds a B.Sc. in Space Science from the Royal Military College of Canada and an M.Sc. in Physics from the same institution.',
  },
]

export function CrewPage() {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen">
      <div className="space-bg" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-glow transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-2xl sm:text-3xl text-cyan-glow font-bold tracking-wider glow-cyan">
            ARTEMIS II CREW
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            The first humans to fly to the Moon since Apollo 17 in December 1972
          </p>
        </div>

        {/* Crew cards */}
        <div className="space-y-6">
          {CREW.map((member, i) => (
            <motion.div
              key={member.name}
              className="glass-panel border-glow p-6 flex flex-col sm:flex-row gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              {/* Photo */}
              <div className="shrink-0">
                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-lg overflow-hidden border border-slate-700/50 bg-space-800">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-semibold text-white">{member.name}</h2>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
                    {member.callsign}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-slate-400">{member.role}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider"
                    style={{
                      backgroundColor: member.agency === 'NASA' ? '#2563eb20' : '#dc262620',
                      color: member.agency === 'NASA' ? '#2563eb' : '#dc2626',
                    }}
                  >
                    {member.agency}
                  </span>
                </div>

                <p className="text-[12px] text-slate-400 leading-relaxed mb-4">{member.bio}</p>

                {/* Flight history */}
                <div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1.5">Spaceflight History</div>
                  {member.flights.map((flight, j) => (
                    <div key={j} className="flex items-center gap-2 mb-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-glow/40" />
                      <span className="text-[10px] text-slate-300 font-mono">{flight}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[9px] text-slate-600 mt-3">Born: {member.born}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
