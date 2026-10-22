import {
  artworkSchema,
  checkSchema,
  referenceSchema,
  reviewSchema,
  runSchema,
} from '@/domain/types';
import type { CheckResult } from '@/domain/types';
import assetHashes from './asset-hashes.json';

// Temporary, fictional M1–M2 interface fixtures. These are not researched M5 rules.
const date = '2026-10-22T05:30:00.000Z';
const entries = [
  ['mori-strawberry', 'MORI Strawberry', 'Fruit beverage', 'Japan', 1, 'issues'],
  ['mori-corrected', 'MORI Strawberry · revised artwork', 'Fruit beverage', 'Japan', 2, 'pass'],
  [
    'mori-raster',
    'MORI Strawberry · retail launch special edition',
    'Fruit beverage',
    'Japan',
    2,
    'incomplete',
  ],
  [
    'fieldwork-granola',
    'Fieldwork Berry Granola',
    'Breakfast cereal',
    'United States',
    1,
    'incomplete',
  ],
  [
    'mori-cancelled',
    'MORI Strawberry · composition study',
    'Fruit beverage',
    'Japan',
    1,
    'cancelled',
  ],
] as const;
export const reviews = entries.map(([id, productName, category, market, version]) =>
  reviewSchema.parse({
    id,
    productName,
    category,
    market,
    currentArtworkVersionId: `${id}-v${version}`,
    latestRunId: `${id}-run`,
    createdAt: date,
    updatedAt: date,
  }),
);
export const artworks = entries.map(([id, , , , version]) =>
  artworkSchema.parse({
    id: `${id}-v${version}`,
    reviewId: id,
    version,
    filename: id === 'fieldwork-granola' ? 'fieldwork-carton.pdf' : `mori-label-v${version}.svg`,
    fileHash:
      assetHashes[
        id === 'fieldwork-granola'
          ? 'fieldwork-carton.pdf'
          : version === 1
            ? 'mori-v1.svg'
            : 'mori-v2.svg'
      ],
    fileType: id === 'fieldwork-granola' ? 'application/pdf' : 'image/svg+xml',
    url: id === 'fieldwork-granola' ? '/demo/fieldwork-carton.pdf' : `/demo/mori-v${version}.svg`,
    pages:
      id === 'fieldwork-granola'
        ? [
            { width: 600, height: 800, rotation: 0 },
            { width: 600, height: 800, rotation: 0 },
          ]
        : [{ width: 900, height: 620, rotation: 0 }],
  }),
);
export const references = entries.flatMap(([id]) => [
  referenceSchema.parse({
    id: `${id}-spec`,
    reviewId: id,
    revision: 1,
    title: 'Fictional product specification',
    fileHash: assetHashes['sample-specification.html'],
    role: 'product_specification',
    approvalStatus: id === 'fieldwork-granola' ? 'draft' : 'approved',
    readingStatus: 'read',
    url: '/demo/sample-specification.html',
  }),
  referenceSchema.parse({
    id: `${id}-policy`,
    reviewId: id,
    revision: 1,
    title: 'Illustrative review checklist',
    fileHash: assetHashes['sample-checklist.html'],
    role: 'company_policy',
    approvalStatus: 'draft',
    readingStatus: 'read',
    url: '/demo/sample-checklist.html',
  }),
]);
export const runs = entries.map(([id, , , , version, mode]) =>
  runSchema.parse({
    id: `${id}-run`,
    reviewId: id,
    artworkVersionId: `${id}-v${version}`,
    referenceIds: [`${id}-spec`, `${id}-policy`],
    ruleSetVersion: 'illustrative-0.1',
    selectedRuleIds:
      id === 'fieldwork-granola'
        ? ['allergens']
        : mode === 'pass'
          ? ['declaration', 'quantity']
          : ['declaration', 'quantity', 'type-size'],
    mode: 'demo',
    status: mode === 'cancelled' ? 'cancelled' : 'completed',
    requestKey: `fixture-${id}`,
    createdAt: date,
  }),
);

function check(id: string, key: string, overrides: Partial<CheckResult>): CheckResult {
  const artwork = artworks.find((a) => a.reviewId === id)!;
  return checkSchema.parse({
    id: `${id}-${key}`,
    runId: `${id}-run`,
    ruleId: key,
    ruleVersion: 'illustrative-0.1',
    title: 'Declared net quantity matches specification',
    kind: 'product_data',
    applicability: 'applicable',
    result: 'pass',
    observed: 'Artwork declares 250 mL.',
    expected: 'Approved fictional specification: 250 mL.',
    suggestedCorrection: 'No correction needed for this selected comparison.',
    evidence: {
      artworkVersionId: artwork.id,
      page: 1,
      region: { x: 0.407, y: 0.79, width: 0.186, height: 0.055 },
      inspectedPanels: 'Front and back panels in the supplied flat artwork',
      sourceId: `${id}-spec`,
      sourceLocation: 'Section 2 · Net content',
      excerpt: 'Declared net content: 250 mL.',
    },
    ...overrides,
  });
}
export const checks = entries.flatMap(([id, , , , , state]) => {
  if (id === 'fieldwork-granola')
    return [
      check(id, 'allergens', {
        title: 'Confirm allergen statement against draft specification',
        result: 'needs_review',
        observed: 'The illustrative PDF states “Contains oats”. The reference is draft.',
        expected: 'A confirmed ingredient and allergen declaration from the product owner.',
        reason: 'Draft reference cannot establish an approved requirement.',
        suggestedCorrection:
          'Confirm the specification with the product owner before making a compliance assessment.',
        evidence: {
          artworkVersionId: `${id}-v1`,
          page: 2,
          region: { x: 0.1, y: 0.475, width: 0.8, height: 0.075 },
          inspectedPanels: 'PDF page 2 · back panel',
          sourceId: `${id}-spec`,
          sourceLocation: 'Section 4 · Allergen review',
          excerpt: 'DRAFT: allergen declaration is awaiting product-owner confirmation.',
        },
      }),
      check(id, 'nutrition', {
        title: 'Nutrition panel verification not selected',
        result: 'not_checked',
        observed: 'Nutrition verification is outside this run.',
        expected: 'A separately selected nutrition review with an approved reference.',
        reason: 'This requirement was not included in the selected review scope.',
        suggestedCorrection: 'Arrange a dedicated nutrition review.',
        evidence: {
          artworkVersionId: `${id}-v1`,
          page: 2,
          inspectedPanels: 'Back panel; no nutrition assessment performed',
          sourceId: `${id}-policy`,
          sourceLocation: 'Section 3 · Exclusions',
          excerpt: 'Nutrition and market-wide regulatory verification are excluded.',
        },
      }),
    ];
  const quantity = check(id, 'quantity', {});
  if (state === 'cancelled') return [quantity];
  const declaration = check(id, 'declaration', {
    title:
      state === 'issues'
        ? 'Juice statement missing from supplied panels'
        : 'Juice statement appears on supplied back panel',
    result: state === 'issues' ? 'fail' : 'pass',
    kind: 'brand',
    observed:
      state === 'issues'
        ? 'No juice statement appears on either supplied panel.'
        : 'The back panel includes 果汁2%.',
    expected: 'The fictional company checklist requests an explicit juice statement.',
    suggestedCorrection:
      state === 'issues'
        ? 'Add the reviewed juice statement to the back panel, then submit a new artwork version.'
        : 'No correction needed for the selected text-presence check.',
    evidence: {
      artworkVersionId: quantity.evidence.artworkVersionId,
      page: 1,
      ...(state !== 'issues' ? { region: { x: 0.743, y: 0.645, width: 0.15, height: 0.065 } } : {}),
      inspectedPanels: 'Front and back panels only · absence is limited to this supplied artwork',
      sourceId: `${id}-policy`,
      sourceLocation: 'Section 1 · Juice statement',
      excerpt:
        'Illustrative company rule: display the reviewed juice statement on the supplied beverage artwork.',
    },
  });
  const size = check(id, 'type-size', {
    title: 'Printed type size needs physical scale',
    result: 'needs_review',
    applicability: state === 'incomplete' ? 'uncertain' : 'applicable',
    observed: 'This digital preview does not establish a printed measurement.',
    expected: 'Print dimensions and a confirmed text-size measurement.',
    reason: 'Pixels cannot establish printed type size or assembled-package visibility.',
    suggestedCorrection: 'Request a dimensioned production PDF and confirm the printed text size.',
    evidence: {
      artworkVersionId: quantity.evidence.artworkVersionId,
      page: 1,
      inspectedPanels: 'Digital flat artwork; physical scale unverified',
      sourceId: `${id}-spec`,
      sourceLocation: 'Section 3 · Physical scale',
      excerpt: 'Physical measurements are not established by this preview.',
    },
  });
  return state === 'pass' ? [declaration, quantity] : [declaration, quantity, size];
});
