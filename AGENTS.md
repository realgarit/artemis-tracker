# Repository instructions

Keep the GitHub Pages deployment workflow aligned with the Vite build and preserve the root `CNAME` file for `artemis.realgar.ch`.

## Agent files

- This `AGENTS.md` is the canonical project instruction file; keep any Claude or Copilot files as pointers.
- Shared repository skills belong in `.agents/skills/`, which Codex scans natively. A `.claude/skills/` path is only a compatibility bridge or generated mirror.

## Working notes

- 2026-10-08: Dependabot alerts/security updates are enabled. Version updates run
  weekly on Monday at 06:00 Europe/Zurich for the manifests in .github/dependabot.yml.
  Minor/patch updates are grouped, majors stay separate, and merging remains review-driven.
  Routine versions have a seven-day cooldown; security updates are not delayed.


- GitHub Pages is configured for the `main` branch and deploys the compiled `dist` artifact through `.github/workflows/deploy-pages.yml`.
- The workflow copies `dist/index.html` to `dist/404.html` so the client-side mission routes work on direct navigation.
- The former Azure Static Web Apps origin is no longer serving the API; the published frontend must not reintroduce `/api/artemis/*` runtime calls.
- Flown mission replays use NASA/JSC OEM spacecraft vectors and time-matched JPL Horizons Moon vectors. Source archives and checksums live in `data/sources/`; `npm run prepare:ephemeris` rebuilds the checked-in generated dataset. Re-run `npm run fetch:ephemeris` only when deliberately refreshing the Moon input, then inspect source hashes and reference checks.
- NOAA SWPC and NASA DSN are current Earth-context feeds. Public snapshots use schema version 1 and retain observation timestamps when a refresh fails; `public/data/status.json` records feed health. Never reuse current weather or DSN readings as historical mission data.
- `/compare`, event replays, charts, moment links, bookmarks, and exports use the shared UTC mission clock. The route-only 2D view avoids importing WebGL assets until 3D is requested.
- Offline mission packs are opt-in and managed by Cache Storage. The 3D model and textures are optional; external NASA media remains linked rather than cached or rehosted.
- `npm run dev` starts Vite. `npm run check` validates the catalog, regenerates the offline flight-data bundle and calendars, type-checks, runs unit tests, builds, and runs Playwright/axe browser checks. Install Chromium with `npx playwright install chromium` for local browser tests. The legacy `api/` directory is not part of the published runtime.
- Artemis II phase and event timestamps come from NASA post-flight records; the currently displayed date window and crew list were checked against NASA mission pages on 2026-09-27.
- 2026-09-27 — At the user's direction, the five-person newcomer study (#13) and two-week return-use pilot (#6) were removed from roadmap acceptance. Do not report study or pilot outcomes; see `docs/validation/manual-acceptance.md` for the recorded scope decision.
- 2026-09-27 — The pinned NASA OEM archives and JPL Horizons lunar responses in `data/sources/` are the source of truth for both flown paths. Run `npm run prepare:ephemeris` after changing those inputs; it deterministically rewrites the test-only combined fixture in `data/generated/` and the per-mission public bundles in `public/data/`. Do not reintroduce the previous unverified point arrays as measured telemetry.
- 2026-09-27 — Offline packs use schema v2 with app/data versions, SHA-256 checksums for every resource, post-cache verification, and a manifest written only after full completion. The service worker ignores partial caches; updates preserve the previous complete pack until the replacement is verified. The v1 timestamp-only IndexedDB history migrates to explicitly unattributed records; new records are source-tagged, mission-keyed replay values only.
- 2026-09-27 — `npm run check` is the PR release gate. `docs/validation/manual-acceptance.md` records the user-directed de-scope of participant, third-party calendar-client, screen-reader, browser-zoom, and physical-device checks; these are out of scope, not reported as passed.
- 2026-09-27 — Roadmap implementation merged in PRs #20–#31; GitHub validation and Pages deployment passed. PR #21 adds checkout to the deploy job so post-deploy verification can find its source script. NASA item-level media review is recorded in `docs/validation/manual-acceptance.md`; issue #19 is closed.
- Flight records use Earth-centered EME2000 and UTC; Moon states are interpolated by epoch and ignored across gaps over 30 minutes. NASA splashdown and flyby events may lie just outside OEM coverage and should remain readable while their positions/metrics stay unavailable.
- Live NOAA/DSN snapshots remain current Earth context. The generated same-origin data manifest is `public/data/status.json`; on deployment the workflow tries to restore the prior Pages snapshot before refreshing it.
- The Pages deployment for merge SHA `2803bd2` succeeded as workflow run `32529322946`; the custom domain root, live JSON snapshots, and direct crew route were checked afterward.
- Keep the test script as `node --import tsx --test` without a quoted shell glob: GitHub's Linux runner does not expand the Windows-oriented glob form.
- Mission comparisons accept independent `left` and `right` flown-mission IDs in the query string; profile selection, event/elapsed/UTC alignment, selected offset, and browser history are restored together. Keep samples separate by mission and preserve explicit nulls for missing coverage.
- 2026-09-27 — A flown-mission route with no explicit shared UTC time starts at the first covered NASA state-vector epoch, not liftoff when the OEM has no sample yet. This puts Orion in view immediately without inventing pre-coverage position; moment links retain their exact requested epoch, and the replay reset returns to first covered data.
- Replay acceleration is the magnitude of the finite-difference NASA velocity vector across covered OEM epochs, in km/s²; samples without a neighboring covered epoch remain null. It describes the ephemeris velocity change, not spacecraft thrust.
- 2D epoch playback and 3D mission-day playback use deterministic `src/lib/replayClock.ts` steps. When a tab becomes hidden, both control surfaces pause instead of integrating suspended wall time into an unexpected jump.
- Mission-event IDs are stable. If editorial data is corrected, append a dated field/old-value/new-value/reason/source entry to that event; the event validator requires the correction record and the UI exposes it.
- `npm run prepare:pages` creates the `404.html` SPA fallback and copies the root `CNAME` into `dist`; `npm run verify:pages` asserts those files and the application mount point before Pages uploads the artifact.
- The sticky metrics bar includes its trajectory provenance badge; a replay epoch must not be announced as an observation time. Keep the three-run mobile performance check isolated from concurrent browser and axe tests so its CPU/network profile stays reproducible.

- 2026-09-16 — Codex-first layout sweep: repository-local shared skills use `.agents/skills/` as the canonical source. Any `.claude/skills/` path is only a compatibility bridge or generated mirror.
- 2026-09-27 — Artemis roadmap implementation for #7–#19 shipped across PRs #20–#31, with later 3D and font corrections in PRs #36–#38 and desktop browser evidence in #39–#40. Issue #19's source-backed media review, including the direct NASA SRT transcript, is recorded in `docs/validation/manual-acceptance.md`. The user removed participant studies, external calendar-client, manual screen-reader/zoom, and physical-device checks from goal acceptance; do not describe those de-scoped checks as passed.
- 2026-09-27 — Offline-pack quota and private-profile failures give distinct recovery guidance; unit and Playwright tests cover `QuotaExceededError`, `SecurityError`, update preservation, and cold offline navigation. Microsoft Edge 154 desktop product results are recorded in `docs/validation/manual-acceptance.md`; physical mobile-browser validation is out of scope by user direction.
- 2026-09-27 — Primary mission-selector, phase-replay, provenance, event-source, and media-guidance touch targets are at least 44 CSS pixels. Playwright covers the mission → event → source → share journey and asserts core target bounds. Manual screen-reader, actual browser-zoom, and physical-device checks were removed from roadmap acceptance at the user's direction.
- 2026-09-27 — Mission-phase replay controls are command buttons with `aria-current="step"`, not toggle buttons; their active name also announces “current phase.” Activating one seeks to that phase and cannot turn it off. Preserve these button semantics in the accessibility tree.
- 2026-09-27 — Three.js scene positions must be transformed with `horizonsToThree`: live mission getters return EME2000 kilometer vectors, while scene geometry uses scaled Y-up coordinates. Initialize the 3D replay from the shared selected epoch; when an epoch is outside OEM coverage, leave spacecraft/Moon positions unavailable while keeping Earth focus usable. Camera presets must also snap into place for reduced-motion users.
- 2026-09-27 — Self-host the interface typefaces through Fontsource so live and offline views use the same Arial/system body copy, Space Grotesk headings, Orbitron brand/scene labels, and Space Mono telemetry. Keep their WOFF2 assets discoverable through the Vite manifest and cover successful local font loading in browser tests. Keep Space Grotesk off body copy to protect the cold-mobile LCP budget.
