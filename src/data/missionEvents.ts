export interface MissionEvent {
  id: string
  missionId: 'artemis-i' | 'artemis-ii'
  name: string
  occurredAt: string
  phase: string
  category: 'launch' | 'maneuver' | 'lunar flyby' | 'communications' | 'return' | 'recovery'
  explanation: string
  whyItMatters: string
  sourceUrl: string
}

const ARTEMIS_I = 'https://www.nasa.gov/reference/artemis-i-mission-timeline/'
const ARTEMIS_II_FLYBY = 'https://www.nasa.gov/blogs/missions/2026/04/06/artemis-ii-flight-day-6-lunar-flyby-updates/'
const ARTEMIS_II_HOME = 'https://www.nasa.gov/news-release/nasa-welcomes-record-setting-artemis-ii-moonfarers-back-to-earth/'

export const MISSION_EVENTS: MissionEvent[] = [
  { id: 'a1-launch', missionId: 'artemis-i', name: 'Artemis I lifts off', occurredAt: '2022-11-16T06:47:44Z', phase: 'Launch & Ascent', category: 'launch', explanation: 'The uncrewed Orion spacecraft launched aboard the Space Launch System for a flight test around the Moon.', whyItMatters: 'This flight tested the integrated rocket, spacecraft, ground, and recovery systems before crewed missions.', sourceUrl: ARTEMIS_I },
  { id: 'a1-tli', missionId: 'artemis-i', name: 'Trans-lunar injection', occurredAt: '2022-11-16T08:42:00Z', phase: 'Trans-Lunar Injection', category: 'maneuver', explanation: 'An upper-stage burn sent Orion out of Earth orbit toward the Moon.', whyItMatters: 'The maneuver began the mission’s lunar transfer.', sourceUrl: ARTEMIS_I },
  { id: 'a1-flyby', missionId: 'artemis-i', name: 'Outbound lunar flyby', occurredAt: '2022-11-21T12:44:00Z', phase: 'Lunar Flyby', category: 'lunar flyby', explanation: 'Orion passed the Moon on its outbound path before entering a distant retrograde orbit.', whyItMatters: 'The lunar encounter shaped the spacecraft’s route into and out of the distant orbit.', sourceUrl: ARTEMIS_I },
  { id: 'a1-dro', missionId: 'artemis-i', name: 'Distant retrograde orbit insertion', occurredAt: '2022-11-25T20:52:00Z', phase: 'DRO Insertion', category: 'maneuver', explanation: 'Orion entered a distant retrograde orbit around the Moon.', whyItMatters: 'The mission exercised long-duration lunar-orbit operations far from Earth.', sourceUrl: ARTEMIS_I },
  { id: 'a1-dro-departure', missionId: 'artemis-i', name: 'Distant retrograde orbit departure', occurredAt: '2022-12-01T21:53:00Z', phase: 'DRO Departure', category: 'maneuver', explanation: 'A departure burn began Orion’s return leg toward Earth.', whyItMatters: 'The return trajectory used the lunar flyby geometry to guide Orion home.', sourceUrl: ARTEMIS_I },
  { id: 'a1-return-flyby', missionId: 'artemis-i', name: 'Return lunar flyby', occurredAt: '2022-12-05T16:43:00Z', phase: 'Return Coast', category: 'return', explanation: 'Orion passed the Moon again on its way back to Earth.', whyItMatters: 'This encounter set the spacecraft onto its final Earth-return path.', sourceUrl: ARTEMIS_I },
  { id: 'a1-splashdown', missionId: 'artemis-i', name: 'Pacific splashdown', occurredAt: '2022-12-11T17:40:00Z', phase: 'Re-entry & Splashdown', category: 'recovery', explanation: 'Orion completed a parachute-assisted splashdown in the Pacific Ocean.', whyItMatters: 'Recovery returned the spacecraft for inspection and completed the flight test.', sourceUrl: ARTEMIS_I },
  { id: 'a2-launch', missionId: 'artemis-ii', name: 'Artemis II lifts off', occurredAt: '2026-04-01T22:35:12Z', phase: 'LEO', category: 'launch', explanation: 'Four astronauts launched in Orion aboard the Space Launch System.', whyItMatters: 'This was the first crewed flight test of Orion and SLS for the Artemis campaign.', sourceUrl: ARTEMIS_II_HOME },
  { id: 'a2-flyby-window', missionId: 'artemis-ii', name: 'Lunar observation period begins', occurredAt: '2026-04-06T18:45:00Z', phase: 'Trans-Lunar', category: 'lunar flyby', explanation: 'The crew began a planned period of observations as Orion approached the Moon.', whyItMatters: 'The observations paired crew descriptions with imagery and science-team context.', sourceUrl: ARTEMIS_II_FLYBY },
  { id: 'a2-earthset', missionId: 'artemis-ii', name: 'Earthset behind the Moon', occurredAt: '2026-04-06T22:41:00Z', phase: 'Trans-Lunar', category: 'lunar flyby', explanation: 'Earth dropped below the lunar horizon as Orion moved behind the far side.', whyItMatters: 'It marked the start of a planned period when the Moon blocked the radio path to Earth.', sourceUrl: ARTEMIS_II_FLYBY },
  { id: 'a2-blackout', missionId: 'artemis-ii', name: 'Planned lunar communications blackout', occurredAt: '2026-04-06T22:44:00Z', phase: 'Trans-Lunar', category: 'communications', explanation: 'The Moon blocked the Deep Space Network’s line of sight to Orion during the far-side pass.', whyItMatters: 'The expected loss of signal demonstrates how geometry affects an Earth-based link; a loss alone is not a spacecraft failure.', sourceUrl: ARTEMIS_II_FLYBY },
  { id: 'a2-closest', missionId: 'artemis-ii', name: 'Closest approach to the lunar surface', occurredAt: '2026-04-06T23:00:00Z', phase: 'Trans-Lunar', category: 'lunar flyby', explanation: 'NASA reported closest approach at 7:00 p.m. Eastern Daylight Time, about 4,067 miles above the lunar surface.', whyItMatters: 'The flyby gave the crew a close view of lunar terrain and tested navigation during a deep-space mission.', sourceUrl: ARTEMIS_II_FLYBY },
  { id: 'a2-distance-record', missionId: 'artemis-ii', name: 'Maximum distance from Earth', occurredAt: '2026-04-06T23:02:00Z', phase: 'Trans-Lunar', category: 'lunar flyby', explanation: 'At 7:02 p.m. Eastern Daylight Time, the crew reached 252,756 miles from Earth.', whyItMatters: 'The mission set a new distance record for human spaceflight, as reported by NASA.', sourceUrl: ARTEMIS_II_FLYBY },
  { id: 'a2-earthrise', missionId: 'artemis-ii', name: 'Earthrise and signal reacquisition', occurredAt: '2026-04-06T23:24:00Z', phase: 'Trans-Lunar', category: 'communications', explanation: 'Orion emerged from behind the Moon, the crew saw Earthrise, and the Deep Space Network reacquired the signal.', whyItMatters: 'The planned blackout ended when the spacecraft returned to line of sight.', sourceUrl: ARTEMIS_II_FLYBY },
  { id: 'a2-splashdown', missionId: 'artemis-ii', name: 'Pacific splashdown', occurredAt: '2026-04-11T00:07:00Z', phase: 'EDL', category: 'recovery', explanation: 'Orion splashed down off the California coast at 5:07 p.m. Pacific Daylight Time on April 10.', whyItMatters: 'The crew and spacecraft returned safely, completing the crewed flight test.', sourceUrl: ARTEMIS_II_HOME },
  { id: 'a2-crew-recovery', missionId: 'artemis-ii', name: 'Crew recovered from Orion', occurredAt: '2026-04-11T01:34:00Z', phase: 'Recovery', category: 'recovery', explanation: 'Recovery teams helped the four astronauts out of the spacecraft and transported them to the recovery ship.', whyItMatters: 'Splashdown and crew recovery are separate events; the mission record distinguishes both.', sourceUrl: ARTEMIS_II_HOME },
]

export const GLOSSARY: { term: string; explanation: string }[] = [
  { term: 'TLI', explanation: 'Trans-lunar injection: a propulsion maneuver that places a spacecraft on a path toward the Moon.' },
  { term: 'DRO', explanation: 'Distant retrograde orbit: a large, looping orbit around the Moon.' },
  { term: 'Mission elapsed time', explanation: 'Elapsed time since launch, measured from the mission’s launch epoch.' },
  { term: 'Ephemeris', explanation: 'A calculated table of where a celestial body or spacecraft is expected to be over time.' },
  { term: 'Reference frame', explanation: 'The origin and orientation used to describe position and velocity coordinates.' },
  { term: 'Altitude', explanation: 'Distance above a body’s adopted reference radius; this differs from distance to its center.' },
  { term: 'Light time', explanation: 'The estimated time a radio signal takes to travel a geometric distance at the speed of light.' },
  { term: 'Kp index', explanation: 'A global index describing geomagnetic activity at Earth; it is not a spacecraft radiation dose.' },
  { term: 'Sphere of influence', explanation: 'A convenient region where one body’s gravitational influence is used as the main frame for describing a trajectory.' },
  { term: 'Line of sight', explanation: 'An unobstructed geometric path between a spacecraft and a ground antenna.' },
]
