'use client';
import { useState } from 'react';
import { repository } from '@/data/repository';
import type { Run, ReferenceDocument } from '@/domain/types';
import { Button } from './ui/button';
export function RecheckArtwork({
  run,
  references,
  onStarted,
}: {
  run: Run;
  references: ReferenceDocument[];
  onStarted: () => void;
}) {
  const [file, setFile] = useState<File>();
  const [specification, setSpecification] = useState<File>();
  const [approval, setApproval] = useState<ReferenceDocument['approvalStatus']>('unknown');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function start() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const artworkId = file
        ? (await repository.addArtwork(run.reviewId, file)).id
        : run.artworkVersionId;
      let referenceIds = run.referenceIds;
      if (specification) {
        const updated = await repository.addReference(
          run.reviewId,
          specification,
          'product_specification',
          approval,
        );
        const oldProductIds = new Set(
          references.filter((r) => r.role === 'product_specification').map((r) => r.id),
        );
        referenceIds = [...run.referenceIds.filter((id) => !oldProductIds.has(id)), updated.id];
      }
      await repository.startRun({
        reviewId: run.reviewId,
        artworkVersionId: artworkId,
        referenceIds,
        ruleSetVersion: run.ruleSetVersion,
        selectedRuleIds: run.selectedRuleIds,
        requestKey: crypto.randomUUID(),
      });
      onStarted();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="field">
      <label htmlFor="replacement-artwork">Check a corrected artwork version</label>
      <input
        id="replacement-artwork"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        disabled={busy}
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <p className="small muted">
        The new run uses the same reference revisions. Earlier reports remain unchanged.
      </p>
      <details>
        <summary>Update the specification or rerun current inputs</summary>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="replacement-specification">
            Updated product specification (optional)
          </label>
          <input
            id="replacement-specification"
            type="file"
            accept=".json,.xlsx,.pdf"
            disabled={busy}
            onChange={(e) => setSpecification(e.target.files?.[0])}
          />
          <label htmlFor="replacement-approval">Updated specification approval status</label>
          <select
            id="replacement-approval"
            value={approval}
            disabled={busy}
            onChange={(e) => setApproval(e.target.value as ReferenceDocument['approvalStatus'])}
          >
            <option value="unknown">Unknown</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
          </select>
          <p className="small muted">
            An updated specification replaces earlier product specifications for the new run.
            Previous reports keep their original inputs.
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void start()}>
          Run selected inputs again
        </Button>
      </details>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <Button variant="outline" disabled={!file || busy} onClick={() => void start()}>
        {busy ? 'Uploading and starting…' : 'Upload new version and recheck'}
      </Button>
    </div>
  );
}
