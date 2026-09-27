import { Link } from 'wouter'
import { ArrowLeft, CalendarDays, ExternalLink } from 'lucide-react'
import type { MissionConfig } from '../data/missionData'
import { Header } from '../components/Header'

export function MissionBriefingPage({ mission }: { mission: MissionConfig }) {
  const calendarUrl = `https://artemis.realgar.ch/calendar/${mission.id}.ics`
  const isPlanned = mission.status === 'planned'
  const isCancelled = mission.status === 'cancelled'
  return (
    <>
      <Header missionName={mission.name} activeMissionId={mission.id} />
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:py-12">
        <Link href="/artemis-ii" className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-300 underline underline-offset-4 hover:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">
          <ArrowLeft className="h-4 w-4" /> Back to a flown mission
        </Link>
        <section className="glass-panel border-glow p-5 sm:p-8" aria-labelledby="briefing-title">
          <p className="text-xs uppercase tracking-[.22em] text-amber-glow">{isCancelled ? 'Mission cancelled' : isPlanned ? 'Future mission briefing · schedule may change' : 'Historical mission record · no trajectory dataset'}</p>
          <h1 id="briefing-title" className="mt-2 font-display text-3xl font-bold tracking-wide text-cyan-glow sm:text-4xl">{mission.name}</h1>
          <p className="mt-2 text-lg text-slate-200">{isCancelled ? 'NASA status: Cancelled' : isPlanned ? <>NASA launch window: <strong>{mission.launchWindow || 'Not announced'}</strong></> : <>Launch: <strong>{new Date(mission.launchDate).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}</strong></>}</p>
          <p className="mt-1 text-sm text-slate-500">NASA source published {mission.sourcePublishedAt ? new Date(`${mission.sourcePublishedAt}T00:00:00Z`).toLocaleDateString('en-GB', { dateStyle: 'long', timeZone: 'UTC' }) : 'date not shown on the linked mission page'} · Catalog checked {mission.verifiedAt}. {isPlanned && 'A year or season is not an exact launch date.'}</p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-200">{mission.objective}</p>
          {mission.crew.length > 0 && <div className="mt-5"><h2 className="text-sm font-semibold text-slate-200">NASA’s announced prime crew</h2><ul className="mt-2 grid gap-2 sm:grid-cols-2">{mission.crew.map((member) => <li key={member.name} className="rounded border border-slate-700/60 px-3 py-2 text-sm text-slate-300"><span className="font-semibold text-slate-100">{member.name}</span> · {member.role} · {member.agency}</li>)}</ul></div>}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={mission.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded border border-cyan-mid/30 px-4 py-2 text-sm text-cyan-glow hover:bg-cyan-glow/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">
              NASA mission page <ExternalLink className="h-4 w-4" />
            </a>
            {(isPlanned || isCancelled) && <a href={`/calendar/${mission.id}.ics`} download={`${mission.id}.ics`} className="inline-flex min-h-11 items-center gap-2 rounded border border-slate-600/50 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">
              <CalendarDays className="h-4 w-4" /> Download calendar follow-up
            </a>}
            {(isPlanned || isCancelled) && <a href={`webcal://${calendarUrl.replace(/^https:\/\//, '')}`} className="inline-flex min-h-11 items-center gap-2 rounded border border-slate-600/50 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">
              Subscribe to updates
            </a>}
          </div>
          <p className="mt-4 text-xs text-slate-500">The calendar has a date-free follow-up task because NASA has not announced an exact launch time. Calendar apps may take time to refresh a subscription, and reminders are controlled by your calendar app.</p>
        </section>
        {isPlanned && <section className="glass-panel p-5 sm:p-6" aria-labelledby="what-next-title">
          <h2 id="what-next-title" className="font-display text-lg font-semibold text-slate-100">What this mission will test</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{mission.id === 'artemis-iii'
            ? 'NASA describes Artemis III as an Earth-orbit flight test for Orion and commercial lander rendezvous and docking systems. The first planned crewed lunar landing is part of Artemis IV.'
            : mission.id === 'artemis-iv'
              ? 'NASA describes Artemis IV as a crewed mission intended to return astronauts to the lunar surface, with an early 2028 launch target.'
              : mission.objective}</p>
          <a href={mission.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm text-cyan-glow underline underline-offset-4">Read NASA’s current mission description <ExternalLink className="h-3.5 w-3.5" /></a>
        </section>}
        <p className="text-center text-xs text-slate-600">No trajectory is shown before mission-specific ephemeris or telemetry is published.</p>
      </main>
    </>
  )
}
