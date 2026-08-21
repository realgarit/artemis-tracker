# Azure-free Artemis data design

## Goal

Keep `artemis.realgar.ch` fully usable on GitHub Pages without Azure, a server, or any other active hosting account. The published frontend must still show mission information, a useful trajectory, current space weather when available, and DSN status when available.

## Findings

The following requests were tested from the deployed site’s browser context on 2026-08-21:

| Source | Result | Decision |
| --- | --- | --- |
| JPL Horizons historical vector query | Browser fetch succeeds and returns `$$SOE`/`$$EOE` data | Use a browser adapter for live/replay trajectory data |
| JPL Horizons current vector query for completed Artemis II | HTTP succeeds but has no current ephemeris | Treat missing current ephemeris as normal and use the local replay trajectory |
| NOAA planetary K-index feed | HTTP 200 with permissive CORS | Use directly from the browser |
| NOAA legacy solar-wind plasma/magnetic feeds | HTTP 404 | Replace with current summary and RTSW feeds |
| NOAA current wind and magnetic RTSW feeds | HTTP 200 with permissive CORS | Use directly from the browser |
| NASA Eyes DSN XML feed | HTTP 200 with permissive CORS | Parse directly from the browser |

## Architecture

1. The React app owns the public data adapters in `src/lib/`. No published code calls `/api/artemis/*`.
2. Mission configuration and completed-mission status move into browser-safe data code under `src/data/`.
3. JPL Horizons is queried only when a current/replay vector is useful. A missing ephemeris, network failure, or parse failure returns the deterministic local trajectory fallback already used by the visualizer.
4. NOAA adapters use the working K-index, solar-wind summary/RTSW, and magnetic RTSW endpoints. Invalid or incomplete rows are ignored, and a stable static fallback remains available.
5. The DSN adapter parses the NASA XML feed. A failed or empty feed yields an explicit empty-status fallback rather than a blank application.
6. GitHub Pages builds run a small Node snapshot generator before Vite. It writes `public/data/` JSON files from the same upstream sources. The browser adapters use those same-origin snapshots after direct upstream access fails. The scheduled Pages workflow refreshes them every 15 minutes, so no separate host or running server is required.
7. Local development starts Vite only. The legacy Azure Functions source remains outside the published bundle for historical reference, but it is no longer part of the app runtime or default development path.

## Data contracts

- `MissionConfig` and `MissionStatus` are browser-safe equivalents of the former mission service contract.
- `TrajectoryPoint` contains timestamp, position, distance, velocity, and phase information consumed by the existing 3D view.
- `SpaceWeatherData` contains Kp, solar-wind speed/density, magnetic field strength/Bz, timestamp, and source metadata.
- `DSNData` contains a timestamp, source, and normalized dish records. Empty data is valid and rendered as unavailable rather than throwing.

## Reliability behavior

- Direct upstream fetches have bounded timeouts and React Query retry/backoff.
- Same-origin snapshot JSON is the next fallback.
- Deterministic local mission, trajectory, weather, and DSN fallback values keep the dashboard renderable when all network sources are unavailable.
- The scheduled generator preserves the previous snapshot when an upstream request fails and writes valid seed data on a first run.
- Completed mission views continue to use their historical local weather presentation; active/current views can use the live NOAA adapter.

## Scope exclusions

- No replacement backend, database, secrets, or paid hosting.
- No attempt to make JPL provide a current ephemeris after the mission has ended.
- No deletion of the legacy Azure source in this change; only its runtime and default development dependency are removed.

## Acceptance criteria

- `npm run dev` works without Azure Functions or an Azure account.
- Unit tests cover the JPL, NOAA, DSN, and mission adapters, including malformed/empty upstream data.
- `npm run build` succeeds and includes the snapshot fallback directory.
- The Pages workflow supports push, manual, and scheduled refreshes.
- The deployed custom domain renders mission/crew data, trajectory fallback, and graceful weather/DSN states without `/api` calls.
- The change is merged to `main`, deployment is checked against the merged SHA, and the repository notes explain the new data flow.
