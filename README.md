# Artemis Mission Tracker

3D mission dashboard for NASA’s Artemis lunar program, published at [artemis.realgar.ch](https://artemis.realgar.ch). It runs as a static Vite site on GitHub Pages and does not require Azure, a server, or an active hosting account.

## Features

- **3D trajectory visualization** — Orion, Earth, Moon, and the mission flight path rendered with WebGL
- **Multi-mission support** — Artemis I and Artemis II historical replay data
- **JPL Horizons adapter** — browser-side ephemeris queries when a current vector is available, with a deterministic local replay fallback
- **Mission timeline and crew** — mission phases, milestones, and Artemis II crew data are bundled in the frontend
- **Space weather** — Kp, solar-wind, and IMF data from [NOAA SWPC](https://services.swpc.noaa.gov/products/summary/)
- **Deep Space Network** — normalized dish status from [NASA DSN Now](https://eyes.nasa.gov/dsn/dsn.html)
- **Graceful offline behavior** — same-origin Pages snapshots and local fallback data keep the dashboard renderable when upstream feeds are unavailable

## Data flow

The frontend adapters use this order:

1. Direct browser fetch from JPL Horizons, NOAA SWPC, or NASA DSN Now.
2. Same-origin JSON snapshots in `public/data/` when direct access fails.
3. Deterministic local mission, trajectory, weather, or empty-DSN fallback data.

GitHub Pages runs `npm run generate-data` during every deployment and on a 15-minute schedule. The generator refreshes the snapshots without committing generated files or needing a second host. JPL Horizons normally has no current ephemeris after a mission has ended; that is expected, so completed missions use the bundled replay trajectory.

## Local development

```bash
npm install
npm run dev
```

This starts Vite at `http://localhost:5173`. No Azure Functions Core Tools, Azure account, API key, or local backend is required.

To refresh the local snapshot files from the public feeds:

```bash
npm run generate-data
```

Run the parser tests with:

```bash
npm test
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| 3D engine | Three.js, React Three Fiber, Drei |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Public data | JPL Horizons, NOAA SWPC, NASA DSN Now |
| Hosting | GitHub Pages with the `artemis.realgar.ch` custom domain |

## Project structure

```
src/
├── components/       # Dashboard, trajectory, charts, weather, and DSN panels
├── data/
│   ├── missionData.ts     # Browser-safe mission configuration and status
│   ├── fallbackData.ts    # Stable offline weather and DSN values
│   ├── trajectoryData.ts  # Multi-mission replay/visualization engine
│   └── artemisIData.ts    # Artemis I ephemeris points
├── lib/
│   ├── horizons.ts        # JPL browser adapter and vector parser
│   ├── spaceWeather.ts    # NOAA browser adapter and feed normalizer
│   ├── dsn.ts             # NASA DSN XML adapter
│   └── api.ts             # React Query hooks and fallback order
└── App.tsx
scripts/
└── generate-data.ts   # Scheduled same-origin snapshot generator
public/data/           # Seed snapshots copied into the Pages artifact
api/                   # Legacy Azure Functions source; not used by Pages
```

## License

MIT — except the Orion 3D model (`public/models/orion.glb`) which is GPL-3.0, created by [Mikius538](https://www.printables.com/model/1665038-esa-orion-capsule-arremis).
