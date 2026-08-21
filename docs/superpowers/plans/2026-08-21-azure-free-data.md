# Azure-free Artemis data implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax so progress can be tracked.

**Goal:** Remove the published app’s Azure runtime dependency while keeping the GitHub Pages dashboard useful through browser-side JPL, NOAA, and NASA DSN adapters, deterministic fallbacks, and scheduled same-origin snapshots.

**Architecture:** Keep the legacy Azure Functions source out of the published bundle, move the data contracts and parsing logic needed by the UI into `src/data` and `src/lib`, and make the React Query hooks compose direct upstream fetches, Pages snapshot fetches, and local fallback data. Extend the existing Pages workflow with a scheduled snapshot-generation step.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, Node built-in test runner through the existing `tsx` dependency, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-21-azure-free-data-design.md`

## Global constraints

- Preserve the root `CNAME` and the existing Pages deployment shape.
- Do not add secrets, a server, Azure resources, or a paid hosting dependency.
- Keep all network parsing functions pure and directly unit-testable.
- Use `apply_patch` for source edits and keep the legacy API source untouched unless a documentation or package reference must change.
- Run the relevant failing test immediately after adding each test group, then run the passing test after implementation.
- Keep the published app free of `/api/artemis/*` calls.

## Tasks

- [x] **Task 1: Add failing tests for browser-safe data contracts and parsers**

  **Files:**
  - Add `src/lib/__tests__/missionData.test.ts`
  - Add `src/lib/__tests__/horizons.test.ts`
  - Add `src/lib/__tests__/spaceWeather.test.ts`
  - Add `src/lib/__tests__/dsn.test.ts`
  - Modify `package.json` to add the `test` script

  Write tests first for completed-mission status/crew, JPL `$$SOE`/`$$EOE` vector parsing and trajectory normalization, NOAA rows from the current K-index/summary/RTSW shapes, and representative DSN XML including an empty feed. Assert malformed input is rejected or produces an explicit empty result. Run `npm test`; it must fail because the new modules do not exist yet.

- [x] **Task 2: Move mission data and implement the JPL adapter/fallback**

  **Files:**
  - Add `src/data/missionData.ts`
  - Add `src/lib/horizons.ts`
  - Add `src/lib/trajectoryFallback.ts`
  - Modify `src/data/trajectoryData.ts` only where imports/types need to share the browser mission contract

  Port the mission configuration/status calculation without Azure imports. Implement bounded browser fetches to JPL Horizons, pure parsing of vector rows, conversion to the existing `TrajectoryPoint` shape, and a deterministic local fallback based on the existing Artemis trajectory data. Make missing current ephemeris a normal fallback path.

  Run `npm test -- src/lib/__tests__/missionData.test.ts src/lib/__tests__/horizons.test.ts`; the new tests must pass.

- [x] **Task 3: Implement NOAA and NASA DSN browser adapters with snapshot fallbacks**

  **Files:**
  - Add `src/lib/spaceWeather.ts`
  - Add `src/lib/dsn.ts`
  - Add `src/data/fallbackData.ts`

  Use the working NOAA planetary K-index, solar-wind summary/RTSW, and magnetic RTSW endpoints. Normalize only valid numeric rows and retain static fallback values. Parse NASA Eyes DSN XML into the UI contract, preserving an explicit empty state. Add same-origin snapshot fallback helpers and stable seed values.

  Run `npm test -- src/lib/__tests__/spaceWeather.test.ts src/lib/__tests__/dsn.test.ts`; the parser tests must pass.

- [x] **Task 4: Replace the Azure API hooks and simplify local development**

  **Files:**
  - Modify `src/lib/api.ts`
  - Modify `src/App.tsx`
  - Modify `package.json` and `package-lock.json`

  Remove the `/api/artemis` base URL and unused history calls. Make `useMission` local, and make the trajectory, weather, and DSN hooks use direct adapters, same-origin snapshots, and local fallback values with bounded query intervals. Change `npm run dev` to start Vite without Azure Functions or `concurrently`. Keep UI behavior intact while ensuring mission/crew data renders with no backend.

  Run the complete `npm test` suite and verify there are no `/api/artemis` references in published `src/` code.

- [x] **Task 5: Add scheduled snapshot generation and update project documentation**

  **Files:**
  - Add `scripts/generate-data.ts`
  - Add `public/data/spaceweather.json`
  - Add `public/data/dsn.json`
  - Add `public/data/trajectory-artemis-ii.json`
  - Modify `.github/workflows/deploy-pages.yml`
  - Modify `README.md`
  - Modify `AGENTS.md`

  Generate valid JSON snapshots with bounded fetches, reusing the tested TypeScript parsers, preserving existing data on transient failure, and writing seed data on first run. Run the generator through the existing `tsx` dependency during push/manual/scheduled Pages builds, on a 15-minute schedule. Document the new data flow, local commands, limitations, and the fact that the custom domain remains on GitHub Pages.

  Run the generator locally, inspect all JSON files, and run `npm run build`.

- [x] **Task 6: Verify the integrated application before publication**

  **Files:** no new files expected.

  Run `npm ci`, `npm test`, `npm run build`, and `npm run dev`/preview checks. Inspect the generated bundle for Azure API calls. Use the live browser to verify the custom domain, mission/crew view, fallback trajectory, weather/DSN states, direct route handling, and absence of `/api` failures caused by the app. Confirm workflow YAML and generated asset paths.

- [ ] **Task 7: Publish, merge, deploy, and record final state**

  Commit the implementation on `codex/azure-free-data`, push it, open a draft PR, run the available checks, update/fix as needed, then merge through GitHub without force-pushing. Verify the Pages deployment corresponds to the merge SHA and recheck the live dashboard/data flows. Remove the merged local/remote feature branch and append durable results to `AGENTS.md` before finishing.

## Self-review checklist

- [x] Every acceptance criterion in the spec is covered by a task.
- [x] Tests are written before implementation and cover malformed/empty upstream data.
- [x] Type names and file paths match the existing project structure.
- [x] No task depends on an unspecified hosting service, secret, or manual server.
- [x] The workflow schedule, snapshot paths, and browser fallback order are consistent.
