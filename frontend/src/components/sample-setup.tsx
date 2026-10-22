'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FileTextIcon,
  FlaskIcon,
  CircleDashedIcon,
} from '@phosphor-icons/react/ssr';
import { sampleScenarios } from '@/demo/scenarios';
import { repository } from '@/data/repository';
import { useRepository } from './use-repository';
import { Button } from './ui/button';
import { ErrorState, LoadingState } from './data-state';
import './sample-setup.css';
const steps = [
  'Reading sample artwork',
  'Comparing sample requirements',
  'Preparing seeded findings',
];
export function SampleSetup({ initialId, onExit }: { initialId: string; onExit: () => void }) {
  const router = useRouter();
  const [sampleId, setSampleId] = useState(initialId);
  const [stage, setStage] = useState(-1);
  const [error, setError] = useState('');
  const attempt = useRef(0);
  const running = useRef(false);
  const sample = sampleScenarios.find((item) => item.id === sampleId) ?? sampleScenarios[0];
  const {
    data,
    loading,
    error: loadError,
    retry,
  } = useRepository(async () => {
    const detail = await repository.getReview(sample.id);
    const report = detail?.review.latestRunId
      ? await repository.getReport(detail.review.latestRunId)
      : null;
    if (!detail || !report) throw new Error('Sample files are unavailable. Try again.');
    return { detail, report };
  }, [sample.id]);
  useEffect(() => {
    const cancel = () => {
      attempt.current++;
      running.current = false;
      setStage(-1);
      setError('');
    };
    window.addEventListener('wavelength-reset', cancel);
    return () => {
      // This ref is an async cancellation token, not a DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      attempt.current++;
      running.current = false;
      window.removeEventListener('wavelength-reset', cancel);
    };
  }, []);
  async function start() {
    if (!data || running.current) return;
    running.current = true;
    const currentAttempt = ++attempt.current;
    setError('');
    try {
      for (let step = 0; step < steps.length; step++) {
        if (currentAttempt !== attempt.current) return;
        setStage(step);
        await new Promise((resolve) => setTimeout(resolve, 650));
      }
      if (currentAttempt !== attempt.current) return;
      const seed = data.report.run;
      await repository.startRun({
        reviewId: sample.id,
        artworkVersionId: seed.artworkVersionId,
        referenceIds: seed.referenceIds,
        ruleSetVersion: seed.ruleSetVersion,
        selectedRuleIds: seed.selectedRuleIds,
        requestKey: crypto.randomUUID(),
      });
      if (currentAttempt === attempt.current) router.push(`/checks/${sample.id}`);
    } catch (cause) {
      if (currentAttempt === attempt.current) {
        setError(
          cause instanceof Error ? cause.message : 'Could not prepare the sample. Try again.',
        );
        setStage(-1);
      }
    } finally {
      if (currentAttempt === attempt.current) running.current = false;
    }
  }
  return (
    <section className="sample-setup" aria-label="Sample check setup">
      <div className="sample-mode-bar">
        <span>
          <FlaskIcon weight="duotone" size={17} aria-hidden="true" /> Sample mode · predetermined
          findings
        </span>
        <Button variant="ghost" onClick={onExit} disabled={stage >= 0}>
          Use my own files
        </Button>
      </div>
      <div className="new-check-layout">
        <div className="panel sample-setup-form">
          <div className="form-section-heading">
            <span className="step-index">01</span>
            <div>
              <h2>Choose a sample</h2>
              <p className="small muted">Artwork, product details, and references are ready.</p>
            </div>
          </div>
          <div className="field">
            <label htmlFor="sample-scenario">Sample scenario</label>
            <select
              id="sample-scenario"
              value={sample.id}
              disabled={stage >= 0}
              onChange={(event) => {
                setSampleId(event.target.value);
                setError('');
              }}
            >
              {sampleScenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <dl className="sample-product-details">
            <div>
              <dt>Product</dt>
              <dd>{sample.name}</dd>
            </div>
            <div>
              <dt>Market</dt>
              <dd>{sample.market}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{sample.category}</dd>
            </div>
            <div>
              <dt>Artwork</dt>
              <dd>Version {sample.version}</dd>
            </div>
          </dl>
          <div className="form-section-heading">
            <span className="step-index">02</span>
            <div>
              <h2>Included files</h2>
              <p className="small muted">Fixed inputs keep this demo repeatable.</p>
            </div>
          </div>
          {loading ? (
            <LoadingState label="Loading sample files" />
          ) : loadError ? (
            <ErrorState message={loadError} retry={retry} headingLevel="h2" />
          ) : (
            data && (
              <ul className="sample-file-list">
                <li>
                  <FileTextIcon weight="duotone" size={22} aria-hidden="true" />
                  <div>
                    <strong>Packaging artwork · V{sample.version}</strong>
                    <a href={data.detail.artworkVersions[0].url} target="_blank" rel="noreferrer">
                      {data.detail.artworkVersions[0].filename}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </div>
                  <CheckCircleIcon size={18} aria-label="Ready" />
                </li>
                {data.detail.references.map((reference) => (
                  <li key={reference.id}>
                    <FileTextIcon weight="duotone" size={22} aria-hidden="true" />
                    <div>
                      <strong>{reference.title}</strong>
                      <a href={reference.url} target="_blank" rel="noreferrer">
                        {reference.role.replaceAll('_', ' ')} · {reference.approvalStatus}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </div>
                    <CheckCircleIcon size={18} aria-label="Ready" />
                  </li>
                ))}
              </ul>
            )
          )}
          {stage >= 0 && (
            <div className="sample-progress" role="status" aria-live="polite">
              <strong>Simulated check</strong>
              <ol>
                {steps.map((step, index) => (
                  <li
                    key={step}
                    className={index === stage ? 'current' : index < stage ? 'done' : ''}
                  >
                    {index < stage ? (
                      <CheckCircleIcon size={18} aria-hidden="true" />
                    ) : (
                      <CircleDashedIcon size={18} aria-hidden="true" />
                    )}
                    <span>
                      {step}
                      {index === stage ? '…' : ''}
                    </span>
                  </li>
                ))}
              </ol>
              <p>Demonstration only. No live analysis is running.</p>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Button onClick={start} disabled={loading || !!loadError || stage >= 0}>
              {stage >= 0 ? 'Preparing sample…' : 'Run simulated check'}
              <ArrowRightIcon size={16} aria-hidden="true" />
            </Button>
            {stage >= 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  attempt.current++;
                  running.current = false;
                  setStage(-1);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
          <p className="small muted">
            Only supplied samples produce these findings. Your own uploads remain preview-only.
          </p>
        </div>
        <aside className="sample-setup-aside">
          <div className="panel sample-artwork-card">
            <span className="eyebrow">Sample artwork / V{sample.version}</span>
            <Image
              unoptimized
              src={sample.image}
              width={900}
              height={sample.id === 'dancingfish-granola' ? 753 : 620}
              alt={`${sample.name} sample artwork`}
            />
            <h2>{sample.name}</h2>
            <p>{sample.description}</p>
            <Link className="source-link" href={`/checks/${sample.id}`}>
              Open existing sample review <ArrowRightIcon size={14} aria-hidden="true" />
            </Link>
          </div>
          <p className="scope-note">
            Seeded results demonstrate the review workflow. They do not establish legal approval.
          </p>
        </aside>
      </div>
    </section>
  );
}
