# Repository instructions

Keep the GitHub Pages deployment workflow aligned with the Vite build and preserve the root `CNAME` file for `artemis.realgar.ch`.

## Agent files

- This `AGENTS.md` is the canonical project instruction file; keep any Claude or Copilot files as pointers.
- Shared repository skills belong in `.agents/skills/`, which Codex scans natively. A `.claude/skills/` path is only a compatibility bridge or generated mirror.

## Working notes

- GitHub Pages is configured for the `main` branch and deploys the compiled `dist` artifact through `.github/workflows/deploy-pages.yml`.
- The workflow copies `dist/index.html` to `dist/404.html` so the client-side mission routes work on direct navigation.
- The former Azure Static Web Apps origin is no longer serving the API; the published frontend must not reintroduce `/api/artemis/*` runtime calls.
- Flown mission replays use NASA/JSC OEM spacecraft vectors and time-matched JPL Horizons Moon vectors. Source archives and checksums live in `data/sources/`; `npm run prepare:ephemeris` rebuilds the checked-in generated dataset. Re-run `npm run fetch:ephemeris` only when deliberately refreshing the Moon input, then inspect source hashes and reference checks.
- NOAA SWPC and NASA DSN are current Earth-context feeds. Public snapshots use schema version 1 and retain observation timestamps when a refresh fails; `public/data/status.json` records feed health. Never reuse current weather or DSN readings as historical mission data.
- `/compare`, event replays, charts, moment links, bookmarks, and exports use the shared UTC mission clock. The route-only 2D view avoids importing WebGL assets until 3D is requested.
- Offline mission packs are opt-in and managed by Cache Storage. The 3D model and textures are optional; external NASA media remains linked rather than cached or rehosted.
- `npm run dev` starts Vite. `npm run check` validates the catalog, regenerates the offline flight-data bundle and calendars, type-checks, runs unit tests, builds, and runs Playwright/axe browser checks. Install Chromium with `npx playwright install chromium` for local browser tests. The legacy `api/` directory is not part of the published runtime.
- Artemis II phase and event timestamps come from NASA post-flight records; the currently displayed date window and crew list were checked against NASA mission pages on 2026-09-27.
- The five-person newcomer comprehension study and two-week opt-in return-use pilot are product research gates; they require real participants and must not be reported as complete from automated tests.
- 2026-09-27 — The pinned NASA OEM archives and JPL Horizons lunar responses in `data/sources/` are the source of truth for both flown paths. Run `npm run prepare:ephemeris` after changing those inputs; it deterministically rewrites the test-only combined fixture in `data/generated/` and the per-mission public bundles in `public/data/`. Do not reintroduce the previous unverified point arrays as measured telemetry.
- 2026-09-27 — Offline packs use schema v2 with app/data versions, SHA-256 checksums for every resource, post-cache verification, and a manifest written only after full completion. The service worker ignores partial caches; updates preserve the previous complete pack until the replacement is verified. The v1 timestamp-only IndexedDB history migrates to explicitly unattributed records; new records are source-tagged, mission-keyed replay values only.
- 2026-09-27 — `npm run check` is the PR release gate. `docs/validation/manual-acceptance.md` holds pending newcomer-study, two-week pilot, real calendar-client, and manual screen-reader/device protocols; do not mark those external gates complete based on Playwright results.
- 2026-09-27 — Roadmap implementation merged in PR #20 (`fc44025`); GitHub validation passed, and Pages build/deploy plus `scripts/verify-live-site.mjs` passed in run `36282233444`. PR #21 (`5e243ae`) adds checkout to the deploy job so future post-deploy verification can find its source script. Human studies, two external calendar clients, manual accessibility/device checks, and item-level media rights/caption review remain pending in `docs/validation/manual-acceptance.md`.
- Flight records use Earth-centered EME2000 and UTC; Moon states are interpolated by epoch and ignored across gaps over 30 minutes. NASA splashdown and flyby events may lie just outside OEM coverage and should remain readable while their positions/metrics stay unavailable.
- Live NOAA/DSN snapshots remain current Earth context. The generated same-origin data manifest is `public/data/status.json`; on deployment the workflow tries to restore the prior Pages snapshot before refreshing it.
- The Pages deployment for merge SHA `2803bd2` succeeded as workflow run `32529322946`; the custom domain root, live JSON snapshots, and direct crew route were checked afterward.
- Keep the test script as `node --import tsx --test` without a quoted shell glob: GitHub's Linux runner does not expand the Windows-oriented glob form.
- Mission comparisons accept independent `left` and `right` flown-mission IDs in the query string; profile selection, event/elapsed/UTC alignment, selected offset, and browser history are restored together. Keep samples separate by mission and preserve explicit nulls for missing coverage.
- Replay acceleration is the magnitude of the finite-difference NASA velocity vector across covered OEM epochs, in km/s²; samples without a neighboring covered epoch remain null. It describes the ephemeris velocity change, not spacecraft thrust.
- 2D epoch playback and 3D mission-day playback use deterministic `src/lib/replayClock.ts` steps. When a tab becomes hidden, both control surfaces pause instead of integrating suspended wall time into an unexpected jump.
- `npm run prepare:pages` creates the `404.html` SPA fallback and copies the root `CNAME` into `dist`; `npm run verify:pages` asserts those files and the application mount point before Pages uploads the artifact.
- The sticky metrics bar includes its trajectory provenance badge; a replay epoch must not be announced as an observation time. Keep the three-run mobile performance check isolated from concurrent browser and axe tests so its CPU/network profile stays reproducible.

- 2026-09-16 — Codex-first layout sweep: repository-local shared skills use `.agents/skills/` as the canonical source. Any `.claude/skills/` path is only a compatibility bridge or generated mirror.
