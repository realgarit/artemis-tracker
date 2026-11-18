import type { DSNData } from '../lib/types'
import { DataSourceBadge } from './DataSourceBadge'

interface DSNPanelProps {
  data?: DSNData
}

const SITES: Record<string, { label: string }> = {
  Goldstone: { label: 'California, US' },
  Canberra: { label: 'Australia' },
  Madrid: { label: 'Spain' },
}

export function DSNPanel({ data }: DSNPanelProps) {
  if (!data) {
    return (
      <div className="sheet p-4 animate-pulse" aria-hidden="true">
        <div className="h-4 bg-paper-2  w-48 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-paper-2 " />)}
        </div>
      </div>
    )
  }

  // Group dishes by site
  const bySite: Record<string, typeof data.dishes> = {}
  for (const dish of data.dishes) {
    if (!bySite[dish.site]) bySite[dish.site] = []
    bySite[dish.site].push(dish)
  }

  const listedDishes = data.dishes.length
  const orionDishes = data.dishes.filter((d) =>
    d.targets.some((t) => /orion|artemis|integrity/i.test(t.name))
  )
  const emptyFeedMessage = data.provenance?.mode === 'unavailable'
    ? 'The DSN feed is unavailable; this site’s antenna status cannot be inferred.'
    : data.provenance?.mode === 'snapshot'
      ? 'No dishes for this site were listed in the saved DSN response.'
      : 'No dishes for this site were listed in the current DSN response.'

  return (
    <section className="sheet min-w-0 p-3 sm:p-5" aria-labelledby="dsn-panel-title">
      <div className="mb-3 flex min-w-0 flex-col items-start gap-1">
        <div>
          <p className="eyebrow">Earth context · now, not replay</p>
          <h2 id="dsn-panel-title" className="font-display text-lg font-semibold text-ink">Deep Space Network</h2>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-4">
          <span className="min-w-0 break-words font-mono text-xs text-ink-3">
            {listedDishes} dishes listed
            {orionDishes.length > 0 && (
              <span className="ml-2 font-bold text-signal">{orionDishes.length} Orion-like target names</span>
            )}
          </span>
          <DataSourceBadge provenance={data.provenance} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 border-l border-t border-ink md:grid-cols-3">
        {Object.entries(SITES).map(([siteKey, siteInfo]) => {
          const dishes = bySite[siteKey] || []
          return (
            <div key={siteKey} className="min-w-0 border-b border-r border-ink bg-paper p-3">
              <div className="mb-2 flex items-baseline justify-between gap-2 border-b border-rule pb-1.5">
                <h3 className="font-display text-sm font-bold uppercase tracking-tight text-ink">{siteKey}</h3>
                <span className="font-mono text-[11px] text-ink-3">{siteInfo.label}</span>
              </div>

              {dishes.length === 0 ? (
                <div className="py-2 text-xs text-ink-3">{emptyFeedMessage}</div>
              ) : (
                <ul className="space-y-1">
                  {dishes.map((dish) => (
                    <li key={dish.name} className="flex items-baseline justify-between gap-3 font-mono text-xs">
                      <span className="text-ink">{dish.name}</span>
                      <span className="flex min-w-0 flex-wrap justify-end gap-x-2">
                        {dish.targets.slice(0, 2).map((t, i) => (
                          <span key={i} className={/orion|artemis|integrity/i.test(t.name) ? 'font-bold text-signal' : 'text-ink-3'}>{t.name}</span>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
