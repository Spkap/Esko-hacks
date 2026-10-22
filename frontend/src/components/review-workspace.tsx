'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeftIcon as ArrowLeft,
  ArrowRightIcon as ArrowRight,
  FileTextIcon as FileText,
  InfoIcon as Info,
  StackIcon as Layers,
  ListChecksIcon as ListChecks,
} from '@phosphor-icons/react/ssr';
import { isSampleScenario } from '@/demo/scenarios';
import { repository } from '@/data/repository';
import { summarize } from '@/domain/summary';
import type { ReviewDecision } from '@/domain/types';
import { useRepository } from './use-repository';
import { ErrorState, LoadingState, MissingState } from './data-state';
import './sample-setup.css';
import { Button } from './ui/button';
import { StatusBadge } from './status-badge';
import { ArtworkViewer } from './artwork-viewer';
import { FindingList } from './finding-list';
import { EvidencePanel } from './evidence-panel';
export function ReviewWorkspace({ reviewId }: { reviewId: string }) {
  const params = useSearchParams();
  const [pane, setPane] = useState<'artwork' | 'findings'>('findings');
  const [updates, setUpdates] = useState<Record<string, ReviewDecision>>({});
  useEffect(() => {
    const clear = () => setUpdates({});
    window.addEventListener('wavelength-reset', clear);
    return () => window.removeEventListener('wavelength-reset', clear);
  }, []);
  const { data, loading, error, retry } = useRepository(async () => {
    const detail = await repository.getReview(reviewId);
    const report = detail?.review.latestRunId
      ? await repository.getReport(detail.review.latestRunId)
      : null;
    return { detail, report };
  }, [reviewId]);
  if (loading) return <LoadingState label="Loading artwork review" />;
  if (error) return <ErrorState message={error} retry={retry} />;
  if (!data?.detail) return <MissingState />;
  const { detail, report } = data;
  const artwork = detail.artworkVersions.find(
    (a) =>
      a.id === report?.run.artworkVersionId ||
      (!report && a.id === detail.review.currentArtworkVersionId),
  );
  if (!artwork) return <MissingState title="Artwork not found" />;
  if (!report)
    return (
      <>
        <Link href="/dashboard" className="back-link">
          <ArrowLeft aria-hidden="true" size={14} />
          All reviews
        </Link>
        <div className="page-heading">
          <div>
            <div className="eyebrow">Preview only</div>
            <h1>{detail.review.productName}</h1>
            <p>
              {detail.review.market} · {detail.review.category}
            </p>
          </div>
        </div>
        <section className="panel report-overview">
          <h2>No compliance checks have been run</h2>
          <p>
            Live analysis is not connected. Only file details are saved. Re-select your files to
            preview them again.
          </p>
          <p className="small muted">
            Artwork: {artwork.filename} · V{artwork.version}
          </p>
          <div className="button-row">
            <Button asChild>
              <Link href="/checks/new">Re-select files</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/checks/mori-strawberry">Explore sample findings</Link>
            </Button>
          </div>
        </section>
      </>
    );
  const checks = report?.checks ?? [];
  const selected = checks.find((c) => c.id === params.get('check')) ?? checks[0];
  const summary = report ? summarize(report.run.status, checks) : null;
  function select(id: string) {
    const next = new URLSearchParams(window.location.search);
    next.set('check', id);
    window.history.pushState(null, '', `?${next}`);
  }
  const decision = selected
    ? (updates[selected.id] ?? report?.decisions.find((d) => d.checkId === selected.id))
    : undefined;
  return (
    <>
      <Link href="/dashboard" className="back-link">
        <ArrowLeft aria-hidden="true" size={14} />
        All reviews
      </Link>
      <div className="page-heading review-heading">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Artwork review / {detail.review.market}
          </div>
          <h1>{detail.review.productName}</h1>
          <p>
            {detail.review.category}
            <span className="metadata-separator">/</span>Artwork V{artwork.version}
            <span className="metadata-separator">/</span>Illustrative review
          </p>
        </div>
        <Button asChild>
          <Link href={`/checks/${reviewId}/report`}>
            <FileText aria-hidden="true" size={16} />
            View report
          </Link>
        </Button>
      </div>
      {isSampleScenario(reviewId) && (
        <div className="sample-mode-bar">
          <span>
            <Info size={16} aria-hidden="true" />
            Seeded demo · predetermined findings
            {report.run.id.startsWith('sample-') ? ' · simulated check complete' : ''}
          </span>
          <Link className="source-link" href={`/checks/new?sample=${reviewId}`}>
            Run this sample again <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}
      <div className="review-summary" data-testid="assessment-summary">
        {summary && (
          <>
            <StatusBadge label={summary.label} />
            <span>
              {summary.counts.fail} {summary.counts.fail === 1 ? 'issue' : 'issues'}
            </span>
            <span>{summary.counts.needs_review} need review</span>
            <span>{summary.counts.pass} passed</span>
            <span>{summary.counts.not_checked} not checked</span>
          </>
        )}
        <span className="muted">Selected scope only</span>
      </div>
      {report && report.run.status !== 'completed' && (
        <div className="execution-notice" role="status">
          <Info aria-hidden="true" size={18} />
          <p>
            <strong>{summary?.label}.</strong> Partial results do not mean the review has passed.
          </p>
        </div>
      )}
      <div className="workspace-switch" aria-label="Review view">
        <Button
          variant={pane === 'artwork' ? 'default' : 'outline'}
          aria-pressed={pane === 'artwork'}
          onClick={() => setPane('artwork')}
        >
          <Layers aria-hidden="true" size={16} />
          Artwork
        </Button>
        <Button
          variant={pane === 'findings' ? 'default' : 'outline'}
          aria-pressed={pane === 'findings'}
          onClick={() => setPane('findings')}
        >
          <ListChecks aria-hidden="true" size={16} />
          Findings & evidence
        </Button>
      </div>
      <div className={`review-grid show-${pane}`}>
        <div className="artwork-column">
          <ArtworkViewer
            artwork={artwork}
            checks={checks}
            selected={selected}
            onSelect={(id) => {
              select(id);
              setPane('findings');
            }}
          />
          <div className="artwork-context">
            <span className="eyebrow">Version context</span>
            <p className="small muted">
              Results apply to artwork V{artwork.version} and checklist{' '}
              {report?.run.ruleSetVersion ?? 'not selected'}. Recheck a new artwork version after
              making corrections.
            </p>
            {reviewId === 'mori-strawberry' && (
              <Link className="source-link" href="/checks/new?sample=mori-corrected">
                Compare the corrected sample
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            )}
            {reviewId === 'mori-corrected' && (
              <>
                <p className="small muted">
                  V1’s missing statement is present in V2. This pass covers text presence and
                  quantity only; printed size and placement are still unverified.
                </p>
                <Link className="source-link" href="/checks/mori-strawberry">
                  Compare original V1
                  <ArrowLeft size={14} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </div>
        <section className="panel findings-column" aria-label="Findings and evidence">
          <div className="findings-heading">
            <h2>Selected checks</h2>
            <span className="version-label">{checks.length}</span>
          </div>
          {checks.length ? (
            <>
              <FindingList checks={checks} selectedId={selected?.id} onSelect={select} />
              {selected && (
                <EvidencePanel
                  key={selected.id}
                  check={selected}
                  source={detail.references.find((r) => r.id === selected.evidence.sourceId)}
                  decision={decision}
                  onDecision={(d) => setUpdates((current) => ({ ...current, [d.checkId]: d }))}
                />
              )}
            </>
          ) : (
            <div className="empty-state">
              <h2>No checks in this run</h2>
              <p className="muted">There is no assessment to display.</p>
            </div>
          )}
        </section>
      </div>
      <p className="scope-note">
        <Info aria-hidden="true" size={15} />
        Fictional demo with simulated findings, not verified market regulations. Only the supplied
        panels and selected checks are covered.
      </p>
    </>
  );
}
