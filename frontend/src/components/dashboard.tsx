'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowUpRightIcon as ArrowUpRight,
  InfoIcon as Info,
  PlusIcon as Plus,
  MagnifyingGlassIcon as Search,
  MagnifyingGlassMinusIcon as SearchX,
  XIcon as X,
} from '@phosphor-icons/react/ssr';
import { repository, dataMode } from '@/data/repository';
import { Button } from './ui/button';
import { ErrorState, LoadingState } from './data-state';
import { useRepository } from './use-repository';
import { DashboardSummary } from './dashboard-summary';
import { ReviewTable } from './review-table';

export function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const search = params.get('q') || '';
  const market = params.get('market') || '';
  const result = params.get('result') || '';
  const cursor = dataMode === 'live' ? params.get('cursor') || '' : '';
  const hasFilters = !!(search || market || result);
  const { data, loading, error, retry } = useRepository(
    () =>
      Promise.all([
        repository.listReviews({ search, market, result, cursor }),
        repository.listReviews(),
      ]),
    [search, market, result, cursor],
  );
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    next.delete('cursor');
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(null, '', `${pathname}${next.size ? `?${next}` : ''}`);
  }
  const clear = () => router.replace('/dashboard', { scroll: false });
  const all = data?.[1].items ?? [];
  const filtered = data?.[0].items ?? [];
  return (
    <div className="dashboard-page">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">Review workspace</span>
          <h1>Packaging reviews</h1>
          <p>Track artwork versions, inspect findings, and keep reviews moving.</p>
        </div>
        <Button asChild>
          <Link href="/checks/new">
            <Plus aria-hidden="true" size={17} />
            New check
          </Link>
        </Button>
      </div>
      {!error && dataMode === 'demo' && (
        <>
          <DashboardSummary
            reviews={all}
            selected={result}
            onSelect={(value) => setFilter('result', value)}
            loading={loading}
          />
          <p className="summary-caption">
            Workspace totals<span>Choose a result to focus your review.</span>
          </p>
        </>
      )}
      <section className="panel review-ledger" aria-label="Review list">
        <div className="ledger-heading">
          <div>
            <h2>Review library</h2>
            <span>Latest artwork versions</span>
          </div>
          {dataMode === 'demo' && (
            <Link href="/checks/mori-strawberry" className="sample-shortcut">
              Explore sample
              <ArrowUpRight aria-hidden="true" size={14} />
            </Link>
          )}
        </div>
        <div className="filter-bar">
          <div className="field search-field">
            <label htmlFor="review-search">Search reviews</label>
            <div className="search-wrap">
              <Search aria-hidden="true" size={17} />
              <input
                type="search"
                className="text-input"
                id="review-search"
                placeholder="Search by product name…"
                value={search}
                onChange={(e) => setFilter('q', e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="market-filter">Market</label>
            <select
              id="market-filter"
              value={market}
              onChange={(e) => setFilter('market', e.target.value)}
            >
              <option value="">All markets</option>
              <option>Japan</option>
              <option>United States</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="result-filter">Result</label>
            <select
              id="result-filter"
              value={result}
              onChange={(e) => setFilter('result', e.target.value)}
            >
              <option value="">All results</option>
              {['Issues found', 'Review incomplete', 'Selected checks passed', 'Cancelled'].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </div>
        </div>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} retry={retry} headingLevel="h2" />
        ) : (
          <>
            <div className="table-meta">
              <div className="table-result-count">
                <span role="status">
                  {filtered.length} {filtered.length === 1 ? 'review' : 'reviews'}
                  {dataMode === 'live' ? ' on this page' : ''}
                </span>
                {hasFilters && dataMode === 'demo' && (
                  <span className="filtered-from">of {all.length} in this workspace</span>
                )}
              </div>
              <div className="table-meta-actions">
                {hasFilters ? (
                  <Button variant="ghost" onClick={clear}>
                    <X aria-hidden="true" size={14} />
                    Reset filters
                  </Button>
                ) : (
                  <span>
                    {dataMode === 'demo'
                      ? 'Updated artwork · simulated assessments'
                      : 'Uploaded artwork · selected checks'}
                  </span>
                )}
              </div>
            </div>
            {filtered.length ? (
              <ReviewTable reviews={filtered} />
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <SearchX aria-hidden="true" size={26} />
                </span>
                <h2>{hasFilters ? 'No matching reviews' : 'No reviews yet'}</h2>
                <p className="muted small">
                  {hasFilters
                    ? 'Try a different product name or reset your filters.'
                    : 'Upload artwork and a specification to begin.'}
                </p>
                {hasFilters ? (
                  <Button variant="outline" onClick={clear}>
                    Clear filters
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/checks/new">New check</Link>
                  </Button>
                )}
              </div>
            )}
            {dataMode === 'live' && (cursor || data?.[0].nextCursor) && (
              <div className="button-row" style={{ padding: 20 }} aria-label="Review pages">
                {cursor && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const next = new URLSearchParams(params.toString());
                      next.delete('cursor');
                      router.push(`/dashboard?${next}`);
                    }}
                  >
                    First page
                  </Button>
                )}
                {data?.[0].nextCursor && (
                  <Button
                    onClick={() => {
                      const next = new URLSearchParams(params.toString());
                      next.set('cursor', data[0].nextCursor!);
                      router.push(`/dashboard?${next}`);
                    }}
                  >
                    Next page
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </section>
      <div className="dashboard-scope-note">
        <Info aria-hidden="true" size={16} />
        <p>
          <strong>A focused review, with context.</strong>{' '}
          {dataMode === 'demo'
            ? 'Demo data uses fictional examples.'
            : 'Live checks use your uploaded documents.'}
          Selected checks do not establish legal approval.
        </p>
      </div>
    </div>
  );
}
