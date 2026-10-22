# Local seed product photography

Generated on 2026-10-22 with the built-in Image Gen tool. These original photorealistic images depict fictional seed products. They are illustrative product thumbnails, not photographed real merchandise, inspected artwork, or regulatory evidence.

- `mori-strawberry.png`: MORI Strawberry 250 mL beverage can. Visual reference: existing local `/brand/mori-studio.png`.
- `fieldwork-berry-granola.png`: Fieldwork Berry Granola 350 g carton. No third-party image reference.

Both PNGs are bundled in `frontend/public/demo/thumbnails/` and used by the seed review records. The current SVG/PDF files and their finding coordinates remain the source artwork. All MORI versions share a product identity photo; version and assessment labels remain separate. Next.js serves the local assets through its existing image component; no external host, API key, or runtime generation is required.

## Generation prompts

### MORI
Use case: product-mockup. Asset type: square local product thumbnail for a light packaging-review dashboard. Create a photorealistic studio catalog packshot of the fictional MORI Strawberry 250 mL slim aluminum can shown in the reference, preserving its ivory label, cranberry red lower band, strawberry artwork, and brand identity. Show the entire upright can centered, almost straight-on with a very slight three-quarter angle, filling 82% of image height, generous clear space around its silhouette. Seamless pale warm ivory background, soft neutral daylight, subtle short contact shadow, crisp metal rim and paper-print detail. Exact front text only: "MORI", "STRAWBERRY", "250 mL". No detached fruit, no additional props, no hands, no badges, no compliance stamps, no UI, no watermark. It must remain recognizable at 56px thumbnail size and fit a calm white/navy interface. This is illustrative seed-product photography, not compliance evidence.

### Fieldwork
Use case: product-mockup. Asset type: square local product thumbnail for a light packaging-review dashboard. Create a photorealistic studio catalog packshot of one fictional FIELDWORK Berry Granola rectangular cereal carton, US 350 g. The carton has a cream paperboard body, deep muted forest-green upper branding and a cranberry-red berry panel with a tasteful small illustration of mixed berries and oat clusters. Readable exact front words: "FIELDWORK", "BERRY GRANOLA", "350 g". Show the complete upright carton centered in a slight three-quarter angle, filling 82% of image height with space around the silhouette. Seamless pale warm ivory background, soft neutral daylight, subtle short contact shadow, crisp folded cardboard edges and realistic print texture. No detached food props, no real company logos, no nutrition claims, no compliance seals, no humans, no UI, no watermark. A restrained packaging product photograph that remains recognizable at 56px and complements an ivory/cranberry beverage photo in the same dashboard. Illustrative fictional seed product, not compliance evidence.
