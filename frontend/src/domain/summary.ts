import type { CheckResult, Run } from './types';
export function summarize(
  status: Run['status'],
  checks: Pick<CheckResult, 'result' | 'applicability'>[],
) {
  const applicable = checks.filter((c) => c.applicability !== 'not_applicable');
  const counts = {
    pass: 0,
    fail: 0,
    needs_review: 0,
    not_checked: 0,
    not_applicable: checks.length - applicable.length,
  };
  checks.forEach((c) => {
    if (c.result === 'pass' && c.applicability === 'not_applicable') return;
    counts[c.result]++;
  });
  let label: string;
  if (status !== 'completed')
    label = (
      {
        queued: 'Queued',
        extracting: 'Reading artwork',
        checking: 'Checking',
        failed: 'Analysis failed',
        cancelled: 'Cancelled',
      } as const
    )[status];
  else if (counts.fail) label = 'Issues found';
  else if (
    applicable.some(
      (c) =>
        c.applicability === 'uncertain' ||
        c.result === 'needs_review' ||
        c.result === 'not_checked',
    )
  )
    label = 'Review incomplete';
  else if (
    applicable.some((c) => c.applicability === 'applicable') &&
    applicable.every((c) => c.result === 'pass')
  )
    label = 'Selected checks passed';
  else label = 'No applicable checks';
  return { label, counts, incomplete: status !== 'completed' || label === 'Review incomplete' };
}
