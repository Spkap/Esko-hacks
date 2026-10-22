import { AlertCircle, CheckCircle2, CircleDashed, MinusCircle } from 'lucide-react';
export function StatusBadge({ label }: { label: string }) {
  const kind =
    label === 'Issues found' || label === 'Fail'
      ? 'fail'
      : label === 'Selected checks passed' || label === 'Pass'
        ? 'pass'
        : ['Review incomplete', 'Needs review'].includes(label)
          ? 'review'
          : '';
  const Icon =
    kind === 'fail'
      ? AlertCircle
      : kind === 'pass'
        ? CheckCircle2
        : kind === 'review'
          ? CircleDashed
          : MinusCircle;
  return (
    <span className={`status-badge ${kind}`}>
      <Icon size={13} />
      {label}
    </span>
  );
}
