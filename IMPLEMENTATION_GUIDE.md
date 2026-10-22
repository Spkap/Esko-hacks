# Veriforge Implementation Plan

> **For implementation agents:** Use `superpowers:executing-plans` to work task by task. Use `superpowers:subagent-driven-development` when parallel execution is requested. Track completion with the checkboxes below.

**Goal:** Let users upload packaging, choose a market, and see issues with evidence and suggested corrections.

**Architecture:** Build the frontend with local sample data. Put data access behind one shared interface so a backend can replace the samples without rewriting screens. Build that backend only after the frontend demo is ready.

**Tech stack:** Next.js, TypeScript, Tailwind CSS v4, shadcn/ui, Watermelon UI landing blocks, Zod, PDF.js, Vitest, Playwright. Backend: Python, FastAPI, PostgreSQL.

**Product description:** [idea.md](idea.md). Keep it unchanged. Application code has not been started.

## Build order

| Phase | Deliverable | Finished when |
|---|---|---|
| M1 | Dashboard | Users can search, filter, and open sample reviews. |
| M2 | Artwork review screen | Selecting an issue connects artwork, source, and correction. |
| M3 | Upload and market form | Users can preview files and start the supported sample. |
| M4 | Landing page | Visitors understand the product and enter the sample workflow. |
| M5 | Researched sample data | All screens use consistent artwork, specifications, rules, and results. |
| M6 | Frontend submission package | The demo passes browser checks and is ready to record. **Stop here if time is short.** |
| M7 | Separate backend | It stores files, reviews, and analysis jobs. |
| M8 | File reading | Real PDFs/images and product sheets produce inspectable extracted data. |
| M9 | Compliance checks | Actual extracted data produces results against a small supported rule set. |
| M10 | Live integration | The existing screens display real backend results and pass integration tests. |

M2, M3, and M4 depend on M1. They can be built separately once shared types and navigation are fixed. M5 follows all three. M6 precedes backend work; M7–M10 run in order.

Each phase must leave the app working. Frontend phases require no backend, database, account, or AI key. Use a few temporary sample records in M1–M4; replace them with researched samples in M5.

## Files and responsibilities

Create files as their phase starts. Paths below are planned, not existing application files.

| Path | Responsibility |
|---|---|
| `frontend/src/app/dashboard/page.tsx` | Review list, search, filters, counts. |
| `frontend/src/app/checks/[reviewId]/page.tsx` | Artwork and findings. |
| `frontend/src/app/checks/[reviewId]/report/page.tsx` | Summary of selected checks. |
| `frontend/src/app/checks/new/page.tsx` | Files, product details, market selection. |
| `frontend/src/app/page.tsx` | Landing page. |
| `frontend/src/domain/types.ts` | Shared data types and Zod validation. |
| `frontend/src/domain/summary.ts` | Result counts and overall status. |
| `frontend/src/data/repository.ts` | Shared data interface and mode selection. |
| `frontend/src/data/demo-repository.ts` | Sample records and simulated actions. |
| `frontend/src/data/http-repository.ts` | Backend requests, introduced in M10. |
| `frontend/src/components/` | Shared navigation, viewer, finding list, source panel, forms. |
| `frontend/src/components/landing/` | Adapted Watermelon hero/footer and the interactive sample preview. |
| `frontend/src/demo/` and `frontend/public/demo/` | Sample records and public sample files. |
| `frontend/tests/` | Unit, component, and browser tests. |
| `reference-data/` | Sources, rule definitions, expected sample results. |
| `DESIGN.md` | Colors, fonts, spacing, layouts selected in M1. |
| `PROGRESS.md` | Completed tasks, checks run, failures, next task. |

## Shared data rules

Screens call the shared data interface. Only its implementation knows whether the data comes from samples or the backend.

```text
Screen -> shared data interface -> sample data   [M1–M6]
                               -> backend       [M10]
```

Define these records in `frontend/src/domain/types.ts`:

| Record | Required information |
|---|---|
| Review | ID, product name, category, market, current artwork version, timestamps. |
| ArtworkVersion | ID, review ID, version number, file hash/type, page sizes/rotation. |
| ReferenceDocument | ID, review ID, revision, file hash, role, declared approval status, reading status. |
| Run | ID, review ID, artwork/reference/rule versions, selected checks, demo/live mode, job status. |
| CheckResult | ID, run ID, rule ID/version, applicability, result, observed/expected values, evidence, suggested correction. |
| ReviewDecision | Check ID, action, actor, reason, timestamp. |
| Report | Run ID, checks, reviewed scope, unchecked requirements, decisions. |

Use `regulatory_reference`, `company_policy`, and `product_specification` as distinct reference roles. Approval status is `draft`, `approved`, or `unknown`; uploaded documents retain their stated status.

**Applicability:** `applicable`, `not_applicable`, `uncertain`.
**Result:** `pass`, `fail`, `needs_review`, `not_checked`.
**Decision:** `open`, `acknowledged`, `dismissed`. Dismissal requires a reason.
**Job status:** `queued`, `extracting`, `checking`, `completed`, `failed`, `cancelled`.

Acknowledging or dismissing a finding does not turn a failed check into a pass. A corrected artwork creates a new version and a new run. Previous results keep their original files and rules.

### Data interface

Implement these operations in the sample implementation; add their backend equivalents in M10.

| Operation | Input → output |
|---|---|
| `listReviews` | Optional search, market, result, cursor, limit → review list and next cursor. |
| `getReview` | Review ID → review and its artwork/reference versions. |
| `createReview` | Product name, market, category → new review. |
| `addArtwork` | Review ID, file → new artwork version. |
| `addReference` | Review ID, file, role, declared approval status → new reference revision. |
| `startRun` | Review ID, artwork version, reference revisions, rule-set version, selected rule IDs, request key → run. |
| `getRun` / `cancelRun` | Run ID → current run. |
| `getReport` | Run ID → report. |
| `recordDecision` | Check ID, decision, reason → saved decision. |

The request key identifies one attempt to start analysis. Repeated clicks with the same key return that same run.

Select the implementation once with `NEXT_PUBLIC_DATA_MODE=demo|live`. Display “Demo data” in sample mode. A failed live request shows an error, never a sample report.

### Summary behavior

Apply these rules in order:

1. Running, failed, or cancelled job: show its execution state. Any partial results remain incomplete.
2. A failed check exists: **Issues found**.
3. Applicability is uncertain, or an applicable check needs review/was not checked: **Review incomplete**.
4. At least one applicable check exists and all applicable checks passed: **Selected checks passed**.
5. Otherwise: **No applicable checks**.

Count each result from the actual check records. Exclude not-applicable rules from pass totals. A limited review never means the package is legally approved.

## M1: Dashboard

**Build:** `/dashboard` with a review table as the main content. Columns: product, market, artwork version, result, updated time. Put search, market/status filters, and “New check” above it.

- [ ] Create the Next.js app in `frontend/` with Tailwind v4; initialize shadcn/ui and pin its CLI as a development dependency. Verify compatible stable versions and commit the lockfile. Use normal Next.js hosting so new review URLs work after refresh.
- [ ] Create the shared types, summary function, and sample implementation. Include reviews with issues, incomplete checks, and passed selected checks.
- [ ] Build the table and filters. Until M2 exists, opening a row shows its details in a drawer.
- [ ] Add `frontend/tests/unit/summary.test.ts` and `frontend/tests/e2e/dashboard.spec.ts` with the cases below.

**Verify:** Search finds the correct product; combined filters work; clearing filters restores rows; zero matches offers “Clear filters”; displayed counts agree with records. Summary tests cover every rule above, including a cancelled run containing partial passes.

**Checkpoint:** The frontend checks pass. The dashboard works after reload with no backend.

## M2: Artwork review

**Build:** Artwork on the left; findings and selected evidence on the right. One selected check controls both the artwork marker and the details.

- [ ] Create the review route, image viewer, finding list, and source panel. Each finding shows observed value, expected value, source location, and suggested correction.
- [ ] Add PDF.js with page, zoom, and fit controls. Load it only on the review screen.
- [ ] Create the report route and acknowledge/dismiss actions. Keep the original assessment unchanged.
- [ ] Add `frontend/tests/e2e/review.spec.ts` for marker/list selection, source access, decisions, and missing review IDs.

**Evidence positions:** Use 1-based page numbers and top-left `{x, y, width, height}` values between 0 and 1, tied to the artwork version and rendered page orientation. Convert them through the viewer’s zoom/rotation transform. Test zoom, resize, rotation, and high-density displays. For missing text, show inspected panels and use no marker.

**Checkpoint:** Clicking a finding opens the right page, region, and source. Passes, failures, uncertainty, and unchecked requirements remain distinguishable. Back navigation and direct reload work.

## M3: Upload and market selection

**Build:** `/checks/new` with visible labels for product name, category, target market, artwork, product specification, and optional company/regulatory references.

- [ ] Create the form with file previews and a “Use sample” shortcut. Enable only market/category pairs with a supported check set; label other options “Planned.”
- [ ] Reject unsupported file types and files over 20 MiB. Preserve entered values when validation fails.
- [ ] Connect creation and preview through the shared data interface. Store small metadata only; session file previews require re-selection after reload.
- [ ] Add `frontend/tests/e2e/new-check.spec.ts` for missing fields, invalid files, repeated submit, reset, and reload.

**Demo behavior:** The supplied sample can produce sample findings. Any other upload is preview-only and says live analysis is not connected. It must never inherit another file’s report.

**Checkpoint:** A keyboard user can complete the form. A repeated click creates one review/run. File replacement releases the previous preview URL.

## M4: Landing page

**Build:** Use selected Watermelon UI blocks for a product explanation that leads directly into the sample. Keep the dashboard and review screens on the existing shadcn/ui components.

- [ ] Preview the Watermelon imports below; adapt them in `frontend/src/components/landing/` without replacing shared dashboard components or global styles.
- [ ] Create the first screen: Veriforge, “Check your packaging before it reaches the shelf,” one explanatory sentence, “Try sample check,” and an artwork preview. Replace the block's stock background with our packaging example and apply `DESIGN.md` colors/fonts.
- [ ] Reuse the M2 selection behavior: clicking an issue highlights its artwork location and opens its evidence.
- [ ] Add the three-step workflow, supported demo scope, and footer links into the app. Remove the imported sign-in/social placeholders and newsletter form. Add page title/description.
- [ ] Add `frontend/tests/e2e/landing.spec.ts` for sample entry, interactive preview, mobile-menu keyboard controls, reduced motion, and direct reload without rendering errors.

**Checkpoint: UI complete.** All four screens are connected. Every visible action works or clearly explains its unavailable state. Begin researched seed data only after this checkpoint.

### Watermelon setup

**Decision:** Use it as editable component source, not a replacement framework. Its [installation guide](https://ui.watermelon.sh/installation) uses the shadcn installer; its [framework guide](https://ui.watermelon.sh/framework-support) lists React 18/19, Tailwind v4, and Next.js support. Keep Next.js and pnpm.

Inspected starting points:

| Source | Use | Changes needed |
|---|---|---|
| [hero-1](https://registry.watermelon.sh/r/hero-1.json) | Hero and navigation structure | Replace stock image/copy, connect real links, embed our artwork preview. Requires `motion` and `lucide-react`. |
| [footer-1](https://registry.watermelon.sh/r/footer-1.json) | Brand and footer links | Remove its non-submitting newsletter form and unused input dependency. |

From the repository root, inspect changes before installing with the pinned CLI:

```sh
pnpm -C frontend exec shadcn add https://registry.watermelon.sh/r/hero-1.json --dry-run
pnpm -C frontend exec shadcn add https://registry.watermelon.sh/r/footer-1.json --dry-run
```

Install each reviewed item by repeating its command without `--dry-run`. Preserve existing shared primitives; inspect file/dependency changes instead of forcing overwrites. Record source URLs and revisions/hashes in `frontend/THIRD_PARTY_NOTICES.md` and retain the [MIT notice](https://github.com/WatermelonCorp/watermellon-registry/blob/main/LICENSE).

Keep the page heading and links server-rendered; isolate animated and interactive sections with `"use client"`. Add browser-only loading only if a component actually needs it, inside a client wrapper. Support reduced motion and use local product assets. Watermelon's website/API is a build-time source, not a runtime dependency.

**Fallback:** If a block cannot be fetched or fails build/accessibility checks, use the same layout with existing shadcn/ui and Tailwind. Keep the working sample interaction and phase order; another component library is unnecessary. Registry reads succeeded during research, but some subsequent direct requests returned HTTP 403. Compatibility is documented; the build must still be verified during M4.

## M5: Realistic seed data and mock behavior

**Build:** Replace temporary records with saved sample files and fixed results that agree across every screen. “Seed data” means these saved examples; “mock behavior” means the code that returns them and simulates actions.

### Sample A: Fictional Japan strawberry drink

Use a fictional brand, 250 mL, Japan, 2% total juice, all strawberry, no pulp. Provide original sample artwork, a fictional approved product specification, and a fictional company rulebook.

| Example | Expected result |
|---|---|
| Complete V1 artwork with fruit imagery and no required disclosure | Selected disclosure check flags the missing statement. |
| V2 with supported disclosure and documented print dimensions/panels | Selected disclosure checks pass. |
| V2 raster image without physical scale | Text presence can pass; printed type size needs review. |
| Unknown composition/measurement basis | Applicability needs review. |
| Exactly 5% on the supported measurement basis | The strict `<5%` condition does not apply. |
| Front panel only | No claim that a statement is absent from the entire package. |
| Quantity differs from approved specification | Product-data mismatch, labeled separately from a regulatory issue. |

Use [CAA FAQ Q34–35](https://www.caa.go.jp/policies/policy/representation/fair_labeling/faq/representation/), the [underlying notice](https://www.caa.go.jp/policies/policy/representation/fair_labeling/public_notice/pdf/100121premiums_15.pdf), and the [implementation standard](https://www.caa.go.jp/policies/policy/representation/fair_labeling/guideline/pdf/100121premiums_29.pdf).

Record category, composition, measurement basis, fruit presentation, allowed disclosure forms, placement, and exceptions separately. Percentage text is not the only accepted low-juice disclosure. Preserve the original Japanese passage and mark an unreviewed English interpretation as such. Require a qualified review before authoritative live use. Pixels alone do not establish printed type size; a flattened layout does not establish visibility on an assembled package.

### Sample B: Organizer’s US granola files

Use the [DancingFish PDF](https://uc.hackerearth.com/he-public-ap-south-1/DancingFish_Granola_Berry_US_Carton%20%282%294def4e1.pdf) and [content-sheet XLSX](https://uc.hackerearth.com/he-public-ap-south-1/DancingFish_Granola_BerryCrunch_US_Content_Sheet%20%283%292057df9.xlsx). Keep the market US.

The sheet contains draft/reconstructed information. Inspect the PDF and workbook before choosing findings. Record exact page/cell locations; uncertain content produces review questions, not confirmed legal failures. Do not apply Japan beverage rules to this sample.

### Tasks

- [ ] Save source records in `reference-data/sources.json`: URL, publisher/title, page/section, actual retrieval date, downloaded-file hash/path, language/translation status, effective date or unknown, reuse terms.
- [ ] Save original V1/V2 artwork under `frontend/public/demo/`; save specifications, policies, rule definitions, and expected results under `reference-data/`.
- [ ] Populate `frontend/src/demo/` and connect all sample actions through `demo-repository.ts`. Results must repeat exactly; “Reset demo” restores the starting state.
- [ ] Add `frontend/scripts/validate-sources.ts`, `frontend/scripts/validate-demo.ts`, and `frontend/tests/e2e/demo.spec.ts`.

**Verify in order:** First validate source records and read back citations. Then validate artwork paths/hashes, unique IDs, linked versions, page/region bounds, source locations, and expected counts. Source validation must work before fictional artwork/results exist.

**Checkpoint:** Every finding has matching artwork and reference evidence. Missing sources, unreadable text, incomplete panels, and uncertain specifications stay uncertain. Corrupt/unavailable browser storage recovers without a crash. Sample assets load locally; copied temporary image links are not dependencies.

## M6: Frontend submission package

- [ ] Run all frontend checks and the complete sample journey on desktop and mobile.
- [ ] Write `frontend/README.md` with verified install/start/reset commands and `.env.example` with demo mode enabled.
- [ ] Prepare `docs/submission/`: flow diagram, implemented/simulated capability list, and a 3–5-minute recording script using the organizer files and Japan example.
- [ ] Rehearse against a production build, including an issue, its evidence, a correction, and an uncertain result.

**Checkpoint:** A fresh install works; nested URLs survive reload; no browser exceptions or broken sample assets remain. The recording describes sample results as simulated. Stop here if time is short.

The [official brief](https://www.hackerearth.com/community/challenges/hackathon/esko-aiforge/) expects useful AI and a working prototype. A frontend demonstration does not establish working AI verification. Keep that distinction explicit in the submission description.

## Frontend design and checks

### Appearance

Write these starting choices into `DESIGN.md` in M1; review the rendered dashboard before extending them:

- White panels on `#F4F6FA`; main text `#162138`; secondary text `#536078`; actions `#1159C2`. Use `#B32642` sparingly for branding, not as a status shortcut.
- Manrope for Latin text, Noto Sans JP for Japanese. Body text 16px; page headings 32px. Use 8/16/24/32px spacing and 6–10px corner radii.
- Keep the artwork and review table prominent. Use charts only when they answer a review question. Use real product copy and sample artwork, without invented customers or savings.
- At 1440px, show artwork/findings side by side. At 768px, use a narrow navigation rail or drawer. At 320px, use Artwork/Findings tabs and a full-width evidence panel; preserve the selected check.
- Provide visible focus, labeled fields, text/icon status labels, 44px touch targets, readable contrast, and reduced-motion support. Keep artwork panning inside its viewer.

### Required states

Every data-driven screen needs loading, empty, error/retry, success, and partial-result states. Keep entered form values after errors. Show the reason when a check was skipped or needs review. Unknown review IDs provide a route back to the dashboard.

### Commands

Create these scripts during M1; run the relevant tests while working and all commands at each completed frontend milestone:

```sh
pnpm -C frontend typecheck
pnpm -C frontend lint
pnpm -C frontend test:unit
pnpm -C frontend build
pnpm -C frontend test:e2e
```

M5 adds:

```sh
pnpm -C frontend validate:sources
pnpm -C frontend validate:demo
pnpm -C frontend test:e2e --grep demo
```

Expected: exit code 0 for each command. Browser tests wait for visible results rather than fixed delays. Inspect screenshots at 320, 768, and 1440px, keyboard navigation, Japanese text, console errors, and failed asset requests.

## Backend work: M7–M10

**Read [Backend implementation](docs/plans/BACKEND.md) when starting M7–M10 or changing their API/processing requirements.** It defines storage, file reading, rule execution, live replacement, and their tests. Frontend tasks need only the shared data rules in this file.

## Agent handoff

Implement one unchecked task at a time. For behavior changes, write the failing test, confirm the failure, implement the change, and rerun it. Keep the working frontend available throughout. Commit finished, passing task changes when authorized by the active workflow.

In `PROGRESS.md`, record task, changed files, actual commands/results, screenshot paths, remaining failures, and next task. Check a phase off only when its checkpoint passes.

**Next task: M1, create the frontend app and dashboard.**
