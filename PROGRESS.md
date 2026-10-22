# Wavelength progress

## Product rename — Wavelength, 2026-10-22
- Renamed product copy, metadata, page titles, navigation, footer, package name and project documentation to Wavelength. Introduced one shared capitalized wordmark with wave symbol and matching favicon; removed the old shield/check mark and decorative period. Kept local Manrope/Noto Sans JP and the established palette, refined wordmark weight/spacing and sidebar fit.
- Updated the standalone sample-reference document branding, favicon links and corresponding asset hashes. Internal storage keys intentionally remain stable so existing decisions/drafts/preview metadata are retained; the reset event was renamed consistently across listeners.
- Typecheck, lint, production build passed. Production landing browser tests: 3/3 passed (selection/sample entry, keyboard modal, responsive/reduced-motion/targeted axe). Name/title smoke checked all five app routes and both reference documents; brand fit verified at 320 and 1440px. Visual review: `frontend/evidence/wavelength-{landing,dashboard}-{320,1440}.png`; refreshed standard landing/upload captures as well.
- Initial seven-route console sweep found missing favicon on standalone HTML references; added their favicon links. Final rebuilt seven-route console/name/title smoke passed with no console errors; favicon returned HTTP 200. Desktop/mobile wordmarks fit, and `git diff --check` passed.
- Kev typography decision supported retaining the current typeface with fit refinements: retain 0.9628, replace entire scheme 0.0155, literal rename without fit review 0.0217. Model probabilities are decision support, not measured accuracy.
- No backend or phase expansion. Next task remains M5 when requested.

## Prior delivery — M1–M4, 2026-10-22
- User expanded scope through M4 and explicitly requested the existing checkout on `main`. No worktree, branch, PR, push, backend or M5 work.
- Preserved M1 dashboard/shared repository and M2 artwork/evidence/report. Dashboard New check now opens `/checks/new`; shared navigation connects landing, dashboard, sample, upload and report.
- M3: labeled product/market/category form; only Japan fruit beverage is enabled. PDF/PNG/JPEG validation (non-empty, <=20 MiB), required-file focus, retained draft, optional reference role/declared approval, reset and submission guard. Browser-local image/PDF previews use real dimensions/pages; replaced/unmounted previews release object URLs. SessionStorage holds bounded metadata, never file contents; reload explicitly requires re-selection. Uploaded files never receive fixture findings. Saved preview details survive reload.
- M4: product-specific landing, large task headline, sample entry, shared interactive artwork/finding selection, source and correction, three-step explanation, honest demo scope and real footer/navigation. Native mobile modal supports Escape, focus containment and restoration. Local fonts/assets and reduced-motion support. Adapted reviewed Watermelon hero/footer source without overwriting shared primitives; source hashes and MIT license are in `frontend/THIRD_PARTY_NOTICES.md`.
- Iterated from desktop render to narrow renders to production: corrected PDF preview dimensions, replaced decorative sample thumbnail with actual artwork, tightened sidebar navigation, and removed conflicting English juice-content text from the missing-statement V1 fixture (updated its hash). Added brand favicon after the production console sweep identified a favicon 404.
- Read executing-plans, frontend-design, frontend-ui-engineering, frontend-design-review, frontend-ui-excellence, Refero and Playwright guidance; applied project deadline overrides. Refero/design catalog tools were unavailable. Playwright skill helper initially lacked a resolvable dependency; used existing project Playwright with installed Chrome, without adding infrastructure. No subagents used.
- Kev was available without starting GPU. Its bounded landing-emphasis decision returned artifact/evidence 0.7048, broad claims 0.0572, arbitrary-upload assessment 0.2379. These are model probabilities, not measured accuracy; source evidence and actual implementation determined the final behavior.

### Checks actually run for this delivery
- `pnpm -C frontend typecheck`, `lint`: passed. Unit tests: 13/13 passed.
- CLI dry runs for Watermelon hero-1 and footer-1: passed; both proposed shared primitive overwrites, so source was adapted directly with attribution.
- Dev browser checks: dashboard 2/2, uploads 3/3, mobile/reflow/axe 2/2 passed. Initial landing integration test failed because its locator omitted “net”; corrected the test selector and reran that case successfully.
- Production build: passed. Production browser run of `landing.spec.ts`, `new-check.spec.ts`, `review.spec.ts` using installed Chrome: 10/10 passed. Includes PDF/image upload preview, duplicate submit, metadata reload, sample separation, finding/marker/source links, keyboard menu, reduced motion, no serious/critical axe violations on the new screens, review decisions/report reload and missing IDs.
- Inspected screenshots: `frontend/evidence/landing-{320,768,1440}.png`, `frontend/evidence/upload-{320,768,1440}.png`, plus initial dashboard render. Production captures replace the initial development screenshots. No general cross-browser, screen-reader or exhaustive accessibility certification claimed.
- Final favicon rebuild passed. A fresh Chrome sweep of landing, dashboard, upload, review and report found zero console warnings/errors, page exceptions or failed page-resource responses. Icon SVG parses; `git diff --check` passed.
- Demo blockers: no known M1–M4 flow blockers. Live analysis is not connected; fixtures remain fictional, not researched compliance rules. M5 and M6 remain unimplemented and outside this request.
- Next task: M5 researched sample data, only when requested.

## Prior M1–M2 scope and environment — 2026-10-22
- Original request: M1–M6. User narrowed active scope to M1–M2; stop before M3. Repository initially contained plans only.
- User authorized Design Partner as the substitute for the unavailable mandatory frontend skills. Read its SKILL.md plus foundations, mode contracts, accessibility, and verification references.
- Read idea.md, IMPLEMENTATION_GUIDE.md, and AGENTS.md. Product brief preserved.
- Branch: `codex/frontend-m1-m6`. No backend work planned.
- Context7/Refero/Exa/Firecrawl tools unavailable. Official Next.js, Tailwind, shadcn, and Adobe docs read directly. Esko page exceeded parser size.
- npm registry verified stable releases: Next 16.4.2, React 19.3.1, shadcn CLI 4.22.1, Tailwind 4.3.3, PDF.js 6.4.299. Node 22.17.0, pnpm 11.25.0.

## Status
- [x] M1 Dashboard and shared data
- [x] M2 Artwork review and report
- [x] M3 Upload and market form
- [x] M4 Landing page
- [ ] M5 Researched deterministic samples
- [ ] M6 Submission and production rehearsal

## M1 implementation and checks
- Added shared Zod schemas, summary precedence, repository interface/mode selection, temporary fictional fixtures, guarded decision storage, shared shell, native modal, dashboard filters, and loading/empty/error components.
- shadcn CLI 4.22.1 generated the button; adapted its local utility import and 44px control size. Pinned lockfile created. pnpm build scripts explicitly allow only esbuild and unrs-resolver.
- `pnpm -C frontend test:unit`: 5/5 passed (summary rules, cancelled partial run included).
- `pnpm -C frontend build`: exit 0. Routes `/`, `/dashboard`, and Next not-found compiled.
- `pnpm -C frontend typecheck`: exit 0. Initial lint passed with one PostCSS export warning; corrected that warning.
- First browser run: 4 passed, 3 failed. Found stale URL updates dropping search, primary link text inheriting dark color, and 320px header overflow. Fixed each.
- Second `pnpm -C frontend test:e2e`: 7/7 passed, including axe on dashboard/dialog and screenshot/reflow checks at 320, 768, 1024, 1440.
- Visually inspected `frontend/evidence/dashboard-{320,768,1024,1440}.png`. Desktop hierarchy, long names, and mobile labeled rows are readable. Minor refinements: native selects truncate long selected labels at 320px; controls retain accessible labels. Review-route links become functional in M2.
- No screen reader run; keyboard, additional state captures, and final production checks remain before M2 completion.

## M2 implementation — completed to the MVP stopping point
- Routes: `/dashboard`, `/checks/[reviewId]`, `/checks/[reviewId]/report`. `/` redirects to the dashboard. No M3 upload form or M4 landing page was built.
- Added original local SVG packaging, a two-page fictional PDF, and readable local specification/checklist documents. These are temporary M1–M2 fixtures, not researched M5 regulations or organizer files.
- Added image/PDF viewer, page selection, zoom, fit, rotation, normalized evidence markers, and one URL-driven selected finding controlling source details.
- Missing text uses inspected-panel evidence without an invented bounding box. Source evidence includes location, excerpt, reference role/revision/approval status, observed/expected values, and a suggested correction.
- Added acknowledge/dismiss/reopen, required dismissal reason, persisted decisions, reset, scope-aware report, unknown-ID recovery, execution/partial state, and narrow-screen Artwork / Findings views with a navigation drawer.
- Corrected the passing fixture to cover only two supported comparisons (juice text and quantity). Printed size stays unverified and outside that fixture's passed scope.
- Source/artwork SHA-256 hashes and version links are recorded in fixture metadata. PDF.js and its local worker are loaded only by the review viewer. Fonts are local.

## Actual verification already performed
- `pnpm -C frontend typecheck`: exit 0.
- `pnpm -C frontend lint`: exit 0, no remaining lint warnings in the last run.
- `pnpm -C frontend test:unit`: latest run 13/13 passed.
- `pnpm -C frontend build`: latest run exit 0; dashboard plus dynamic review/report routes compiled.
- Last full demo browser run: 25/25 passed. Covered selection/reload, decisions, PDF controls, missing IDs, four-width reflow, reduced motion, axe, keyboard, and DPR2 marker transforms. The dialog focus issue found by the preceding run was fixed.
- `pnpm -C frontend exec playwright test --config=playwright.live.config.ts`: 1/1 passed, covering error/retry on all three screens at 320/1440 and no demo fallback. Fixed missing page heading on standalone error screens during this check.
- A production-build browser run and the newly added source/storage/PDF-error recovery browser cases were **not run**. User explicitly asked to stop extensive testing/optimization and prioritize MVP execution. Further testing is deferred unless requested.
- No screen reader or cross-browser certification; 720px reflow is a 200%-equivalent viewport check, not a browser-chrome zoom audit.

## Visual review evidence
- Inspected dashboard screenshots at 320/768/1024/1440, artwork/evidence layouts at those widths across the recorded review, desktop/mobile reports, empty results, and 320/1440 error screens.
- Files: `frontend/evidence/dashboard-{320,768,1024,1440}.png`, `review-evidence-{320,768,1024,1440}.png`, `review-artwork-{320,768,1024,1440}.png`, `report-{320,768,1024,1440}.png`, `empty-{320,768,1024,1440}.png`, `review-reflow-720-reduced-motion.png`, and `error-{dashboard,review,report}-{320,1440}.png` (all under `frontend/evidence/`).
- Fixed confirmed visual/trust issues: inconsistent passing-finding title, unsupported physical-size pass, marker number covering text, small evidence type, narrow header overflow, primary-link contrast, and keyboard focus containment.
- Minor: native filter selects truncate long option text at 320px; the labels and full options remain accessible. Dense metadata is intentionally compact. Native dialog drawer styling was added after the last full demo browser run; further review is deferred at the user's request.

## Active scope and next step
- M1–M2 implementation complete for MVP review. Stop here and wait for the user before M3 or further testing/optimization.
- Delivery branch: `codex/frontend-m1-m6` (name reflects the original wider request). User authorized committing and pushing the M1–M2 MVP to `origin` on 2026-10-22.
