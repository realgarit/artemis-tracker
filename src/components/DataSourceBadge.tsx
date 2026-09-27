import { provenanceLabel } from '../lib/provenance'
import type { DataProvenance } from '../lib/provenance'

export function DataSourceBadge({ provenance }: { provenance?: DataProvenance }) {
  if (!provenance) return null
  const label = provenanceLabel(provenance)
  const temporalLabel = provenance.mode === 'replay' || provenance.mode === 'illustrative'
    ? 'Selected mission epoch'
    : provenance.mode === 'ephemeris'
      ? 'Ephemeris epoch'
      : 'Observation time'
  const content = (
    <>
      <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
        provenance.mode === 'observed' ? 'bg-green-glow' : provenance.mode === 'unavailable' ? 'bg-red-glow' : 'bg-amber-glow'
      }`} />
      <span>{label}</span>
      {provenance.observedAt && <time className="sr-only" dateTime={provenance.observedAt}>{temporalLabel} {provenance.observedAt}</time>}
    </>
  )
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[9px] leading-relaxed text-slate-400" aria-label={`Data provenance: ${label}`}>
      {provenance.url
        ? <a href={provenance.url} target="_blank" rel="noreferrer noopener" className="flex min-w-0 items-center gap-1.5 underline decoration-slate-700 underline-offset-2 hover:text-cyan-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow">{content}<span className="sr-only">(opens source in a new tab)</span></a>
        : content}
    </div>
  )
}
