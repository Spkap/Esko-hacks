# Wavelength frontend — seeded M1–M6 demo

Requirements: Node.js 22.17+ and pnpm 11.25.0.

```sh
pnpm -C frontend install --frozen-lockfile
pnpm -C frontend dev
```

Open http://127.0.0.1:3000 for the landing page, or http://127.0.0.1:3000/dashboard for the workspace. The default data mode is `demo`; copy `.env.example` to `.env.local` to configure it explicitly. `live` displays a connection error because backend integration is outside M1–M4.

The dashboard, artwork viewer, selected evidence, reviewer decisions, and report are frontend demo features. Assessment fixtures and reference documents are fictional and simulated. They are not researched rules or legal advice. `/checks/new` accepts PDF/PNG/JPEG artwork and references (20 MiB each) for local previews only. The sample shortcut opens the existing simulated review; arbitrary uploads never inherit its findings. The landing page embeds the same viewer and finding selection. The separate Dancing Fish scenario uses the organizer’s actual proof and draft workbook.

Reset the local demo using **Reset demo** in the sidebar or mobile navigation. Decisions are stored in localStorage. Product draft and small uploaded-file metadata are stored in sessionStorage (up to 20 previews); file contents are never persisted or sent to a server. Re-select files after reload. Blocked/corrupt storage falls back to usable in-memory state.

```sh
pnpm -C frontend typecheck
pnpm -C frontend lint
pnpm -C frontend test:unit
pnpm -C frontend build
pnpm -C frontend exec playwright install chromium
pnpm -C frontend test:e2e
```

For browser tests against a production build, set `PLAYWRIGHT_PRODUCTION=1` before `test:e2e`. Production server: `pnpm -C frontend start`. Stop the dev server before building/running production. To use installed Chrome for browser checks, set `PLAYWRIGHT_CHANNEL=chrome`.

See `../PROGRESS.md` for actual command results, screenshots, and remaining limitations.

## Complete seeded journey

From **New check**, choose **Start with sample files**, select MORI V1, corrected V2, or the organizer’s Dancing Fish carton, then **Run simulated check**. Prepared sample inputs produce predetermined findings after a short labeled simulation. A new run ID and matching findings are saved for the browser session; reload preserves decisions and the selected sample run. Arbitrary uploads remain previews and never inherit sample results.

**Reset demo → Reset workspace** restores the six baseline examples, clearing started sample runs, decisions, upload metadata and draft product name. It returns to the dashboard.

Research provenance and expected results are in `../reference-data/`. The organizer’s original PDF/workbook are bundled locally; CAA references remain externally linked with authored source notes. Direct CAA downloads were unavailable. English legal interpretations are unreviewed and sample findings are not legal approval.

See [the recording script and capability list](../docs/submission/DEMO.md). M7–M10 backend work is intentionally not started.
