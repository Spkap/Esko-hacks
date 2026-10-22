# Veriforge frontend — M1–M2

Requirements: Node.js 22.17+ and pnpm 11.25.0.

```sh
pnpm -C frontend install --frozen-lockfile
pnpm -C frontend dev
```

Open http://127.0.0.1:3000/dashboard. `/` redirects to the dashboard. The default data mode is `demo`; copy `.env.example` to `.env.local` to configure it explicitly. `live` displays a connection error because backend integration is outside M2.

The dashboard, artwork viewer, selected evidence, reviewer decisions, and report are frontend demo features. Assessment fixtures and reference documents are fictional and simulated. They are not researched rules or legal advice. Upload/new-check creation is M3; landing is M4; researched seed data is M5.

Reset acknowledgements/dismissals using **Reset demo decisions** in the sidebar or mobile navigation. Only decisions are stored in localStorage. Blocked/corrupt storage falls back to usable in-memory state.

```sh
pnpm -C frontend typecheck
pnpm -C frontend lint
pnpm -C frontend test:unit
pnpm -C frontend build
pnpm -C frontend exec playwright install chromium
pnpm -C frontend test:e2e
```

For browser tests against a production build, set `PLAYWRIGHT_PRODUCTION=1` before `test:e2e`. Production server: `pnpm -C frontend start`.

See `../PROGRESS.md` for actual command results, screenshots, and remaining limitations.
