# Veriforge Implementation Plan

> **For implementation agents:** Use `superpowers:executing-plans` to work task by task. Use `superpowers:subagent-driven-development` when parallel execution is requested. Track completion with the checkboxes below.

**Frontend execution:** Follow [AGENTS.md](AGENTS.md). It requires `frontend-design` before visual decisions, `frontend-ui-engineering` during implementation, `frontend-design-review` after implementation, and `frontend-ui-excellence` before completion.

**Goal:** Let users upload packaging, choose a market, and see issues with evidence and suggested corrections.

**Architecture:** Build the frontend with local sample data. Put data access behind one shared interface so a backend can replace the samples without rewriting screens. Build that backend only after the frontend demo is ready.

**Tech stack:** Next.js, TypeScript, Tailwind CSS v4, shadcn/ui, Watermelon UI landing blocks, Zod, PDF.js, Vitest, Playwright. Backend: Python, FastAPI, PostgreSQL.

**Product description:** [idea.md](idea.md). Keep it unchanged. M1–M4 frontend implementation is complete; see `PROGRESS.md` for actual checks and scope.

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

- [x] Create `DESIGN.md` from the appearance and reference choices below. Include desktop/mobile layout sketches and the dashboard's loading, empty, error, and selected states. Use these as the build target.
- [x] Create the Next.js app in `frontend/` with Tailwind v4; initialize shadcn/ui and pin its CLI as a development dependency. Verify compatible stable versions and commit the lockfile. Use normal Next.js hosting so new review URLs work after refresh.
- [x] Create the shared types, summary function, and sample implementation. Include reviews with issues, incomplete checks, and passed selected checks.
- [x] Build the table and filters. Until M2 exists, opening a row shows its details in a drawer.
- [x] Add `frontend/tests/unit/summary.test.ts` and `frontend/tests/e2e/dashboard.spec.ts` with the cases below.

**Verify:** Search finds the correct product; combined filters work; clearing filters restores rows; zero matches offers “Clear filters”; displayed counts agree with records. Summary tests cover every rule above, including a cancelled run containing partial passes.

**Checkpoint:** The frontend checks and visual completion checklist pass. The dashboard works after reload with no backend. Review its rendered layout before extending the same components to M2–M4.

## M2: Artwork review

**Build:** Artwork on the left; findings and selected evidence on the right. One selected check controls both the artwork marker and the details.

- [x] Create the review route, image viewer, finding list, and source panel. Each finding shows observed value, expected value, source location, and suggested correction.
- [x] Add PDF.js with page, zoom, and fit controls. Load it only on the review screen.
- [x] Create the report route and acknowledge/dismiss actions. Keep the original assessment unchanged.
- [x] Add `frontend/tests/e2e/review.spec.ts` for marker/list selection, source access, decisions, and missing review IDs.

**Evidence positions:** Use 1-based page numbers and top-left `{x, y, width, height}` values between 0 and 1, tied to the artwork version and rendered page orientation. Convert them through the viewer’s zoom/rotation transform. Test zoom, resize, rotation, and high-density displays. For missing text, show inspected panels and use no marker.

**Checkpoint:** Clicking a finding opens the right page, region, and source without another navigation step. Passes, failures, uncertainty, and unchecked requirements remain distinguishable. Back navigation, direct reload, and the visual completion checklist pass.

## M3: Upload and market selection

**Build:** `/checks/new` with visible labels for product name, category, target market, artwork, product specification, and optional company/regulatory references.

- [x] Create the form with file previews and a “Use sample” shortcut. Enable only market/category pairs with a supported check set; label other options “Planned.”
- [x] Reject unsupported file types and files over 20 MiB. Preserve entered values when validation fails.
- [x] Connect creation and preview through the shared data interface. Store small metadata only; session file previews require re-selection after reload.
- [x] Add `frontend/tests/e2e/new-check.spec.ts` for missing fields, invalid files, repeated submit, reset, and reload.

**Demo behavior:** The supplied sample can produce sample findings. Any other upload is preview-only and says live analysis is not connected. It must never inherit another file’s report.

**Checkpoint:** A keyboard user can complete the form; invalid submission focuses the first error and retains entered values. A repeated click creates one review/run. File replacement releases the previous preview URL. The visual completion checklist passes.

## M4: Landing page

**Build:** Use selected Watermelon UI blocks for a product explanation that leads directly into the sample. Keep the dashboard and review screens on the existing shadcn/ui components.

- [x] Preview the Watermelon imports below; adapt them in `frontend/src/components/landing/` without replacing shared dashboard components or global styles.
- [x] Create the first screen: Veriforge, “Check your packaging before it reaches the shelf,” one explanatory sentence, “Try sample check,” and an artwork preview. Replace the block's stock background with our packaging example and apply `DESIGN.md` colors/fonts.
- [x] Reuse the M2 selection behavior: clicking an issue highlights its artwork location and opens its evidence.
- [x] Add the three-step workflow, supported demo scope, and footer links into the app. Remove the imported sign-in/social placeholders and newsletter form. Add page title/description.
- [x] Add `frontend/tests/e2e/landing.spec.ts` for sample entry, interactive preview, mobile-menu keyboard controls, reduced motion, and direct reload without rendering errors.

**Checkpoint: UI complete.** All four screens are connected and pass the visual completion checklist. The first landing viewport shows the product, sample action, and packaging example. Begin researched seed data only after this checkpoint.

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

**Direction:** A bright packaging inspection desk. Reviewers need to read colorful artwork and precise findings on a laptop or desktop. Keep the surrounding interface quiet; let the packaging and selected evidence carry attention.

Write these decisions into `DESIGN.md` in M1:

- **Hierarchy:** One main action per screen. Dashboard: review rows first, counts second. Review: artwork and selected finding first, other tools second. Landing: product promise, sample action, and interactive packaging preview.
- **Color:** White panels on `#F4F6FA`; text `#162138`; secondary text `#536078`; actions/selection `#1159C2`. Use `#B32642` for small brand details. Define reusable CSS variables; components use named tokens. Secondary text on white measures 6.34:1 contrast; white on the action blue measures 6.50:1. Check every additional text/status pair.
- **Type and spacing:** Manrope plus Noto Sans JP; 16px body, 20px section headings, 32px page headings, 48–64px landing headline. Keep prose under 75 characters per line. Use 8/12/16/24/32px spacing, 6px controls, and 10px panels. Align table columns and use tabular numerals for counts.
- **Layout:** At 1440px, use a 224px navigation column and side-by-side artwork/findings. At 1024px, collapse navigation and switch to Artwork/Findings tabs when either pane becomes unreadable. At 768px and below, use a navigation drawer. At 320px, show labeled review rows and a full-width evidence panel. Preserve selection across layouts; keep artwork panning inside its viewer.
- **Signature interaction:** Selecting an issue highlights its real artwork region and opens the source beside it. Keep page/zoom controls stable. The dashboard row hover and selected state must not move content.
- **Motion:** Use 120–200ms feedback for selection and expansion. One short landing entrance is enough. Animate opacity/transform rather than layout sizes; reduced-motion mode keeps all content and actions immediately available.
- **Restraint:** Use local packaging artwork, thin dividers, and clear section spacing. Cards must group something meaningful. Keep decorative gradients, nested cards, stock feature grids, fake metrics, and unrelated animation out of the review workspace.

### Reference choices

| Reference | Adapt | Keep out of scope |
|---|---|---|
| [Esko WebCenter Go](https://www.esko.com/en/products/webcenter-go), including its published proofing and task-list screenshots | Artwork-first canvas, visible file/version context, readable review rows. | Its full proofing toolbar, brand assets, and approval workflow. |
| [Adobe Acrobat annotation guidance](https://helpx.adobe.com/acrobat/using/commenting-pdfs.html) | Comments beside the document and a clear relationship between selection and detail. | A general-purpose annotation editor. |
| Watermelon `hero-1` and `footer-1`, linked in M4 | Editable landing structure and responsive navigation. | Stock background, demo forms/links, and a second visual system. |

Use these references as bounded inputs, not screen clones. Add a short reason beside any new design decision in `DESIGN.md`. The current direction can be built directly; ask for another visual direction only when the user requests one or a concrete conflict remains.

### Required states

Every data-driven screen needs loading, empty, error/retry, success, and partial-result states. Keep entered form values after errors. Show the reason when a check was skipped or needs review. Unknown review IDs provide a route back to the dashboard.

### Visual completion checklist

- [ ] Inspect screenshots at 320, 768, 1024, and 1440px, including long product names, Japanese text, empty results, errors, and selected findings. Text, menus, and controls neither overlap nor clip; ordinary page content reflows at zoom.
- [ ] Complete the task by keyboard. Native links/buttons have visible focus. Modal drawers contain focus, close with Escape, and return focus to their trigger; the source remains reachable without canvas interaction. Follow [W3C's dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) and [reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- [ ] Run axe checks on each route and open dialog, then manually inspect labels, reading order, contrast, and touch controls. Fix critical/serious findings; automated scans alone do not establish accessibility compliance.
- [ ] Compare the render with `DESIGN.md`: consistent type, spacing, icon sizes, colors, and row alignment. Reserve image dimensions so loading does not shift controls. Keep the primary action visible and each finding understandable from its title and first detail line.
- [ ] Verify reduced motion, loading/error recovery, no browser exceptions, and no broken assets. Save screenshots and review findings in `PROGRESS.md`; fix blocking/major issues before marking the phase complete. An aesthetic score never replaces these checks.

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

Expected: exit code 0 for each command. Browser tests wait for visible results rather than fixed delays. Install `@axe-core/playwright` during M1 and add route/state accessibility checks in `frontend/tests/e2e/accessibility.spec.ts`. Use the visual completion checklist for manual review.

## Backend work: M7–M10

**Read [Backend implementation](docs/plans/BACKEND.md) when starting M7–M10 or changing their API/processing requirements.** It defines storage, file reading, rule execution, live replacement, and their tests. Frontend tasks need only the shared data rules in this file.

## Agent handoff

Implement one unchecked task at a time using the mandatory skill sequence in [AGENTS.md](AGENTS.md). Keep route files thin; colocate component-specific hooks/tests, and separate data loading from presentation. Use component state for local controls and URL parameters for shareable filters/selection. For behavior changes, write the failing test, confirm the failure, implement the change, and rerun it. Keep the working frontend available throughout. Commit finished, passing task changes when authorized by the active workflow.

In `PROGRESS.md`, record task, changed files, actual commands/results, screenshot paths, remaining failures, and next task. Check a phase off only when its checkpoint passes.

**Next task: M5, researched seed data, when authorized. M1–M4 are complete under the hackathon verification rules; see PROGRESS.md.**
