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
  <a href="https://youtu.be/ASl5XMgqJk4"><strong>Watch the demo ↗</strong></a> ·
  <a href="#a-review-in-practice">Follow a review</a> ·
  <a href="#run-locally">Run locally</a> ·
  <a href="#what-works-today">Explore the scope</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-111827?logo=nextdotjs&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-111827?logo=react&logoColor=61DAFB" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-111827?logo=typescript&logoColor=3178C6" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Status-Hackathon_prototype-B32642" alt="Hackathon prototype">
</p>

## Watch it in action

[![Watch the Wavelength demo: packaging artwork, evidence, and the path to a corrected review](frontend/evidence/halo-first-viewport-1440.png)](https://youtu.be/ASl5XMgqJk4)

**[Watch the 2:17 demo on YouTube →](https://youtu.be/ASl5XMgqJk4)**

See the complete path from a missing statement to corrected artwork, then inspect the organizer's actual carton proof.

| Jump to | What you will see |
| :--- | :--- |
| [0:24 · Prepare a review](https://youtu.be/ASl5XMgqJk4?t=24) | Artwork, market, specification, and reference files. |
| [0:47 · Inspect the evidence](https://youtu.be/ASl5XMgqJk4?t=47) | A finding connected to the artwork, its source, and a correction. |
| [1:25 · Compare corrected V2](https://youtu.be/ASl5XMgqJk4?t=85) | The missing statement is added; selected checks pass. |
| [1:39 · Read the report](https://youtu.be/ASl5XMgqJk4?t=99) | Results, version context, and requirements outside scope. |
| [1:54 · Review organizer material](https://youtu.be/ASl5XMgqJk4?t=114) | Dancing Fish carton proof and draft-source review questions. |

> **Two explicit modes:** the video shows the seeded demo. The new local **live** mode reads actual PDF/PNG/JPEG artwork and JSON/XLSX/PDF references, runs supported deterministic checks, and saves versioned results in PostgreSQL. Optional AI explanations are integrated but disabled in the zero-cost configuration; qualified regulatory verification remains manual. Demo mode still needs no backend or key.

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

![Wavelength dashboard with review totals, search, filters, and artwork versions](frontend/evidence/phosphor-dashboard-1440.png)

### Artwork beside the evidence

Select a finding to connect its explanation with the relevant page and artwork region. Missing content is tied to the inspected panels. Follow the reference, inspect the suggested next step, and record a decision.

![Wavelength artwork review with selected findings and reference evidence](frontend/evidence/phosphor-review-1440.png)

<details>
<summary><strong>See the corrected artwork and mobile organizer review</strong></summary>

#### Corrected MORI V2

![Corrected MORI artwork with selected checks passed and the added statement highlighted](frontend/evidence/m5-corrected-review-1440.png)

#### Dancing Fish on mobile

The organizer's carton proof is compared with its draft content sheet. Unconfirmed allergen wording and a vegan claim remain review questions.

<img src="frontend/evidence/m5-organizer-review-390.png" alt="Mobile review of the organizer's Dancing Fish carton with evidence-linked review questions" width="390">

</details>

## How the review works

```mermaid
flowchart LR
    A["Prepare artwork<br/>and references"] --> B["Choose a sample<br/>and target market"]
    B --> C["Run the labeled<br/>sample simulation"]
    C --> D["Inspect artwork<br/>and linked evidence"]
    D --> E["Acknowledge, dismiss<br/>with a reason, or reopen"]
    D --> F["Compare corrected<br/>artwork V2"]
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

## What works today

| Interactive today | What you can do |
| :--- | :--- |
| **Find the right review** | Search six baseline examples, filter by market/result, and inspect artwork versions. |
| **Inspect artwork and evidence** | Navigate PDF pages, zoom/rotate, select findings and markers, and open linked references. |
| **Record a review decision** | Acknowledge, dismiss with a reason, or reopen a finding without changing its assessment. |
| **Recheck and hand off** | Run prepared scenarios, compare corrected V2, recover a run after reload, and read scoped reports. |
| **Explore your own files** | Preview PDF, PNG, or JPEG files up to 20 MiB each; uploaded files never inherit sample findings. |

**Live mode now available:** private multipart uploads, native PDF text and local OCR, reference-cell provenance, exact quantity and required-statement comparisons, database-backed jobs, cancellation, corrected versions, specification revisions, analysis history, conditional policy text, and persisted reports. The prepared sample progress sequence remains simulated only in demo mode. Public accounts and evaluated AI interpretation are not implemented.

### Three runnable scenarios

| Scenario | Material | Review focus |
| :--- | :--- | :--- |
| **MORI Strawberry · V1** | Fictional beverage artwork and sample company documents | Missing statement, matching quantity, uncertain physical measurement. |
| **MORI Strawberry · corrected V2** | Separate corrected artwork | Selected text/quantity checks pass; broader checks remain outside scope. |
| **Dancing Fish Berry Crunch** | Organizer-supplied carton proof and draft/reconstructed workbook | Allergen advisory wording, vegan claim, and quantity comparison with draft-source uncertainty. |

Sample findings demonstrate the workflow. They do not establish legal approval. Source status and interpretation limits are documented in the [reference-data notes](reference-data/README.md).

## Run locally

**Requirements:** Node.js 22.17+ and pnpm 11.25.0.

From the repository root:

```sh
pnpm -C frontend install --frozen-lockfile
pnpm -C frontend dev
```

Open [the landing page](http://127.0.0.1:3000) or [the review workspace](http://127.0.0.1:3000/dashboard).

### Enable actual local analysis

Follow the [backend setup](backend/README.md) to configure PostgreSQL and `backend/.env` once. Then start the complete local stack from this repository root:

```sh
python3 scripts/run-local.py --production
```

The launcher applies migrations, refreshes server-only credentials, builds the frontend, and starts API, worker, and UI. `--check` verifies prerequisites; omitting `--production` uses development mode. Open http://127.0.0.1:3000/checks/new.

Upload real artwork and a specification, declare the source's approval status, and run checks. Use the [structured specification example](reference-data/live-specification-example.json) for unambiguous product values and required statements. Exact labeled spreadsheet quantity rows also retain their sheet/cell source locations. Draft, conflicting, or unreadable evidence stays uncertain.

This bridge intentionally accepts loopback hosts only; it is a local single-reviewer workspace, not public multitenant authentication. The worker supports optional bounded AI explanations; they remain disabled until free credits or a paid limit are confirmed. The full local workflow works without a provider.

### Try the complete demo

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
    UI["Next.js review interface"] --> R["Review repository interface"]
    R --> D["Demo: bundled examples + browser storage"]
    R --> H["Live: validated HTTP repository"]
    H --> B["Loopback-only server bridge"]
    B --> API["JWT-authenticated FastAPI"]
    API --> DB["PostgreSQL: versions, jobs, decisions"]
    API --> F["Private uploaded files + SHA-256"]
    DB --> W["Leased worker + bounded parser processes"]
    W --> E["Native text / OCR / JSON / XLSX"]
    E --> C["Deterministic supported comparisons"]
    C --> DB
```

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

For browser checks against a production build, use `PLAYWRIGHT_PRODUCTION=1`; use `PLAYWRIGHT_CHANNEL=chrome` to select an installed Chrome browser. See the [frontend README](frontend/README.md) for environment and storage details.

| Path | Purpose |
| :--- | :--- |
| [`frontend/src/app/`](frontend/src/app/) | Landing, dashboard, setup, artwork review, and report routes. |
| [`frontend/src/components/`](frontend/src/components/) | Shared interface, document viewer, findings, and evidence panels. |
| [`frontend/src/data/`](frontend/src/data/) | Repository interface selection and sample implementation. |
| [`frontend/src/demo/`](frontend/src/demo/) | Scenario definitions, fixtures, and asset hashes. |
| [`frontend/public/demo/`](frontend/public/demo/) | Bundled artwork and reference documents. |
| [`reference-data/`](reference-data/) | Source provenance, rule assumptions, and expected sample results. |
| [`frontend/tests/`](frontend/tests/) | Unit and browser checks. |
| [`demo-output/`](demo-output/) | Editable video script, capture workflow, and rendering pipeline. |

</details>

## What comes next

The product vision is AI-assisted packaging review across market requirements, product accuracy, and brand guidelines. The live path now connects the review experience to extraction and traceable comparisons. The next step is to broaden supported interpretation without hiding uncertainty.

| Current boundary | Next step |
| :--- | :--- |
| Deterministic supported checks | Evaluate an optional AI interpretation provider against labeled examples before enabling it. |
| Explicit supplied-reference comparisons | Expand qualified, versioned regulatory sources and product applicability. |
| Local single-reviewer API bridge | Integrate real browser sessions and user management before public deployment. |
| Digital previews with uncertain physical scale | Establish trustworthy dimensions before evaluating printed-size requirements. |

The review should always show when a source is draft, a requirement is uncertain, or a check was left out.

---

<p align="center"><strong>Connect the artwork. Inspect the evidence. Make the next decision clear.</strong></p>
<p align="center"><a href="https://youtu.be/ASl5XMgqJk4">Watch the demo</a> · <a href="#run-locally">Try the samples</a> · <a href="reference-data/README.md">Read the source notes</a></p>
