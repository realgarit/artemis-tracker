# Repository instructions

Keep the GitHub Pages deployment workflow aligned with the Vite build and preserve the root `CNAME` file for `artemis.realgar.ch`.

## Working notes

- GitHub Pages is configured for the `main` branch and deploys the compiled `dist` artifact through `.github/workflows/deploy-pages.yml`.
- The workflow copies `dist/index.html` to `dist/404.html` so the client-side mission routes work on direct navigation.
- The former Azure Static Web Apps origin is no longer serving the API. The frontend's `/api/artemis/*` calls therefore need a separately available backend before live telemetry can be restored.
