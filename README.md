# Artemis Mission Tracker

An offline-friendly mission companion for NASA's Artemis program, published at [artemis.realgar.ch](https://artemis.realgar.ch). It runs as a static Vite site on GitHub Pages and does not need Azure, a backend, an account, or an API key.

## What it does

- Replays the NASA/JSC flight ephemerides for Artemis I and Artemis II with a Three.js view and a lightweight 2D/text view.
- Synchronizes mission time across the map, metrics, event timeline, profile charts, shared links, and exports.
- Explains cited mission events and scientific terms; filters official NASA media archives without implying archived material is live.
- Compares both missions using an explicitly chosen UTC, time-since-launch, or shared-event alignment.
- Shows current NOAA space-weather and NASA Deep Space Network readings as present-day Earth context, not historical mission telemetry.
- Labels source, coordinate frame, time scale, observation time, cached age, and coverage gaps. Position is unavailable outside the source-vector interval; the app does not extrapolate.
- Offers date-free calendar follow-ups for planned missions and user-managed offline packs, with the 3D model and textures as an optional download.

## Data and provenance

Orion position and velocity come from NASA/JSC flight ephemeris OEM files distributed on NASA’s [Artemis I tracker page](https://www.nasa.gov/missions/artemis/orion/track-nasas-artemis-i-mission-in-real-time/) and [Artemis II tracker page](https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/). The corresponding source archives, source links, and SHA-256 checksums are in data/sources/. The derived bundle records spacecraft object IDs, the Earth-centered EME2000 frame, UTC time system, units, coverage, source archive hashes, and generation inputs. The combined validation fixture is data/generated/missionEphemerides.generated.json; the published UI loads one smaller flight file per mission from public/data/missionEphemerides-artemis-i.json or public/data/missionEphemerides-artemis-ii.json.

Moon positions are queried from the [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) for the exact mission coverage and stored with the query parameters, retrieval time, and response checksum. The app interpolates the Moon state by epoch, never by array index, and marks values unavailable across gaps larger than 30 minutes. Acceleration is the finite-difference magnitude of the source velocity vector across neighboring covered OEM epochs (km/s²), not spacecraft thrust; it remains unavailable when a suitable neighboring epoch is absent. Geographic latitude and longitude are left unavailable because EME2000 is an inertial frame rather than an Earth-fixed frame. Displayed Earth altitude subtracts a documented 6,371 km reference radius from Earth-center distance.

The generated NASA/JPL dataset is checked against published NASA mission reference values. Charts and exports use the same source vectors as the map, with direct source epochs or interpolation within documented coverage. NASA source pages and ephemeris files are linked in the interface and retained as separate references.

NOAA and DSN adapters fetch current public feeds in the browser. The Pages workflow first retrieves the last published, versioned snapshots, then refreshes them. If a provider fails, the previous validated observation is retained with its original timestamp and a preserved status. An unavailable fallback stays visibly unavailable; it is never presented as a quiet-weather reading, live trajectory, or current spacecraft position. Artemis I's bundled example weather values are illustrative only and are not used as historical mission observations.

## Local development and verification

Requirements: Node.js 20 or later and npm.

    npm ci
    npm run dev

Validate the data catalog, rebuild the ephemeris from pinned NASA/JPL sources, run unit tests, create a production build, and run Chromium browser and accessibility checks with:

    npm run check

Useful focused commands:

    npm test
    npm run test:e2e
    npm run validate:catalog
    npm run validate:media
    npm run generate:calendar
    npm run generate-data

The command npm run fetch:ephemeris re-queries JPL lunar vectors for the pinned NASA OEM files and updates the retrieval manifest. Run npm run prepare:ephemeris afterward to deterministically regenerate the combined validation bundle and per-mission public data files from the pinned source archives and JPL responses. The command npm run generate-data refreshes NOAA and DSN snapshots; it needs network access and preserves the previous snapshot if no deployed snapshot is available.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| 3D engine | Three.js, React Three Fiber, Drei, lazy-loaded on request |
| Charts | Recharts |
| Flight data | NASA/JSC OEM ephemeris and JPL Horizons lunar vectors |
| Current Earth context | NOAA SWPC and NASA DSN Now |
| Hosting | GitHub Pages, artemis.realgar.ch, root CNAME |

src/data/missionData.ts is the mission catalog. src/data/trajectoryData.ts is the shared epoch-based sampling and profile layer. src/components/MissionStoryGuide.tsx and src/data/missionEvents.ts hold cited mission moments. src/lib/offline.ts and public/service-worker.js manage optional offline packs. scripts/generate-data.ts creates versioned feed snapshots; scripts/fetch-ephemeris-sources.ts and scripts/prepare-ephemeris.ts retrieve and validate the pinned flight-data inputs.

The legacy api/ directory is not part of the published runtime. Do not add runtime /api/artemis/* requests or a server dependency to the Pages build. The deploy workflow preserves CNAME, copies dist/index.html to dist/404.html, refreshes validated snapshots, and verifies the deployed routes and public data.

## License

The application is MIT. The Orion model at public/models/orion.glb is GPL-3.0 and is credited in its asset directory. Source photos, videos, and media remain on NASA pages with their original per-item credits.
