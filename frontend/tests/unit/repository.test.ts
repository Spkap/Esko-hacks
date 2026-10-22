import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDemoRepository } from '../../src/data/demo-repository';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
describe('sample repository boundaries', () => {
  it('retains immutable check results across persisted decisions and reset', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
    const repo = createDemoRepository();
    await expect(repo.recordDecision('mori-strawberry-declaration', 'dismissed')).rejects.toThrow();
    await repo.recordDecision(
      'mori-strawberry-declaration',
      'dismissed',
      'Needs product-owner confirmation.',
    );
    const report = await createDemoRepository().getReport('mori-strawberry-run');
    expect(report?.decisions[0].action).toBe('dismissed');
    expect(report?.checks[0].result).toBe('fail');
    await repo.reset();
    expect((await repo.getReport('mori-strawberry-run'))?.decisions).toEqual([]);
  });
  it('recovers from invalid and inaccessible storage', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: () => '{corrupt',
      setItem: () => {
        throw new Error('Blocked');
      },
    });
    const repo = createDemoRepository();
    expect((await repo.getReport('mori-strawberry-run'))?.decisions).toEqual([]);
    await expect(
      repo.recordDecision('mori-strawberry-declaration', 'acknowledged'),
    ).resolves.toMatchObject({ action: 'acknowledged' });
  });
  it('does not assign a fixture report to another artwork and deduplicates run requests', async () => {
    const repo = createDemoRepository();
    const review = await repo.createReview({
      productName: 'Different artwork',
      market: 'Japan',
      category: 'Fruit beverage',
    });
    const file = new File(['different artwork'], 'preview.png', { type: 'image/png' });
    const artwork = await repo.addArtwork(review.id, file);
    const input = {
      reviewId: review.id,
      artworkVersionId: artwork.id,
      referenceIds: [],
      ruleSetVersion: 'illustrative-0.1',
      selectedRuleIds: ['declaration'],
      requestKey: 'one-attempt',
    };
    const run = await repo.startRun(input);
    expect((await repo.startRun(input)).id).toBe(run.id);
    expect((await repo.getReport(run.id))?.checks).toEqual([]);
    expect(run.status).toBe('failed');
    await repo.reset();
  });
  it('live mode rejects without falling back to demo data', async () => {
    vi.stubEnv('NEXT_PUBLIC_DATA_MODE', 'live');
    const { repository } = await import('../../src/data/repository');
    await expect(repository.listReviews()).rejects.toThrow('Live analysis is not connected');
    vi.unstubAllEnvs();
  });
});
