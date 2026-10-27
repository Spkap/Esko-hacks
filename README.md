<p align="center">
  <img src="frontend/src/app/icon.svg" alt="Wavelength" width="64" height="64">
</p>

<h1 align="center">Wavelength</h1>

<p align="center"><strong>Clarity before the shelf.</strong></p>

<p align="center">
  Review packaging before it reaches the shelf.<br>
  Artwork, reference evidence, and reviewer decisions—connected in one workspace.
</p>

<p align="center">
  <a href="https://youtu.be/-TE1nZH6VSI"><strong>Watch the Video Demo</strong></a>
</p>

## Why we built it

A finished design still has to agree with the product specification, the intended market, and the brand's requirements. A missing statement or an unsupported claim can be easy to overlook when the evidence lives in another document.

Wavelength gives packaging designers, brand teams, and quality reviewers a shared review desk: the artwork on one side, the finding and its evidence on the other. Each concern has a source and a next step; each report says what was actually reviewed.

| Review principle | How it appears in the product |
| :--- | :--- |
| **Evidence before a decision** | Observed/expected values, source excerpts, and reference locations beside the artwork. |
| **Uncertainty stays visible** | Distinct **Pass**, **Fail**, **Needs review**, and **Not checked** results. |
| **Corrections stay traceable** | Reviewer decisions preserve the original result; corrected artwork receives a separate review. |

## A review in practice

Imagine reviewing **MORI Strawberry** for Japan. You have a label, a product specification, and a company checklist. The prepared V1 sample presents three different outcomes:

| Finding | Result | What the reviewer learns |
| :--- | :--- | :--- |
| Juice statement missing from the supplied panels | **Fail** | The fictional company checklist requests a statement that is absent from the supplied artwork. |
| Declared net quantity matches the specification | **Pass** | The label's 250 mL agrees with the sample product specification. |
| Printed type size needs physical scale | **Needs review** | A digital preview cannot establish the actual printed dimensions. |

Select the missing-statement finding. The artwork stays beside the observed value, expected value, reference excerpt, source location, and suggested correction.

**Acknowledge it:** the reviewer decision is saved, and the failed result remains intact.

**Compare corrected V2:** the statement is present, and the selected text and quantity comparisons pass. Printed size, placement, and full market compliance remain unverified.

The distinction matters: resolving a review task and demonstrating that artwork satisfies a requirement are separate actions.

## Inside the workspace

### Every review, in one place

Search by product, filter by market or assessment, and open the relevant artwork version. Status summaries filter the review library itself.

### Artwork beside the evidence

Select a finding to connect its explanation with the relevant page and artwork region. Missing content is tied to the inspected panels. Follow the reference, inspect the suggested next step, and record a decision.

<details>
<summary><strong>Correction and organizer examples</strong></summary>

#### Corrected MORI V2

The corrected sample includes the missing statement. Selected text and quantity checks pass; physical size and placement remain unverified.

#### Dancing Fish on mobile

The organizer's carton proof is compared with its draft content sheet. Unconfirmed allergen wording and a vegan claim remain review questions.

</details>

## How the review works

```mermaid
flowchart LR
    A["Prepare artwork<br/>and references"] --> B["Select market<br/>and reference approval"]
    B --> C["Extract files and run<br/>selected live checks"]
    C --> D["Inspect artwork<br/>and linked evidence"]
    D --> E["Acknowledge, dismiss<br/>with a reason, or reopen"]
    D --> F["Upload corrections<br/>or revised specifications"]
    F --> C
    E --> G["Read the report<br/>and its exclusions"]
    D --> G

    classDef input fill:#eef4ff,stroke:#1159c2,color:#162138
    classDef review fill:#fff0f3,stroke:#b32642,color:#162138
    classDef output fill:#eaf6ef,stroke:#16644e,color:#162138
    class A,B input
    class C,D,E,F review
    class G output
```

The report identifies the artwork version, reference revisions, selected checks, reviewer decisions, and requirements outside the review. Acknowledging or dismissing a finding never changes its original assessment.

## Review capabilities

| Capability | What you can do |
| :--- | :--- |
| **Find the right review** | Search saved live reviews or six explicit demo examples, filter by market/result, and inspect artwork versions. |
| **Inspect artwork and evidence** | Navigate PDF pages, zoom/rotate, select findings and markers, and open linked references. |
| **Record a review decision** | Acknowledge, dismiss with a reason, or reopen a finding without changing its assessment. |
| **Recheck and hand off** | Run prepared scenarios, compare corrected V2, recover a run after reload, and read scoped reports. |
| **Explore your own files** | Preview PDF, PNG, or JPEG files up to 20 MiB each; uploaded files never inherit sample findings. |

**Live analysis:** private multipart uploads, native PDF text and local OCR, reference-cell provenance, exact quantity and required-statement comparisons, database-backed jobs, cancellation, corrected versions, specification revisions, analysis history, conditional policy text, and persisted reports. The prepared sample progress sequence remains simulated only in demo mode. Public accounts and evaluated AI interpretation are not implemented.

### Three runnable scenarios

| Scenario | Material | Review focus |
| :--- | :--- | :--- |
| **MORI Strawberry · V1** | Fictional beverage artwork and sample company documents | Missing statement, matching quantity, uncertain physical measurement. |
| **MORI Strawberry · corrected V2** | Separate corrected artwork | Selected text/quantity checks pass; broader checks remain outside scope. |
| **Dancing Fish Berry Crunch** | Organizer-supplied carton proof and draft/reconstructed workbook | Allergen advisory wording, vegan claim, and quantity comparison with draft-source uncertainty. |

Sample findings demonstrate the workflow. They do not establish legal approval. Source status and interpretation limits are documented in the reference-data notes.

## Run locally

**Requirements:** Node.js 22.17+ and pnpm 11.25.0.

From the repository root:

```sh
pnpm -C frontend install --frozen-lockfile
pnpm -C frontend dev
```

Open `127.0.0.1:3000` for the landing page or `127.0.0.1:3000/dashboard` for the review workspace.

### Enable actual local analysis

The backend requires Python 3.11+, uv, PostgreSQL, and Tesseract with the OCR languages needed by your artwork. Windows supports local processing with subprocess timeouts; Unix systems also apply CPU/address-space resource limits.

Create a PostgreSQL database named `wavelength`. Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Purpose |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string in the form `postgresql+psycopg://USER:PASSWORD@127.0.0.1:5432/wavelength`. |
| `WAVELENGTH_STORAGE_DIR` | Private directory for uploaded artwork and reference files. |
| `WAVELENGTH_JWT_SECRET` | Random signing secret; generate with `openssl rand -hex 32`. |
| `WAVELENGTH_JWT_ISSUER` | Token issuer, such as `wavelength-local`. |
| `WAVELENGTH_JWT_AUDIENCE` | API audience, such as `wavelength-api`. |
| `WAVELENGTH_AI_ENABLED` | Keep `false` for local deterministic analysis without a model provider. |

Keep credentials in ignored environment files. Install the locked backend dependencies:

```sh
cd backend
uv sync --frozen
cd ..
```

Then start the complete local stack from the repository root:

```sh
python3 scripts/run-local.py --production
```

The launcher applies migrations, refreshes server-only credentials, builds the frontend, and starts API, worker, and UI. `--check` verifies prerequisites; omitting `--production` uses development mode. Open `127.0.0.1:3000/checks/new`.

Upload real artwork and a specification, declare the source's approval status, and run checks. Use `reference-data/live-specification-example.json` for unambiguous product values and required statements. Exact labeled spreadsheet quantity rows also retain their sheet/cell source locations. Draft, conflicting, or unreadable evidence stays uncertain.

This bridge intentionally accepts loopback hosts only; it is a local single-reviewer workspace, not public multitenant authentication. The worker supports optional bounded AI explanations; they remain disabled until free credits or a paid limit are confirmed. The full local workflow works without a provider.

### Try the complete demo

Watch the video walkthrough on YouTube: [https://youtu.be/-TE1nZH6VSI](https://youtu.be/-TE1nZH6VSI)

1. Open **New check → Start with sample files**.
2. Choose **MORI Strawberry** and select **Run simulated check**.
3. Inspect the missing-statement finding, follow its evidence, and acknowledge it.
4. Select **Compare the corrected sample** and run the V2 scenario.
5. Open **View report** to inspect results and exclusions.
6. Try **Dancing Fish Berry Crunch** to review the organizer's supplied material.
7. Use **Reset demo → Reset workspace** to start again.

For a production build:

```sh
pnpm -C frontend build
pnpm -C frontend start
```

Stop the development server before building. After pulling dependency changes, restart development; the `predev` script syncs packages from the committed lockfile.

## How it is built

The screens use one repository interface with separate demo and live implementations. Live mode uses a loopback-only, single-reviewer Next.js bridge; its bearer token remains on the server.

```mermaid
flowchart TD
    UI["Next.js / React review workspace"] --> R["Review repository interface"]
    R --> D["Demo: bundled samples and browser storage"]
    R --> H["Live HTTP repository"]
    H --> B["Loopback-only Next.js server bridge<br/>Server-held bearer token"]
    B --> API["FastAPI API<br/>JWT validation and upload validation"]
    API --> DB[("PostgreSQL<br/>Reviews, revisions, jobs, reports and decisions")]
    API --> F[("Private file storage<br/>Immutable revisions and SHA-256 hashes")]
    W["Background worker<br/>Renewable job leases and cancellation"] -->|Claim queued jobs| DB
    W -->|Read uploaded files| F
    W --> E["Bounded extraction processes<br/>PDF text, Tesseract OCR, JSON and XLSX"]
    E --> C["Deterministic rule engine<br/>Quantity, required statements and policy conditions"]
    C --> W
    W -.-> AI["Optional AI explanations<br/>Disabled by default; no assessment changes"]
    W -->|Commit findings and immutable reports| DB
```

**Backend:** FastAPI and Pydantic serve the API; SQLAlchemy, psycopg, and Alembic handle PostgreSQL persistence and migrations. PDF extraction uses pypdf and pypdfium2, image processing uses Pillow and Tesseract, and spreadsheet references use openpyxl.

### Backend processing and evidence

1. **Upload and version inputs.** Artwork accepts PDF, PNG, or JPEG files up to 20 MiB; references accept JSON, XLSX, or PDF. Private files receive immutable revision IDs and SHA-256 hashes.
2. **Queue a review.** Each run captures the selected artwork, reference revisions, and rule-set version. PostgreSQL row locks let workers claim jobs without a separate queue service.
3. **Extract and compare.** Separate processes read native PDF text or local OCR and preserve reference excerpts, page locations, and spreadsheet cells. Supported rules compare declared quantity, required statements, and explicit supplied policy conditions.
4. **Preserve uncertainty.** Draft, conflicting, unreadable, or incomplete evidence requires review. Physical type size, placement, visual symbolism, and full regulatory verification remain manual.
5. **Save a traceable report.** Results commit atomically while the worker owns its lease. Corrected artwork and revised specifications create new run snapshots; earlier reports remain unchanged. Reviewer decisions append audit records without changing the original assessment.

Jobs use renewable 60-second leases, at most three attempts, and a five-minute total budget. Cancellation and lease ownership are checked during processing. Validation and extraction have timeouts, with CPU limits and a Linux memory cap for parser processes.

Optional AI enrichment explains existing comparisons using cited excerpts. It cannot change rule outcomes, and invalid citations or provider failures do not replace deterministic results. Local extraction and checks work with AI disabled.

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Phosphor icons, and local Manrope/Noto Sans JP fonts. **Data validation:** Zod. **Checks:** Vitest and Playwright.

In demo mode, uploads remain browser-local previews and require re-selection after reload. In live mode, actual bytes are stored privately by the backend and bound to immutable file revisions. Service failures never substitute sample answers. The repository default is `NEXT_PUBLIC_DATA_MODE=demo`; configure the backend and server-only token to enable live mode.

<details>
<summary><strong>Development checks and repository map</strong></summary>

```sh
pnpm -C frontend exec tsx scripts/validate-sources.ts
pnpm -C frontend exec tsx scripts/validate-demo.ts
pnpm -C frontend typecheck
pnpm -C frontend lint
pnpm -C frontend test:unit
pnpm -C frontend exec playwright install chromium
pnpm -C frontend test:e2e
```

For browser checks against a production build, use `PLAYWRIGHT_PRODUCTION=1`; use `PLAYWRIGHT_CHANNEL=chrome` to select an installed Chrome browser. See the frontend README for environment and storage details.

| Path | Purpose |
| :--- | :--- |
| `frontend/src/app/` | Landing, dashboard, setup, artwork review, and report routes. |
| `frontend/src/components/` | Shared interface, document viewer, findings, and evidence panels. |
| `frontend/src/data/` | Repository interface selection and sample implementation. |
| `frontend/src/demo/` | Scenario definitions, fixtures, and asset hashes. |
| `frontend/public/demo/` | Bundled artwork and reference documents. |
| `reference-data/` | Source provenance, rule assumptions, and expected sample results. |
| `frontend/tests/` | Unit and browser checks. |
| `backend/app/` | API, authentication, private storage, extraction, rule engine, and worker. |
| `backend/migrations/` | Database migrations. |
| `backend/tests/` | Backend unit, integration, and evaluation checks. |

</details>

---

<p align="center"><strong>Connect the artwork. Inspect the evidence. Make the next decision clear.</strong></p>
