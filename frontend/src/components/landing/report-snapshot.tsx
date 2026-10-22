'use client';
import Link from 'next/link';
import { ArrowUpRight, FileText } from 'lucide-react';
import { repository } from '@/data/repository';
import { summarize } from '@/domain/summary';
import { useRepository } from '../use-repository';
import { StatusBadge } from '../status-badge';
import { ErrorState, LoadingState } from '../data-state';
import { resultLabels } from '../finding-list';

/** The handoff preview uses the same report as the full sample review. */
export function ReportSnapshot() {
  const { data, loading, error, retry } = useRepository(async () => {
    const detail = await repository.getReview('mori-strawberry');
    const report = detail?.review.latestRunId
      ? await repository.getReport(detail.review.latestRunId)
      : null;
    return { detail, report };
  }, []);
  return (
    <section className="wl-report-stage" aria-label="Sample report preview">
      <div className="wl-report-back" aria-hidden="true" />
      <div className="wl-report-card">
        <div className="wl-report-chrome">
          <span>
            <FileText size={14} />
            REVIEW HANDOFF
          </span>
          <span>Sample report</span>
        </div>
        {loading ? (
          <LoadingState label="Loading sample report" />
        ) : error ? (
          <ErrorState message={error} retry={retry} headingLevel="h2" />
        ) : !data?.report || !data.detail ? (
          <p className="wl-report-empty">
            Sample report unavailable. Open the workspace to try again.
          </p>
        ) : (
          <>
            <div className="wl-report-title">
              <span className="wl-section-index">
                ARTWORK V1 / {data.detail.review.market.toUpperCase()}
              </span>
              <h3>{data.detail.review.productName}</h3>
              <StatusBadge label={summarize(data.report.run.status, data.report.checks).label} />
            </div>
            <div className="wl-report-checks">
              {data.report.checks.map((check) => (
                <Link key={check.id} href={`/checks/mori-strawberry?check=${check.id}`}>
                  <span className={`wl-report-result ${check.result}`}>
                    {resultLabels[check.result]}
                  </span>
                  <span>{check.title}</span>
                  <ArrowUpRight size={13} />
                </Link>
              ))}
            </div>
            <div className="wl-report-scope">
              <span className="wl-report-scope-dot" />
              <p>
                Selected checks only.
                <br />
                <span>Unselected requirements stay visible in the full report.</span>
              </p>
            </div>
            <Link className="wl-report-open" href="/checks/mori-strawberry/report">
              Open sample report
              <ArrowUpRight size={16} />
            </Link>
          </>
        )}
      </div>
      <p className="wl-report-caption">THE FINDING. THE REFERENCE. THE NEXT STEP.</p>
    </section>
  );
}
