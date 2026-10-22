'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowUpRightIcon as ArrowUpRight,
  BookOpenTextIcon as BookOpen,
  ScanIcon as ScanLine,
} from '@phosphor-icons/react/ssr';
import { repository } from '@/data/repository';
import { useRepository } from '../use-repository';
import { ArtworkViewer } from '../artwork-viewer';
import { FindingList, resultLabels } from '../finding-list';
import { StatusBadge } from '../status-badge';
import { ErrorState, LoadingState } from '../data-state';
export function SamplePreview() {
  const [selectedId, setSelectedId] = useState('mori-strawberry-quantity');
  const { data, loading, error, retry } = useRepository(async () => {
    const detail = await repository.getReview('mori-strawberry');
    const report = detail?.review.latestRunId
      ? await repository.getReport(detail.review.latestRunId)
      : null;
    return { detail, report };
  }, []);
  if (loading)
    return (
      <div className="sample-preview-loading">
        <LoadingState label="Loading interactive sample" />
      </div>
    );
  if (error)
    return (
      <div className="sample-preview-loading">
        <ErrorState message={error} retry={retry} headingLevel="h2" />
      </div>
    );
  if (!data?.detail || !data.report)
    return <p>Sample unavailable. Open the workspace to try again.</p>;
  const { detail, report } = data;
  const artwork = detail.artworkVersions.find((a) => a.id === report.run.artworkVersionId)!;
  const selected = report.checks.find((c) => c.id === selectedId) ?? report.checks[0];
  const source = detail.references.find((r) => r.id === selected.evidence.sourceId);
  return (
    <section className="landing-preview" aria-label="Interactive sample review">
      <div className="preview-topline">
        <span>
          <ScanLine aria-hidden="true" size={16} />
          <strong>MORI Strawberry</strong>
          <span className="preview-market">Japan / Artwork V1</span>
        </span>
        <span className="demo-label">Demo data</span>
      </div>
      <div className="preview-grid">
        <div className="preview-artwork">
          <ArtworkViewer
            artwork={artwork}
            checks={report.checks}
            selected={selected}
            onSelect={setSelectedId}
          />
          <div className="preview-artwork-note">
            <span className="eyebrow">One artwork. Every detail connected.</span>
            <p>
              Select a finding to see what was observed, the reference behind it, and what to do
              next.
            </p>
          </div>
        </div>
        <div className="preview-findings">
          <div className="preview-findings-heading">
            <h2>Selected checks</h2>
            <span>{report.checks.length} checks</span>
          </div>
          <FindingList checks={report.checks} selectedId={selected.id} onSelect={setSelectedId} />
          <div className="preview-evidence" aria-live="polite" data-testid="landing-evidence">
            <div className="evidence-topline">
              <span className="eyebrow">The evidence</span>
              <StatusBadge label={resultLabels[selected.result]} />
            </div>
            <h3>{selected.title}</h3>
            <p>{selected.observed}</p>
            <div className="preview-source">
              <span>
                <BookOpen aria-hidden="true" size={14} />
                {selected.evidence.sourceLocation}
              </span>
              <blockquote>{selected.evidence.excerpt}</blockquote>
              {source && (
                <a href={source.url} target="_blank" rel="noreferrer">
                  Read source
                  <ArrowUpRight aria-hidden="true" size={14} />
                  <span className="sr-only"> in a new tab</span>
                </a>
              )}
            </div>
            <div className="preview-correction">
              <span className="eyebrow">Next step</span>
              <p>{selected.suggestedCorrection}</p>
            </div>
            <Link
              className="preview-review-link"
              href={`/checks/mori-strawberry?check=${selected.id}`}
            >
              Open full review
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </div>
      <div className="preview-bottom">
        <span>Fictional artwork · simulated findings · selected scope only</span>
        <span>Human judgment stays in the loop.</span>
      </div>
    </section>
  );
}
