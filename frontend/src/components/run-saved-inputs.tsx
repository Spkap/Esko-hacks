'use client';
import { useState } from 'react';
import type { ReviewDetail } from '@/domain/types';
import { repository } from '@/data/repository';
import { Button } from './ui/button';

export function RunSavedInputs({
  detail,
  onStarted,
}: {
  detail: ReviewDetail;
  onStarted: () => void;
}) {
  const [selected, setSelected] = useState(() => {
    const newest = new Map<string, string>();
    detail.references.forEach((reference) => newest.set(reference.role, reference.id));
    return [...newest.values()];
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="field">
      <fieldset disabled={busy}>
        <legend>References for the saved artwork</legend>
        {detail.references.length ? (
          detail.references.map((reference) => (
            <label key={reference.id} style={{ display: 'block', marginTop: 8 }}>
              <input
                type="checkbox"
                checked={selected.includes(reference.id)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, reference.id]
                      : current.filter((id) => id !== reference.id),
                  )
                }
              />{' '}
              {reference.title} · r{reference.revision} · {reference.approvalStatus}
            </label>
          ))
        ) : (
          <p>
            No reference has been saved. Add a specification in a new check to make a supported
            comparison.
          </p>
        )}
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button
        disabled={busy || !selected.length}
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          setError('');
          try {
            await repository.startRun({
              reviewId: detail.review.id,
              artworkVersionId: detail.review.currentArtworkVersionId,
              referenceIds: selected,
              ruleSetVersion: 'wavelength-core-v1',
              selectedRuleIds: ['net-quantity', 'required-statements', 'physical-type-size'],
              requestKey: crypto.randomUUID(),
            });
            onStarted();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not start analysis.');
            setBusy(false);
          }
        }}
      >
        {busy ? 'Starting analysis…' : 'Analyze saved inputs'}
      </Button>
      {!!detail.runs?.length && (
        <details>
          <summary>Earlier analysis runs</summary>
          <ul>
            {detail.runs.map((run) => (
              <li key={run.id}>
                <a className="link" href={`/checks/${detail.review.id}?run=${run.id}`}>
                  {run.status} · {new Date(run.createdAt).toLocaleString()}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
