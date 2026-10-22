import { ChevronRight, AlertCircle, CheckCircle2, CircleDashed, MinusCircle } from 'lucide-react';
import type { CheckResult } from '@/domain/types';
export const resultLabels = {
  pass: 'Pass',
  fail: 'Fail',
  needs_review: 'Needs review',
  not_checked: 'Not checked',
} as const;
export function FindingList({
  checks,
  selectedId,
  onSelect,
}: {
  checks: CheckResult[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="findings-list" aria-label="Selected checks">
      {checks.map((check, index) => {
        const Icon =
          check.result === 'fail'
            ? AlertCircle
            : check.result === 'pass'
              ? CheckCircle2
              : check.result === 'needs_review'
                ? CircleDashed
                : MinusCircle;
        return (
          <button
            className={`finding-row ${selectedId === check.id ? 'selected' : ''}`}
            key={check.id}
            onClick={() => onSelect(check.id)}
            aria-pressed={selectedId === check.id}
          >
            <span className={`finding-number ${check.result}`}>{index + 1}</span>
            <span className="finding-label">
              <strong>{check.title}</strong>
              <span>
                <Icon size={12} />
                {resultLabels[check.result]}
                <i>·</i>
                {check.kind === 'product_data'
                  ? 'Product data'
                  : check.kind === 'regulatory'
                    ? 'Regulatory'
                    : 'Company checklist'}
              </span>
            </span>
            <ChevronRight size={15} />
          </button>
        );
      })}
    </div>
  );
}
