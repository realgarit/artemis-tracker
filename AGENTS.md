# Repository instructions

Keep the GitHub Pages deployment workflow aligned with the Vite build and preserve the root `CNAME` file for `artemis.realgar.ch`.

## Agent files

- This `AGENTS.md` is the canonical project instruction file; keep any Claude or Copilot files as pointers.
- Shared repository skills belong in `.agents/skills/`, which Codex scans natively. A `.claude/skills/` path is only a compatibility bridge or generated mirror.

## Working notes

- GitHub Pages is configured for the `main` branch and deploys the compiled `dist` artifact through `.github/workflows/deploy-pages.yml`.
- The workflow copies `dist/index.html` to `dist/404.html` so the client-side mission routes work on direct navigation.
- The former Azure Static Web Apps origin is no longer serving the API; the published frontend must not reintroduce `/api/artemis/*` runtime calls.
- The frontend uses browser-side JPL Horizons, NOAA SWPC, and NASA DSN adapters with same-origin `public/data/` snapshots and deterministic local fallbacks; the Pages workflow refreshes snapshots every 15 minutes.
- `npm run dev` starts Vite only and `npm test` covers mission, JPL, NOAA, and DSN parsing. The legacy `api/` directory is not part of the published runtime.
- The Pages deployment for merge SHA `2803bd2` succeeded as workflow run `32529322946`; the custom domain root, live JSON snapshots, and direct crew route were checked afterward.
- Keep the test script as `node --import tsx --test` without a quoted shell glob: GitHub's Linux runner does not expand the Windows-oriented glob form.

- 2026-09-16 — Codex-first layout sweep: repository-local shared skills use `.agents/skills/` as the canonical source. Any `.claude/skills/` path is only a compatibility bridge or generated mirror.
