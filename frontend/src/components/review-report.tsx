'use client';
import { AIExplanation } from './ai-explanation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon as ArrowLeft,
  FileTextIcon as FileText,
  InfoIcon as Info,
} from '@phosphor-icons/react/ssr';
import { repository, dataMode } from '@/data/repository';
import { summarize } from '@/domain/summary';
import { useRepository } from './use-repository';
import { LoadingState, ErrorState, MissingState } from './data-state';
import { StatusBadge } from './status-badge';
import { resultLabels } from './finding-list';
export function ReviewReport({ reviewId }: { reviewId: string }) {
  const params = useSearchParams();
  const requestedRun = dataMode === 'live' ? params.get('run') : null;
  const { data, loading, error, retry } = useRepository(async () => {
    const detail = await repository.getReview(reviewId);
    const run =
      dataMode === 'live' && (requestedRun || detail?.review.latestRunId)
        ? await repository.getRun(requestedRun || detail!.review.latestRunId!)
        : null;
    if (requestedRun && (!run || run.reviewId !== reviewId))
      throw new Error('This analysis run does not belong to this review.');
    return {
      detail,
      run,
      report:
        (requestedRun || detail?.review.latestRunId) && (!run || run.status === 'completed')
          ? await repository.getReport(requestedRun || detail!.review.latestRunId!)
          : null,
    };
  }, [reviewId, requestedRun]);
  if (loading) return <LoadingState label="Loading report" />;
  if (error) return <ErrorState message={error} retry={retry} />;
  if (!data?.detail) return <MissingState />;
  const { detail, report, run } = data;
  if (!report)
    return (
      <div className="panel state-panel">
        <h1>No report yet</h1>
        <p>
          {run
            ? `This run is ${run.status}. A report is available only after successful processing.`
            : 'No checks have been run for this review.'}
        </p>
        <Link className="link" href={`/checks/${reviewId}`}>
          Return to artwork
        </Link>
      </div>
    );
  const summary = summarize(report.run.status, report.checks);
  const artwork = detail.artworkVersions.find((a) => a.id === report.run.artworkVersionId);
  return (
    <>
      <Link
        className="back-link"
        href={`/checks/${reviewId}${dataMode === 'live' ? `?run=${report.run.id}` : ''}`}
      >
        <ArrowLeft aria-hidden="true" size={14} />
        Back to artwork review
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Selected checks only
          </div>
          <h1>Review report</h1>
          <p>
            {detail.review.productName} · {detail.review.market} · Artwork V{artwork?.version}
          </p>
        </div>
        <FileText aria-hidden="true" size={32} className="muted" />
      </div>
      <section className="panel report-overview">
        <div className="report-overview-heading">
          <h2>Assessment summary</h2>
          <StatusBadge label={summary.label} />
        </div>
        <p className="muted">{report.reviewedScope}</p>
        {report.run.status !== 'completed' && (
          <p className="execution-notice">
            <strong>{summary.label}.</strong> This run is incomplete. Passed checks do not mean the
            review has passed.
          </p>
        )}
        <dl className="report-counts">
          <div>
            <dt>Issues</dt>
            <dd>{summary.counts.fail}</dd>
          </div>
          <div>
            <dt>Need review</dt>
            <dd>{summary.counts.needs_review}</dd>
          </div>
          <div>
            <dt>Passed</dt>
            <dd>{summary.counts.pass}</dd>
          </div>
          <div>
            <dt>Not checked</dt>
            <dd>{summary.counts.not_checked}</dd>
          </div>
        </dl>
        <div className="report-versions">
          <p>
            <strong>Run</strong> <code>{report.run.id}</code>
          </p>
          <p>
            <strong>Artwork</strong> {artwork?.filename} · V{artwork?.version}
          </p>
          <p>
            <strong>Checklist</strong> {report.run.ruleSetVersion} · {report.run.mode}
          </p>
          <p>
            <strong>References</strong>{' '}
            {detail.references
              .filter((r) => report.run.referenceIds.includes(r.id))
              .map((r) => `${r.title} (r${r.revision}, ${r.approvalStatus})`)
              .join('; ')}
          </p>
        </div>
      </section>
      <section className="report-checks" aria-label="Check results">
        <div className="section-heading">
          <h2>Selected check results</h2>
          <span className="muted small">{report.checks.length} checks</span>
        </div>
        {report.checks.length ? (
          report.checks.map((check, index) => {
            const decision = report.decisions.find((d) => d.checkId === check.id);
            const source = detail.references.find((r) => r.id === check.evidence.sourceId);
            return (
              <article className="panel report-check" key={check.id}>
                <div className="report-check-header">
                  <h3>
                    <span className="muted">{String(index + 1).padStart(2, '0')} / </span>
                    {check.title}
                  </h3>
                  <StatusBadge label={resultLabels[check.result]} />
                </div>
                <dl className="report-detail">
                  <div>
                    <dt>Observed</dt>
                    <dd>{check.observed}</dd>
                  </div>
                  <div>
                    <dt>Expected</dt>
                    <dd>{check.expected}</dd>
                  </div>
                  <div>
                    <dt>Next step</dt>
                    <dd>{check.suggestedCorrection}</dd>
                  </div>
                  <div>
                    <dt>Applicability</dt>
                    <dd>
                      {check.applicability.replaceAll('_', ' ')}
                      {check.reason ? ` · ${check.reason}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>
                      Page {check.evidence.page} · {check.evidence.inspectedPanels}
                    </dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>
                      {source ? (
                        <a className="link" href={source.url} target="_blank" rel="noreferrer">
                          {source.title}
                        </a>
                      ) : (
                        'Unavailable'
                      )}{' '}
                      · {check.evidence.sourceLocation}
                    </dd>
                  </div>
                  <div>
                    <dt>Decision</dt>
                    <dd>
                      {decision
                        ? `${decision.action} · ${decision.actor} · ${new Date(decision.timestamp).toISOString()}`
                        : 'Open'}
                      {decision?.reason && <p>{decision.reason}</p>}
                    </dd>
                  </div>
                </dl>
                <AIExplanation check={check} />
                <Link
                  className="source-link"
                  href={`/checks/${reviewId}?check=${check.id}${dataMode === 'live' ? `&run=${report.run.id}` : ''}`}
                >
                  Inspect this finding →
                </Link>
              </article>
            );
          })
        ) : (
          <div className="panel state-panel">
            <h3>No check results</h3>
            <p className="muted">No check results are available for this run.</p>
          </div>
        )}
      </section>
      <section className="panel report-scope">
        <h2>Outside this review</h2>
        <ul>
          {report.uncheckedRequirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="scope-note">
          <Info aria-hidden="true" size={15} />
          {dataMode === 'demo' ? 'Simulated checks' : 'Selected checks'} do not establish legal
          approval. Reviewer decisions do not change the original results.
        </p>
      </section>
    </>
  );
}
