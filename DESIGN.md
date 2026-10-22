# Veriforge design reference

## Product and composition
Veriforge is a pre-launch packaging review desk. The reviewer compares an existing artwork with a specification and a traceable requirement. The dashboard is a scan-first review ledger; the review is an artwork-first operating surface; the upload form configures a review; the landing page introduces that same artifact and interaction.

Use Design Partner (`design`, create/interaction/responsive/finish contracts), authorized by the user as the replacement for the unavailable frontend skills on 2026-10-22. Context7, Refero, Exa, and Firecrawl are unavailable; consult official documentation directly and record verification honestly.

## Tokens
- Canvas `#F4F6FA`, surface white, ink `#162138`, secondary `#536078`, border `#DCE2EC`.
- Action/selection `#1159C2`; brand detail `#B32642`. Failure `#9D2440` on `#FFF0F3`, caution `#79520C` on `#FFF7DF`, pass `#16644E` on `#EAF6EF`.
- Manrope for Latin UI, Noto Sans JP for Japanese. Body 16px; dense metadata 13px; section 20px; page 32px; landing 48–64px. Tabular figures. Prose max 75ch.
- Spacing 8/12/16/24/32px, control radius 6px, panel radius 10px. Thin dividers; shadows only for layers. No ornamental gradients or fake metrics.

## Desktop sketch (1440px)
```
224px navigation | breadcrumb / Demo data
                | Packaging reviews                 New check
                | concise count line
                | search / market / result
                | product | market | version | result | updated

Review:         | artwork/version + report action
                | viewer toolbar       | findings, counts
                | full packaging       | selected finding
                | selected region      | observation / source / correction
```
At 1024px collapse the sidebar to a header and provide Artwork / Findings view controls. Keep selection in the URL. At <=768px use a native modal navigation drawer. At 320px replace table columns with labeled review rows, stack form fields, and show full-width evidence. Keep two-dimensional artwork scrolling inside the viewer.

## States and behavior
- Loading: stable skeleton with an announced status; no invented data.
- Empty: explain the lack of matches with Clear filters; no reviews offers Use sample.
- Error: explanation and retry; live mode cannot silently show demo results.
- Selected: stable row/region with border and pale blue surface, never geometry movement.
- Partial: execution state precedes assessment, unchecked/uncertain results remain visible.
- Native buttons/links and labels, 44px primary touch targets, visible focus. Navigation dialog contains focus, closes with Escape, and restores focus.
- One selected check synchronizes the artwork page/marker and its evidence. Missing text has inspected-panel evidence without a fabricated marker. Decisions preserve the assessment. Corrected artwork is a different version/run.
- 120–200ms color/opacity feedback; reduced motion immediately exposes content.

## Bounded references
- [Esko WebCenter Go](https://www.esko.com/en/products/webcenter-go): artwork context and readable task rows. Official page could not be read by the web parser (oversized response); do not claim screenshot matching.
- [Adobe comment guidance](https://helpx.adobe.com/acrobat/using/commenting-pdfs.html): keep comments beside the document with selected evidence. No general annotation editor.
- Watermelon hero-1/footer-1: preview editable source during M4; adapt navigation and footer structure to the established tokens. No stock imagery, newsletters, or unrelated social links.

## Acceptance
Inspect 320/768/1024/1440 renders, long names/Japanese, empty/error/selected states, keyboard, zoom/reflow, reduced motion, axe, console and assets. Save evidence in PROGRESS.md. No Figma approval or screen-reader testing claim without actual evidence.
