# Local extraction and exact comparisons

`extract_document(Path, mime_type)` reads native PDF text with pypdf and uses
pypdfium2 + local Tesseract for scans and PNG/JPEG. Limits: 20 pages, 24 million
rendered pixels per page, 20 seconds per OCR call. Run parsers in the worker's
bounded isolated process; these library limits do not replace process limits.
No network provider is used. Tesseract languages are discovered; `ocrLanguages`
records actual languages. Install jpn traineddata for Japanese scans. English-only
OCR does not establish Japanese absence. OCR stays partial. Only a restricted visible text-only PDF drawing language can establish supplied
native-text panel coverage. Forms, images, vector paths, optional content, graphics
states, and hidden text all disable absence conclusions. Native boxes are approximate
visitor text-run boxes in unrotated crop coordinates; the viewer applies page rotation;
PDF coordinates can be unreliable for complex transforms. Physical print size is
never approved from these boxes.

`extract_reference(Path, mime_type)` preserves every nonempty XLSX cell (including
formulas, notes, draft qualifiers) and sheet/cell provenance. Duplicate row-label
values are flagged conservatively; exact net quantity/weight/content rows can yield derived values; other free-form XLSX/PDF fields are review-only. Dependable
exact comparisons require schemaVersion "1" JSON as in
`reference-data/live-specification-example.json`, declared approved by the user.
This is an input declaration, not independent evidence of company approval.
Multiple product specifications remain uncertain. Regulatory sources require
qualified applicability review. Declaring completePanels alone does not establish
readable whole-package coverage; current extractor asserts only this narrow native-text scope.

`evaluate_run(artwork, references, run)` supports `wavelength-core-v1` identifiers
`net-quantity`, `required-statements`, `physical-type-size`. It compares compatible
mass or volume units without cross-dimension conversion. `oz` means avoirdupois
mass and `fl oz` means US fluid ounces; ambiguous market units require review.
Nutrition quantities can cause ambiguity; no label intent is guessed. The <5%
juice helper classifies supplied volume-basis metadata only, not legal duty.

Measured 2026-10-23: actual organizer dancingfish-carton.pdf yielded one native
page, 2635 characters and 166 spans; human spot checks found 480g, honey (1%),
and NO ADDED SUGAR. Its workbook yielded 203 nonempty cells and retained draft
and reconstructed qualifiers. These spot checks are not a complete extraction
accuracy benchmark. Embedded Acorn Type1 fonts warned that fontTools was missing
in the initial environment. Unit/integration/eval tests also change 250 mL to
500 mL to prove output responds to actual input, test rotated native PDF and a
locally generated OCR image, malformed/encrypted files, conflicts, partial scope,
unit/basis boundaries and explanation citations. One synthetic Japanese scanned-PDF spot check preserves 果汁 and 250 with local eng+jpn Tesseract; general Japanese OCR accuracy has not been benchmarked. No paid inference ran.

AI is disabled by default. `explain_check` accepts an explicit server-only provider
adapter only when WAVELENGTH_AI_ENABLED=true. A built-in HTTPS OpenAI-compatible adapter
uses WAVELENGTH_AI_URL, WAVELENGTH_AI_MODEL and WAVELENGTH_AI_KEY. The adapter must honor timeout=10;
transient failures retry once, output is bounded and citations/rule/result are
validated. Raw explanation text is untrusted and cannot change a check. Without
a configured adapter it returns unavailable. No external endpoint or credentials are assumed; all three settings are required.

The optional AI adapter is a separately tested extension point; the default worker pipeline performs deterministic checks only and does not invoke it. Provider selection and semantic evaluation remain pending.
