import { useState } from 'react'
import { Video, ExternalLink } from 'lucide-react'

const FEEDS = [
  {
    id: 'mission',
    label: 'Mission Coverage',
    videoId: 'm3kR2KK8TEs',
    description: 'Official NASA broadcast with commentary',
  },
  {
    id: 'orion',
    label: 'Views from Orion',
    videoId: '6RwfNBtepa4',
    description: 'Live camera feed from the Orion spacecraft',
  },
]

export function LiveFeeds() {
  const [activeFeed, setActiveFeed] = useState(FEEDS[0].id)
  const feed = FEEDS.find((f) => f.id === activeFeed) || FEEDS[0]

  return (
    <div className="glass-panel border-glow p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video className="h-3.5 w-3.5 text-red-glow" strokeWidth={2} />
          <span className="text-[10px] text-slate-400 uppercase tracking-[.2em] font-semibold">
            NASA Live
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-red-glow live-pulse" />
        </div>
        <a
          href="https://www.nasa.gov/live/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[8px] text-slate-500 hover:text-cyan-glow transition-colors"
        >
          nasa.gov/live <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>

      {/* Feed selector tabs */}
      <div className="flex gap-1 mb-3">
        {FEEDS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFeed(f.id)}
            className={`px-3 py-1.5 rounded text-[9px] font-semibold tracking-wider uppercase transition-all ${
              activeFeed === f.id
                ? 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Video embed */}
      <div className="relative w-full rounded overflow-hidden bg-space-900" style={{ paddingBottom: '56.25%' }}>
        <iframe
          key={feed.videoId}
          src={`https://www.youtube.com/embed/${feed.videoId}?autoplay=0&rel=0&modestbranding=1&color=white`}
          title={feed.label}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="mt-2 text-[8px] text-slate-600">{feed.description}</div>
    </div>
  )
}
