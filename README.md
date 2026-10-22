<p align="center">
  <img src="frontend/src/app/icon.svg" alt="Wavelength" width="64" height="64">
</p>

<h1 align="center">Wavelength</h1>

<p align="center"><strong>Clarity before the shelf.</strong></p>

<p align="center">
  Bring packaging artwork, requirements, and evidence into one review workspace.<br>
  Find the detail. Understand the source. Make the next decision clear.
</p>

<p align="center">
  <a href="https://youtu.be/ASl5XMgqJk4"><strong>Watch the demo ↗</strong></a> ·
  <a href="#a-review-in-practice">See the workflow</a> ·
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

Follow a review from prepared artwork to a flagged finding, reference evidence, a reviewer decision, corrected artwork, and a report. The walkthrough also includes the organizer's Dancing Fish carton.

> **Prototype scope:** the review interface is interactive; sample assessments are predetermined. Live OCR, AI inference, and regulatory verification are future work. No account, backend, or AI key is required to try the samples.

## Why we built it

A packaging design can look finished while important questions remain unanswered.

Does the label match the product sheet? Is a required statement present? Is the claim supported by an approved reference? Can anyone establish the printed size from this file?

Those questions span artwork, specifications, market requirements, and company guidelines. Each finding needs someone to locate the relevant panel, find the supporting document, explain the discrepancy, and carry the correction into the next version.

Wavelength brings those steps together. Packaging designers, brand teams, and quality reviewers can work from the same artwork and see the evidence behind each concern.

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

| Capability | Current behavior |
| :--- | :--- |
| **Review library** | Search, market/result filters, assessment counts, and artwork-version navigation. |
| **Artwork inspection** | Image/PDF preview, page navigation, zoom, rotation, and finding-linked markers. |
| **Evidence inspection** | Observed/expected values, reference excerpts, source links, and suggested next steps. |
| **Reviewer decisions** | Acknowledge, dismiss with a required reason, or reopen; original results remain unchanged. |
| **Sample runs** | Prepared inputs, labeled simulated progress, cancellation, distinct run IDs, and session reload recovery. |
| **Version comparison** | Separate MORI V1 and corrected V2 reviews with explicit passing scope. |
| **Review reports** | Findings, sources, decisions, version context, and unchecked requirements. |
| **Own-file previews** | PDF, PNG, and JPEG inputs up to 20 MiB per file; arbitrary uploads do not receive sample findings. |
| **Reset** | Restore the six baseline examples and clear local demo activity. |

### Three runnable scenarios

| Scenario | Material | Review focus |
| :--- | :--- | :--- |
| **MORI Strawberry · V1** | Fictional beverage artwork and sample company documents | Missing statement, matching quantity, uncertain physical measurement. |
| **MORI Strawberry · corrected V2** | Separate corrected artwork | Selected text/quantity checks pass; broader checks remain outside scope. |
| **Dancing Fish Berry Crunch** | Organizer-supplied carton proof and draft/reconstructed workbook | Allergen advisory wording, vegan claim, and quantity comparison with draft-source uncertainty. |

Sample findings demonstrate the workflow. They do not establish legal approval. Source status and interpretation limits are documented in the [reference-data notes](reference-data/README.md).

## How it is built

The screens use a shared repository interface. The current implementation reads bundled sample records and stores demo activity in the browser.

```mermaid
flowchart TD
    UI["Next.js + React interface<br/>Dashboard · Viewer · Evidence · Reports"]
    UI --> R["Shared review repository"]
    R --> S["Bundled sample scenarios<br/>Artwork · Specifications · Findings"]
    R --> L["localStorage<br/>Reviewer decisions"]
    R --> T["sessionStorage<br/>Sample runs · Drafts · Upload metadata"]
    UI --> P["PDF.js<br/>Browser PDF rendering"]
```

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Phosphor icons, and local Manrope/Noto Sans JP fonts. **Data validation:** Zod. **Checks:** Vitest and Playwright.

Your uploaded file contents are not persisted or uploaded to a server. Re-select your own files after a reload. The default `NEXT_PUBLIC_DATA_MODE=demo` uses the sample workspace; `live` displays an explicit connection error because a live backend is not connected.

## Run locally

**Requirements:** Node.js 22.17+ and pnpm 11.25.0.

From the repository root:

```sh
pnpm -C frontend install --frozen-lockfile
pnpm -C frontend dev
```

Open [the landing page](http://127.0.0.1:3000) or [the review workspace](http://127.0.0.1:3000/dashboard).

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

## Where we go next

The product vision is AI-assisted packaging review across market requirements, product accuracy, and brand guidelines. The next step is to connect the working review experience to dependable extraction and traceable checks.

| Current boundary | Next step |
| :--- | :--- |
| Prepared sample assessments | Extract inspectable text and structure from real artwork and specifications. |
| Bundled references and limited sample comparisons | Evaluate a small supported rule set against versioned, traceable sources. |
| Local browser activity | Add a backend for files, review versions, jobs, and persisted decisions. |
| Digital previews with uncertain physical scale | Establish trustworthy dimensions before evaluating printed-size requirements. |

The review should always show when a source is draft, a requirement is uncertain, or a check was left out.

---

<p align="center"><strong>Connect the artwork. Inspect the evidence. Make the next decision clear.</strong></p>
<p align="center"><a href="https://youtu.be/ASl5XMgqJk4">Watch the demo</a> · <a href="#run-locally">Try the samples</a> · <a href="reference-data/README.md">Read the source notes</a></p>
