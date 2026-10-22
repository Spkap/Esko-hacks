import {
  WarningCircleIcon as AlertCircle,
  MagnifyingGlassMinusIcon as SearchX,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { Button } from './ui/button';
export function LoadingState({ label = 'Loading reviews' }: { label?: string }) {
  return (
    <div className="panel state-panel" role="status" aria-label={label}>
      <p>{label}…</p>
      <div style={{ width: '100%' }}>
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
  headingLevel = 'h1',
}: {
  message: string;
  retry: () => void;
  headingLevel?: 'h1' | 'h2';
}) {
  const Heading = headingLevel;
  return (
    <div className="panel state-panel" role="alert">
      <AlertCircle aria-hidden="true" />
      <Heading>Couldn’t load this workspace</Heading>
      <p className="muted">{message}</p>
      <Button onClick={retry}>Try again</Button>
    </div>
  );
}
export function MissingState({ title = 'Review not found' }: { title?: string }) {
  return (
    <div className="panel empty-state">
      <SearchX aria-hidden="true" size={32} />
      <h1>{title}</h1>
      <p className="muted">This review may have been removed, or the address may be incomplete.</p>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
