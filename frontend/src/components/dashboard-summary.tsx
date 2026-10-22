import { Layers, AlertCircle, CircleDashed, CheckCircle2 } from 'lucide-react';
import { summarize } from '@/domain/summary';
import type { ReviewListItem } from '@/domain/types';

export function DashboardSummary({
  reviews,
  selected,
  onSelect,
  loading,
}: {
  reviews: ReviewListItem[];
  selected: string;
  onSelect: (result: string) => void;
  loading: boolean;
}) {
  const count = (label: string) =>
    reviews.filter((review) => summarize(review.run.status, review.checks).label === label).length;
  const items = [
    {
      label: 'All reviews',
      value: '',
      count: reviews.length,
      note: 'Including cancelled reviews',
      Icon: Layers,
      tone: 'neutral',
    },
    {
      label: 'Issues found',
      value: 'Issues found',
      count: count('Issues found'),
      note: 'Artwork needs a correction',
      Icon: AlertCircle,
      tone: 'fail',
    },
    {
      label: 'Review incomplete',
      value: 'Review incomplete',
      count: count('Review incomplete'),
      note: 'More context is needed',
      Icon: CircleDashed,
      tone: 'review',
    },
    {
      label: 'Selected checks passed',
      value: 'Selected checks passed',
      count: count('Selected checks passed'),
      note: 'Selected scope only',
      Icon: CheckCircle2,
      tone: 'pass',
    },
  ];
  return (
    <div
      className="dashboard-summary"
      role="group"
      aria-label="Filter reviews by result"
      aria-busy={loading}
    >
      {items.map(({ label, value, count: total, note, Icon, tone }) => (
        <button
          key={label}
          type="button"
          className={`summary-filter ${selected === value ? 'is-selected' : ''}`}
          aria-pressed={selected === value}
          onClick={() => onSelect(value)}
          disabled={loading}
        >
          <span className="summary-filter-label">
            <span className={`summary-icon ${tone}`}>
              <Icon size={15} />
            </span>
            {label}
          </span>
          {loading ? (
            <span className="summary-count-skeleton" aria-label="Loading count" />
          ) : (
            <strong>{total}</strong>
          )}
          <span className="summary-filter-note">{note}</span>
        </button>
      ))}
    </div>
  );
}
