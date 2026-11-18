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
      <span aria-hidden="true" className={`inline-block h-2 w-2 shrink-0 rounded-full ${
        provenance.mode === 'observed' ? 'bg-ok' : provenance.mode === 'unavailable' ? 'bg-bad' : 'bg-signal-hot'
      }`} />
      <span>{label}</span>
      {provenance.observedAt && <time className="sr-only" dateTime={provenance.observedAt}>{temporalLabel} {provenance.observedAt}</time>}
    </>
  )
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[11px] leading-snug text-ink-3" aria-label={`Data provenance: ${label}`}>
      {provenance.url
        ? <a href={provenance.url} target="_blank" rel="noreferrer noopener" className="flex min-h-11 min-w-0 items-center gap-1.5 underline decoration-rule underline-offset-2 hover:text-ink">{content}<span className="sr-only">(opens source in a new tab)</span></a>
        : content}
    </div>
  )
}
