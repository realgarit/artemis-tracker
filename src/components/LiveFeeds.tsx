import { useState } from 'react'
import { Video, ExternalLink } from 'lucide-react'

const FEEDS = [
  {
    id: 'coverage',
    label: 'Mission Coverage',
    embedUrl: 'https://www.youtube.com/embed/m3kR2KK8TEs?autoplay=0&rel=0&modestbranding=1',
    description: 'Official NASA broadcast with live commentary',
    fallbackUrl: 'https://www.youtube.com/watch?v=m3kR2KK8TEs',
  },
  {
    id: 'orion',
    label: 'Views from Orion',
    embedUrl: 'https://www.youtube.com/embed/6RwfNBtepa4?autoplay=0&rel=0&modestbranding=1',
    description: 'Live camera feed from the Orion spacecraft',
    fallbackUrl: 'https://www.youtube.com/watch?v=6RwfNBtepa4',
  },
  {
    id: 'briefing',
    label: 'Daily Briefing',
    embedUrl: 'https://www.youtube.com/embed/j3Pq35gm4qA?autoplay=0&rel=0&modestbranding=1',
    description: 'Artemis II daily news conference',
    fallbackUrl: 'https://www.youtube.com/watch?v=j3Pq35gm4qA',
  },
]

export function LiveFeeds() {
  const [activeFeed, setActiveFeed] = useState(FEEDS[0].id)
  const feed = FEEDS.find((f) => f.id === activeFeed) || FEEDS[0]

  return (
    <div className="glass-panel border-glow p-4">
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

      {/* Feed tabs */}
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
          key={feed.id}
          src={feed.embedUrl}
          title={feed.label}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[8px] text-slate-600">{feed.description}</span>
        <a
          href={feed.fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[8px] text-slate-600 hover:text-cyan-glow transition-colors flex items-center gap-1"
        >
          Open on YouTube <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  )
}
