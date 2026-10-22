# Seeded review evidence

- `sources.json`: source URLs, locations, actual retrieval date, translation/reuse status, and SHA-256 of the available artifact. `originalFilePath` / `originalFileSha256` distinguish downloaded originals from authored notes.
- `rules.json`: limited sample policy/comparison definitions, research context, assumptions and boundary cases.
- `expected-results.json`: exact ordered finding results and overall labels for all six baseline reviews.
- Original organizer files, source notes, fictional MORI specifications and artwork are bundled under `frontend/public/demo/`; their hashes are in `frontend/src/demo/asset-hashes.json`.

Run source validation before demo validation. Neither validator performs legal analysis. The Japan references were read through the web reader; direct downloads failed DNS resolution. Their authored source notes are retained with explicit archive status. English interpretations are not qualified-reviewed. MORI findings remain fictional company-policy/text comparisons. Organizer findings retain the draft/reconstructed status of their workbook.

Three scenarios can be started from the UI: MORI V1, corrected MORI V2, and the actual organizer’s Dancing Fish proof. Fieldwork is an older fictional multipage fixture; it is not mislabeled as the organizer’s file. Additional boundary cases in `rules.json` are documented examples, not additional executable regulatory checks.
