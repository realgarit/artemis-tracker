import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'
import type { DSNData } from '../lib/types'

interface DSNPanelProps {
  data?: DSNData
}

const SITES: Record<string, { label: string; flag: string; color: string }> = {
  Goldstone: { label: 'Goldstone, CA', flag: '🇺🇸', color: '#22d3ee' },
  Canberra: { label: 'Canberra, AU', flag: '🇦🇺', color: '#a78bfa' },
  Madrid: { label: 'Madrid, ES', flag: '🇪🇸', color: '#f59e0b' },
}

export function DSNPanel({ data }: DSNPanelProps) {
  if (!data) {
    return (
      <div className="glass-panel border-glow p-4 animate-pulse">
        <div className="h-4 bg-slate-700/50 rounded w-48 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-700/30 rounded" />)}
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

  const activeDishes = data.dishes.length
  const orionDishes = data.dishes.filter((d) =>
    d.targets.some((t) => /orion|artemis|integrity/i.test(t.name))
  )

  return (
    <motion.div
      className="glass-panel border-glow p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-cyan-glow" strokeWidth={2} />
          <span className="text-[10px] text-slate-400 uppercase tracking-[.2em] font-semibold">
            Deep Space Network
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-slate-500">
            {activeDishes} dishes active
            {orionDishes.length > 0 && (
              <span className="text-cyan-glow ml-2">{orionDishes.length} tracking Orion</span>
            )}
          </span>
          <span className="text-[8px] text-slate-600 font-mono">{data.source}</span>
        </div>
      </div>

      {/* Sites grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(SITES).map(([siteKey, siteInfo]) => {
          const dishes = bySite[siteKey] || []
          return (
            <div
              key={siteKey}
              className="bg-space-800/50 rounded p-3 border border-slate-800/60"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{siteInfo.flag}</span>
                  <span className="text-[9px] text-slate-300 font-semibold uppercase tracking-wider">
                    {siteKey}
                  </span>
                </div>
                <span className="text-[8px] text-slate-600">{siteInfo.label}</span>
              </div>

              {dishes.length === 0 ? (
                <div className="text-[9px] text-slate-600 py-2">No active dishes</div>
              ) : (
                <div className="space-y-1.5">
                  {dishes.map((dish) => (
                    <div key={dish.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: siteInfo.color }}
                        />
                        <span className="font-mono text-[9px] text-slate-400">{dish.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {dish.targets.slice(0, 2).map((t, i) => (
                          <span
                            key={i}
                            className={`text-[8px] font-mono ${
                              /orion|artemis|integrity/i.test(t.name)
                                ? 'text-cyan-glow font-semibold'
                                : 'text-slate-500'
                            }`}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
