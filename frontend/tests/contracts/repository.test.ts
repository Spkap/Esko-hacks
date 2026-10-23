import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  reviewSchema,
  artworkSchema,
  referenceSchema,
  runSchema,
  reportSchema,
  reviewDetailSchema,
  reviewListSchema,
  decisionSchema,
} from '@/domain/types';
// Fixture is emitted by the real API + PostgreSQL + separate-worker acceptance
// exercise. Never substitute a demo repository response here.
const path = process.env.WAVELENGTH_CONTRACT_FIXTURE;
describe.skipIf(!path)('actual backend responses match frontend Zod contracts', () => {
  it('validates every repository record and report', () => {
    const fixture = JSON.parse(readFileSync(path!, 'utf8'));
    for (const [key, schema] of Object.entries({
      review: reviewSchema,
      artwork: artworkSchema,
      reference: referenceSchema,
      run: runSchema,
      report: reportSchema,
      detail: reviewDetailSchema,
      list: reviewListSchema,
      decision: decisionSchema,
    })) {
      expect(schema.safeParse(fixture[key]).success, `Invalid real backend ${key} response`).toBe(
        true,
      );
    }
  });
});
