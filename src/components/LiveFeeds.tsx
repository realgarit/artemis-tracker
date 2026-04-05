import { useState } from 'react'
import { Video, ExternalLink } from 'lucide-react'

const FEEDS = [
  {
    id: 'nasatv',
    label: 'NASA TV',
    // NASA TV Public channel live stream — most reliable
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCLA_DiR1FfKNvjuUpBHmylQ&autoplay=0',
    description: 'Official NASA Television live broadcast',
    fallbackUrl: 'https://www.youtube.com/@NASA/live',
  },
  {
    id: 'nasaplus',
    label: 'NASA+',
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCryGec9z56KwMFsMKRGJLsA&autoplay=0',
    description: 'NASA+ streaming service — Artemis II coverage',
    fallbackUrl: 'https://plus.nasa.gov/',
  },
]

export function LiveFeeds() {
  const [activeFeed, setActiveFeed] = useState(FEEDS[0].id)
  const [embedError, setEmbedError] = useState(false)
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
            onClick={() => { setActiveFeed(f.id); setEmbedError(false) }}
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

      {/* Video embed or fallback link */}
      {!embedError ? (
        <div className="relative w-full rounded overflow-hidden bg-space-900" style={{ paddingBottom: '56.25%' }}>
          <iframe
            key={feed.embedUrl}
            src={feed.embedUrl}
            title={feed.label}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setEmbedError(true)}
          />
        </div>
      ) : (
        <div className="w-full rounded bg-space-800/50 border border-slate-800 p-8 text-center">
          <Video className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <div className="text-sm text-slate-400 mb-2">Stream unavailable in embed</div>
          <a
            href={feed.fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-cyan-glow hover:text-cyan-glow/80 transition-colors font-semibold"
          >
            Watch on {feed.label} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <div className="mt-2 text-[8px] text-slate-600">{feed.description}</div>
    </div>
  )
}
