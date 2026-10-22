# Wavelength design reference

## Product and composition
Wavelength is a pre-launch packaging review desk. The reviewer compares an existing artwork with a specification and a traceable requirement. The dashboard is a scan-first review ledger; the review is an artwork-first operating surface; the upload form configures a review; the landing page introduces that same artifact and interaction.

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

## M3–M4 implementation direction — 2026-10-22
- Continue the established review-desk identity: Manrope, cool white canvas, blue actions, cranberry artwork detail, precise thin dividers. Required frontend skills are now available and were read.
- Landing: large left-aligned task headline with an adjacent explanation/action, then the real interactive artwork and linked evidence. Watermelon hero-1 provides navigation/hero composition and footer-1 provides grouped footer structure; adapt source without replacing shared primitives. No stock imagery or fabricated metrics.
- Upload: numbered product/file sections with an adjacent sample shortcut. Browser-local previews are explicitly separate from sample assessment. Narrow layouts stack form and sample; landing navigation uses the existing focus-contained native dialog.
- Reference lock: preserve the product artifact, strong type hierarchy, sparse accent use, and source-to-correction interaction. Use existing original packaging assets. Additional catalog tools were not available; no reference screenshot matching is claimed.

## Wavelength brand identity
- Product name is **Wavelength**, one word with a capital W. Use that spelling in navigation, page titles, reports, source documents, and ordinary copy. Uppercase is reserved for small utility labels.
- Shared `Brand` component supplies the wordmark and a simple two-cycle wave symbol, including the matching favicon. No decorative trailing period or shield/check logo.
- Keep local Manrope and Noto Sans JP; the wordmark uses Manrope at a slightly lighter weight and more open tracking than the previous mark. Desktop/sidebar/mobile sizes fit without wrapping. Preserve the established blue action and cranberry brand roles.

## Landing visual redesign — reference lock, 2026-10-22
User explicitly requested a much stronger visual first impression for judges. This supersedes the landing-only white/flat composition above; the review workspace keeps its current tokens.
- Primary direction: Watermelon hero-16 midnight atmosphere, compact navigation, restrained light, strong hero type and paired actions. Source reviewed at https://registry.watermelon.sh/r/hero-16.json and https://ui.watermelon.sh/block/hero-16.
- Bounded secondary references: Linear homepage for dark product framing, fine borders and quiet navigation; Apple AirPods Pro for a carefully lit physical product as the visual anchor; Watermelon landing-01 for dark-to-section rhythm. Stripe Payments was inspected but its colorful diagonal gradient is rejected for this product.
- Hero media: bespoke AI-generated MORI can studio render, dark navy, cranberry label, icy rim light. Marketing illustration only; the actual interactive sample continues to use the original flat artwork. No generated evidence or compliance claims.
- Composition: asymmetrical hero with a clear product headline and actions on the left, large product on the right, precise review callout. Short proof-of-work strip, then a contrasting light interactive desk. Follow with three editorial process panels and a restrained closing section/large wordmark footer.
- Type: retain Manrope; larger lighter display weight, balanced line endings and generous leading for supporting copy. Navy/white is the dominant contrast; blue is action/selection, cranberry is physical packaging/brand. Lighting is limited to hero/stage, never dashboard controls.
- Motion: one short staggered entrance and slow product drift, paused after brief intro; real hover/focus feedback. Reduced motion shows the complete layout immediately. No scroll hijacking, custom cursor or perpetual autoplay.
- Reuse the shared brand, modal, viewer, findings and repository. Preserve sample navigation and source/correction interaction. Build directly under the existing hackathon authorization and verify rendered desktop/mobile before completion.

## Full-scroll refinement — 2026-10-22
- Preserve the approved hero markup/media/navigation, current typography, existing process illustrations and closing/footer composition. Screenshot review identified the full-width light demo as the main theme break and the text-only scope as the main loss of visual momentum.
- Continue midnight surfaces through the demo; keep the actual flat artwork as white paper. Dark shell, soft slate separators, pale blue selected findings/source links and unchanged semantic result badges. This supersedes the earlier light demo surround only on the landing.
- Keep the three original process illustrations, add a quiet connecting rule and purposeful links, and make copy describe the concrete journey.
- Use a layered report artifact in the scope section, reading the same repository report as the sample. Desktop pairs context with the report; mobile places report before scope details. No invented metrics or success claims.
- Additional references: Watermelon feature-3 paired content/artifact layout and bento-2 grouped surface hierarchy; Linear lower-page product-led storytelling. Adapt composition, not stock claims, unrelated widgets or dependencies.

## Light dashboard refinement — 2026-10-22
- User explicitly requires a light operational dashboard, distinct from the cinematic landing. Keep Manrope, cool near-white canvas, white working surfaces, blue primary/selection, cranberry identity and semantic status colors.
- Source lock: Carbon data-table guidance (toolbar placement, matched density, ample table width, sentence-case headings), shadcn Tasks toolbar (search, status filters, active reset) and Context7 shadcn button/link and active-navigation guidance. URLs: https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines and https://ui.shadcn.com/examples/tasks. Context7 library `/shadcn-ui/ui` queried directly.
- Composition: quieter shared workspace chrome, one clear New check action, compact grouped summary filters based on actual records, a table-led review library, consistent 44px controls, visible active filters/reset and deliberate row navigation. Preserve URL filters, loading/error/empty recovery, assessment wording and honest demo labels.
- Main table remains the dominant work surface; no decorative charts, trend claims, unrelated analytics, landing imagery or dark theme. Summary buttons filter the actual list and describe selected scope precisely.
- Refine density and spacing without replacing the existing stack or installing a table framework. Shared workspace navigation/buttons stay consistent on review/upload/report routes; dashboard-specific table styles remain scoped. Narrow screens use labeled review cards with a visible open action.

## Iconography — 2026-10-22
- Phosphor replaces Lucide throughout the app. Regular weight for compact controls and semantic status; restrained duotone for navigation, document thumbnails and summary icons. Preserve the custom Wavelength waveform. Use server-safe SSR exports and explicit sizes; decorative SVGs are hidden from assistive technology while controls keep their accessible labels.
- API checked through Context7 against the official Phosphor React README. MIT notice retained in frontend/THIRD_PARTY_NOTICES.md.
