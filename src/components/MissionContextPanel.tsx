import type { DSNData, TrajectoryData } from '../lib/types'

const SPEED_OF_LIGHT_KM_S = 299_792.458

export function MissionContextPanel({ trajectory, dsn, missionTime }: { trajectory: TrajectoryData; dsn?: DSNData; missionTime: string }) {
  const distance = trajectory.distanceFromEarth
  const oneWaySeconds = distance !== null && Number.isFinite(distance) ? distance / SPEED_OF_LIGHT_KM_S : null
  const twoWaySeconds = oneWaySeconds === null ? null : oneWaySeconds * 2
  const matchingTargets = dsn?.dishes.flatMap((dish) => dish.targets
    .filter((target) => /orion|artemis(?:\s*(?:i|ii|2))?|integrity/i.test(target.name))
    .map((target) => `${dish.name} · ${target.name}`)) || []
  const unavailable = dsn?.provenance?.mode === 'unavailable'

  return (
    <section className="glass-panel min-w-0 p-4 sm:p-5" aria-labelledby="comms-context-title">
      <p className="break-words text-xs uppercase tracking-[.12em] text-cyan-glow sm:tracking-[.2em]">Communications context · {new Date(missionTime).toISOString().replace('.000Z', ' UTC')}</p>
      <h2 id="comms-context-title" className="mt-1 font-display text-lg font-semibold text-slate-100">How long would a signal take?</h2>
      <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0"><p className="break-words text-sm text-slate-300">One-way geometric light time</p><p className="mt-1 break-words font-mono text-xl text-cyan-glow sm:text-2xl">{oneWaySeconds === null ? 'Unavailable' : `~${oneWaySeconds.toFixed(2)} s`}</p><p className="mt-1 break-words text-xs leading-relaxed text-slate-400">Estimated from the selected source position’s Earth-center distance divided by the speed of light. This is not measured radio latency.</p></div>
        <div className="min-w-0"><p className="break-words text-sm text-slate-300">Round-trip geometric light time</p><p className="mt-1 break-words font-mono text-xl text-cyan-glow sm:text-2xl">{twoWaySeconds === null ? 'Unavailable' : `~${twoWaySeconds.toFixed(2)} s`}</p><p className="mt-1 break-words text-xs leading-relaxed text-slate-400">A distance-based estimate for a signal traveling to Orion and back at light speed. Real radio paths and operations add delay.</p></div>
      </div>
      <div className="mt-4 border-t border-slate-700/60 pt-3">
        <h3 className="text-sm font-semibold text-slate-200">Current Earth network view</h3>
        {unavailable || !dsn ? <p className="mt-1 text-sm text-slate-400">The current feed is unavailable; tracking status is unknown.</p> : matchingTargets.length
          ? <p className="mt-1 text-sm leading-relaxed text-slate-300">The current feed includes these Orion or Artemis-like target names: {matchingTargets.join(', ')}. The name match does not verify an active command link.</p>
          : <p className="mt-1 text-sm leading-relaxed text-slate-300">This current Earth network feed lists no target matching the configured Orion, Artemis, or Integrity names. That does not establish whether the spacecraft has communications.</p>}
        <p className="mt-2 text-xs text-slate-500">DSN and space-weather panels show Earth-environment context at the time they were fetched. They are not historical mission readings or crew radiation measurements.</p>
      </div>
    </section>
  )
}
