# Wavelength · Frontend

The interactive packaging-review prototype: dashboard, artwork viewer, evidence panels, reviewer decisions, prepared sample runs, and reports.

[Product overview](../README.md) · [Watch the demo](https://youtu.be/ASl5XMgqJk4) · [Sample provenance](../reference-data/README.md)

## Start development

**Requirements:** Node.js 22.17+ and pnpm 11.25.0. Commands below run from the repository root.

```sh
pnpm -C frontend install --frozen-lockfile
pnpm -C frontend dev
```

| Route | Screen |
| :--- | :--- |
| `http://127.0.0.1:3000` | Product landing page and interactive preview. |
| `http://127.0.0.1:3000/dashboard` | Review library, search, and filters. |
| `http://127.0.0.1:3000/checks/new` | Own-file previews or prepared sample setup. |
| `http://127.0.0.1:3000/checks/mori-strawberry` | Existing MORI V1 artwork review. |

The `predev` script syncs dependencies from the lockfile and prepares the PDF.js worker. After pulling dependency changes, stop the running development server and restart it.

## Configuration

Demo mode is the default. To set it explicitly, copy `frontend/.env.example` to `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_DATA_MODE=demo
```

| Mode | Behavior |
| :--- | :--- |
| `demo` | Bundled sample data and interactive local review actions. No account or AI key required. |
| `live` | Actual uploads, analysis jobs, private file viewing, and reviewer decisions through the local backend. |

## Exercise the main flow

1. Choose **New check → Start with sample files**.
2. Select MORI V1, corrected V2, or Dancing Fish, then **Run simulated check**.
3. Inspect a finding, read its reference, and record a reviewer decision.
4. From MORI V1, choose **Compare the corrected sample** to prepare V2.
5. Open **View report** for findings, decisions, and scope exclusions.
6. Select **Reset demo → Reset workspace** to return to the six baseline examples.

Sample runs use predetermined findings after a labeled simulation. A new run ID and its results remain available for the browser session. Acknowledging or dismissing a finding preserves its original result.

In demo mode, own-file inputs accept PDF, PNG, and JPEG files up to 20 MiB each for local previews and never inherit prepared findings. In live mode, artwork uses these formats and references use JSON/XLSX/PDF; local native-text/OCR extraction and supported deterministic checks operate on the actual files. AI interpretation and qualified regulatory verification are not enabled.

## Demo browser storage and reset

| Data | Storage | Lifetime |
| :--- | :--- | :--- |
| Reviewer decisions | `localStorage` | Across reloads and browser sessions, until cleared/reset. |
| Started sample runs | `sessionStorage` | Current browser tab session; reload recovery supported. |
| Product draft and small upload metadata | `sessionStorage` | Current session, with up to 20 upload previews. |
| Uploaded file contents | In-memory browser objects | Re-select after reload; never sent to a server. |

Blocked or corrupt storage falls back to usable in-memory state. **Reset workspace** clears started runs, decisions, upload metadata, and draft product name; immutable sample fixtures remain.

## Production preview

Stop the development server first, then run:

```sh
pnpm -C frontend build
pnpm -C frontend start
```

## Development checks

```sh
pnpm -C frontend exec tsx scripts/validate-sources.ts
pnpm -C frontend exec tsx scripts/validate-demo.ts
pnpm -C frontend typecheck
pnpm -C frontend lint
pnpm -C frontend test:unit
```

Install a Playwright browser once, then run browser checks:

```sh
pnpm -C frontend exec playwright install chromium
pnpm -C frontend test:e2e
```

To check the production build using installed Chrome:

```sh
pnpm -C frontend build
PLAYWRIGHT_PRODUCTION=1 PLAYWRIGHT_CHANNEL=chrome pnpm -C frontend test:e2e
```

Playwright starts the selected server automatically or reuses an existing one. Stop an existing development server before the production check so it cannot be reused accidentally.

## Source material and boundaries

MORI is fictional packaging compared with sample company documents. Dancing Fish uses the organizer's carton proof and draft/reconstructed workbook; uncertain allergen wording and vegan claims remain review questions. The older Fieldwork fixture is a separate fictional multipage example.

Source records, artifact hashes, rule assumptions, and expected results are in [`reference-data/`](../reference-data/). Original organizer files are bundled under [`public/demo/`](public/demo/). Japan CAA references are externally linked with authored source notes; original CAA downloads were unavailable and English interpretations are unreviewed.

A sample pass covers only its selected checks. It does not establish full market compliance or legal approval.

Local planning and progress notes may exist under the Git-ignored `docs/` folder. They are optional and are not required to install or run the frontend.

## Local live analysis

Start the backend and worker using [backend setup](../backend/README.md), then set `NEXT_PUBLIC_DATA_MODE=live`, `WAVELENGTH_API_URL=http://127.0.0.1:8000`, and `WAVELENGTH_API_TOKEN` in `frontend/.env.local`. Restart Next.js after changing the mode. The token is server-only; never prefix it with `NEXT_PUBLIC_`. The same-origin, loopback-only `/api/backend` proxy attaches it to requests and private document links; non-loopback Host headers are rejected.

This is a trusted, single-reviewer local workspace. It does not provide browser login or public multitenant authentication; do not expose this token-backed proxy publicly.

Choose **New check**, upload a PDF/PNG/JPEG artwork and JSON/XLSX/PDF product specification, explicitly declare approval status, and start checks. Japan fruit beverage and United States breakfast cereal scopes are supported. Optional company/regulatory references accept JSON/XLSX/PDF. Files are limited to 20 MiB. The backend checks actual bytes and rejects unsupported content. Status polling stops after five minutes or on navigation; retry status or reopen the review to resume. Cancellation remains incomplete. Service failures never substitute sample answers. Corrected artwork can be uploaded from the review using the same reference revisions.

Switch back to `NEXT_PUBLIC_DATA_MODE=demo` and restart to restore sample workflows. Demo reset is absent in live mode and does not delete backend reviews. The landing page remains an explicit illustrative demo.

Run the real-stack browser check with `NEXT_PUBLIC_DATA_MODE=live PLAYWRIGHT_CHANNEL=chrome pnpm -C frontend exec playwright test tests/e2e/live.spec.ts` after starting the live stack. For a cross-language response contract check, first run the backend acceptance exercise, then `WAVELENGTH_CONTRACT_FIXTURE=/tmp/wavelength-live-contracts.json pnpm -C frontend test:contracts`. These use actual backend output, not the demo repository.
