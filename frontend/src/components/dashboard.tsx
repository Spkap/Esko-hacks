'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, FileImage, Info, Plus, Search, SearchX } from 'lucide-react';
import { repository } from '@/data/repository';
import { summarize } from '@/domain/summary';
import { Button } from './ui/button';
import { StatusBadge } from './status-badge';
import { ErrorState, LoadingState } from './data-state';
import { useRepository } from './use-repository';
import { Modal } from './modal';
export function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const search = params.get('q') || '';
  const market = params.get('market') || '';
  const result = params.get('result') || '';
  const [newCheck, setNewCheck] = useState(false);
  const { data, loading, error, retry } = useRepository(
    () =>
      Promise.all([repository.listReviews({ search, market, result }), repository.listReviews()]),
    [search, market, result],
  );
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(null, '', `${pathname}${next.size ? `?${next}` : ''}`);
  }
  const clear = () => router.replace('/dashboard', { scroll: false });
  const all = data?.[1].items ?? [];
  const filtered = data?.[0].items ?? [];
  const count = (label: string) =>
    all.filter((r) => summarize(r.run.status, r.checks).label === label).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>
            Your review workspace
          </div>
          <h1>Packaging reviews</h1>
          <p>A clear view of what’s ready, what needs attention, and why.</p>
        </div>
        <Button onClick={() => setNewCheck(true)}>
          <Plus size={17} />
          New check
        </Button>
      </div>
      {!loading && !error && (
        <div className="stats-line" aria-label="Workspace counts">
          <span>
            <strong>{all.length}</strong>total reviews
          </span>
          <span>
            <i className="count-dot danger" />
            <strong>{count('Issues found')}</strong>with issues
          </span>
          <span>
            <i className="count-dot warning" />
            <strong>{count('Review incomplete')}</strong>incomplete
          </span>
          <span>
            <i className="count-dot success" />
            <strong>{count('Selected checks passed')}</strong>selected checks passed
          </span>
        </div>
      )}
      <section className="panel" aria-label="Review list">
        <div className="filter-bar">
          <div className="field search-field">
            <label htmlFor="review-search">Search reviews</label>
            <div className="search-wrap">
              <Search size={17} />
              <input
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
                (r) => (
                  <option key={r}>{r}</option>
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
              <span role="status">
                {filtered.length} {filtered.length === 1 ? 'review' : 'reviews'}
              </span>
              <span>Latest artwork version · simulated assessments</span>
            </div>
            {filtered.length ? (
              <table className="review-table">
                <caption className="sr-only">
                  Packaging reviews with market, artwork version, result, and updated date
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Market</th>
                    <th scope="col">Artwork</th>
                    <th scope="col">Result</th>
                    <th scope="col">Updated</th>
                    <th scope="col">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((review) => (
                    <tr key={review.id} data-testid="review-row">
                      <td>
                        <div className="product-cell">
                          <div
                            className={`art-thumb ${review.market === 'United States' ? 'granola' : ''}`}
                          >
                            <FileImage size={21} />
                          </div>
                          <div>
                            <Link className="product-name" href={`/checks/${review.id}`}>
                              {review.productName}
                            </Link>
                            <p className="product-subtitle">{review.category}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="mobile-row-label">Market</span>
                        {review.market}
                      </td>
                      <td>
                        <span className="mobile-row-label">Artwork</span>
                        <span className="version-label">V{review.artwork.version}</span>
                      </td>
                      <td>
                        <span className="mobile-row-label">Result</span>
                        <StatusBadge label={summarize(review.run.status, review.checks).label} />
                      </td>
                      <td>
                        <span className="mobile-row-label">Updated</span>
                        <time dateTime={review.updatedAt}>22 Oct 2026</time>
                      </td>
                      <td>
                        <Link
                          href={`/checks/${review.id}`}
                          aria-label={`Open ${review.productName}`}
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <SearchX size={32} />
                <h2>No matching reviews</h2>
                <p className="muted small">Try a different product name or reset your filters.</p>
                <Button variant="outline" onClick={clear}>
                  Clear filters
                </Button>
              </div>
            )}
          </>
        )}
      </section>
      <p className="scope-note">
        <Info size={15} />
        Demo data uses temporary fictional examples. Selected checks are a limited review scope and
        do not establish legal approval.
      </p>
      {newCheck && (
        <Modal title="Start with a sample review" onClose={() => setNewCheck(false)}>
          <p>
            File upload and new-check creation are planned for M3. In this M1–M2 workspace, you can
            inspect the supplied sample artwork and its simulated findings.
          </p>
          <Button asChild>
            <Link href="/checks/mori-strawberry" onClick={() => setNewCheck(false)}>
              Open sample review
              <ArrowRight size={16} />
            </Link>
          </Button>
        </Modal>
      )}
    </>
  );
}
