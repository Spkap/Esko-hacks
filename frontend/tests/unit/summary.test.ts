import { describe, expect, it } from 'vitest';
import { summarize } from '../../src/domain/summary';

describe('assessment summary', () => {
  it('prioritizes incomplete execution over partial passes', () => {
    for (const status of ['queued', 'extracting', 'checking', 'failed', 'cancelled'] as const) {
      expect(summarize(status, [{ result: 'pass', applicability: 'applicable' }]).label).not.toBe(
        'Selected checks passed',
      );
    }
  });
  it('keeps failed checks failed after a reviewer decision', () => {
    expect(summarize('completed', [{ result: 'fail', applicability: 'applicable' }]).label).toBe(
      'Issues found',
    );
  });
  it('requires review for uncertainty and unchecked applicable rules', () => {
    for (const check of [
      { result: 'pass', applicability: 'uncertain' },
      { result: 'not_checked', applicability: 'applicable' },
      { result: 'needs_review', applicability: 'applicable' },
    ] as const) {
      expect(summarize('completed', [check]).label).toBe('Review incomplete');
    }
  });
  it('excludes non-applicable rules from pass totals', () => {
    expect(
      summarize('completed', [
        { result: 'pass', applicability: 'applicable' },
        { result: 'pass', applicability: 'not_applicable' },
      ]),
    ).toMatchObject({ label: 'Selected checks passed', counts: { pass: 1 } });
  });
  it('counts actual unchecked records even when their rule does not apply', () => {
    expect(
      summarize('completed', [{ result: 'not_checked', applicability: 'not_applicable' }]),
    ).toMatchObject({
      label: 'No applicable checks',
      counts: { not_checked: 1, pass: 0, not_applicable: 1 },
    });
  });
  it('does not manufacture a pass for an empty or non-applicable scope', () => {
    expect(summarize('completed', []).label).toBe('No applicable checks');
    expect(
      summarize('completed', [{ result: 'not_checked', applicability: 'not_applicable' }]).label,
    ).toBe('No applicable checks');
  });
});
