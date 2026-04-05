# Artemis Mission Tracker

Real-time 3D mission dashboard tracking NASA's Artemis lunar program. Built with React, Three.js, and live data from JPL Horizons.

**[Live Demo](https://mango-plant-0a0b9ee03.6.azurestaticapps.net/)**

## Features

- **3D Trajectory Visualization** — Real-time Orion spacecraft position with Earth, Moon, and flight path rendered in WebGL
- **Multi-Mission Support** — Switch between Artemis I (historical replay) and Artemis II (live tracking)
- **JPL Horizons Data** — Spacecraft positions sourced from NASA/JPL ephemeris (SPKID -1023, -1024)
- **Mission Timeline** — Visual phase tracker with real-time progress
- **Live Telemetry** — Velocity, distance, and trajectory metrics
- **Space Weather** — Kp index, solar wind, and IMF data from NOAA SWPC
- **Deep Space Network** — Live DSN dish status from NASA's DSN Now
- **NASA Live Feeds** — Embedded YouTube streams for mission coverage
- **Replay Mode** — Scrub through completed missions with play/pause and speed controls (1x to 36,000x)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| 3D Engine | Three.js, React Three Fiber, Drei |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Data | JPL Horizons API, NOAA SWPC, NASA DSN Now |
| API | Azure Functions (Node.js) |
| Hosting | Azure Static Web Apps |

## Data Sources

- **Trajectory**: [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) — Artemis I (SPKID -1023, 304 points) and Artemis II (SPKID -1024, 107 points), EME2000 frame, 2-hour intervals
- **Space Weather**: [NOAA SWPC](https://www.swpc.noaa.gov/) — Kp index, solar wind, IMF
- **DSN**: [NASA DSN Now](https://eyes.nasa.gov/dsn/dsn.html) — Real-time dish status

## Local Development

```bash
npm install && cd api && npm install && cd ..
npm run dev
```

Starts Vite on `localhost:5173` and Azure Functions on `localhost:7071`. Requires [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) v4+.

## Project Structure

```
src/
├── components/       # React components (TrajectoryMap, Header, charts, etc.)
├── data/
│   ├── trajectoryData.ts   # Multi-mission trajectory engine
│   └── artemisIData.ts     # Artemis I ephemeris (JPL Horizons)
├── lib/              # API hooks, types, utilities
└── App.tsx           # Dashboard layout and mission switching
api/
└── src/functions/    # Azure Functions (trajectory, weather, DSN, etc.)
```

## License

MIT
