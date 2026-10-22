import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { artworks, checks, references, reviews, runs } from '../../src/demo/fixtures';
describe('M2 evidence fixture integrity', () => {
  it('links versioned local assets and source locations with matching hashes', () => {
    for (const asset of [...artworks, ...references]) {
      const bytes = readFileSync(new URL(`../../public${asset.url}`, import.meta.url));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.fileHash);
      expect(reviews.some((r) => r.id === asset.reviewId)).toBe(true);
    }
    expect(new Set(checks.map((c) => c.id)).size).toBe(checks.length);
    for (const check of checks) {
      const run = runs.find((r) => r.id === check.runId)!;
      const artwork = artworks.find((a) => a.id === check.evidence.artworkVersionId)!;
      expect(run.artworkVersionId).toBe(artwork.id);
      expect(check.evidence.page).toBeLessThanOrEqual(artwork.pages.length);
      expect(run.referenceIds).toContain(check.evidence.sourceId);
      expect(check.evidence.sourceLocation.length).toBeGreaterThan(0);
    }
  });
});
