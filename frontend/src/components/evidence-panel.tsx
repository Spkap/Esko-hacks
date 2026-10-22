'use client';
import { useRef, useState } from 'react';
import { BookOpen, Check, ExternalLink, Info } from 'lucide-react';
import type { CheckResult, ReferenceDocument, ReviewDecision } from '@/domain/types';
import { repository } from '@/data/repository';
import { Button } from './ui/button';
import { StatusBadge } from './status-badge';
import { Modal } from './modal';
import { resultLabels } from './finding-list';
export function EvidencePanel({
  check,
  source,
  decision,
  onDecision,
}: {
  check: CheckResult;
  source?: ReferenceDocument;
  decision?: ReviewDecision;
  onDecision: (decision: ReviewDecision) => void;
}) {
  const [dismiss, setDismiss] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  async function save(action: ReviewDecision['action']) {
    if (busy) return;
    if (action === 'dismissed' && !reason.trim()) {
      setError('Enter a reason for dismissing this finding.');
      reasonRef.current?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      onDecision(
        await repository.recordDecision(check.id, action, action === 'dismissed' ? reason : ''),
      );
      setDismiss(false);
      setReason('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="evidence-panel"
      aria-label="Selected finding evidence"
      data-testid="selected-evidence"
    >
      <div className="evidence-topline">
        <span className="eyebrow">Selected finding</span>
        <StatusBadge label={resultLabels[check.result]} />
      </div>
      <h2>{check.title}</h2>
      <div className="evidence-values">
        <div>
          <h3>Observed</h3>
          <p>{check.observed}</p>
        </div>
        <div>
          <h3>Expected</h3>
          <p>{check.expected}</p>
        </div>
      </div>
      {check.reason && (
        <p className="uncertainty-note">
          <Info size={15} />
          <span>{check.reason}</span>
        </p>
      )}
      {check.applicability === 'uncertain' && (
        <p className="small" style={{ color: 'var(--warning)', marginBottom: 16 }}>
          Confirm whether this requirement applies.
        </p>
      )}
      <div className="source-panel">
        <div className="source-title">
          <BookOpen size={16} />
          <h3>Reference evidence</h3>
        </div>
        <p className="source-name">{source?.title || 'Source unavailable'}</p>
        <p className="small muted">{check.evidence.sourceLocation}</p>
        <blockquote>{check.evidence.excerpt}</blockquote>
        {source && (
          <>
            <p className="small muted">
              {source.role.replaceAll('_', ' ')} · revision {source.revision} ·{' '}
              {source.approvalStatus}
            </p>
            <a className="source-link" href={source.url} target="_blank" rel="noreferrer">
              Open source document
              <ExternalLink size={13} />
              <span className="sr-only"> in a new tab</span>
            </a>
          </>
        )}
      </div>
      <div className="correction-panel">
        <div className="eyebrow">Suggested next step</div>
        <p>{check.suggestedCorrection}</p>
      </div>
      <div className="decision-area">
        <p className="small muted" data-testid="decision-status" role="status">
          Reviewer decision:{' '}
          <strong>
            {decision
              ? { open: 'Open', acknowledged: 'Acknowledged', dismissed: 'Dismissed' }[
                  decision.action
                ]
              : 'Open'}
          </strong>
        </p>
        {decision?.reason && <p className="small decision-reason">{decision.reason}</p>}
        <div className="button-row">
          <Button
            variant="outline"
            disabled={busy || decision?.action === 'acknowledged'}
            onClick={() => save('acknowledged')}
          >
            <Check size={15} />
            Acknowledge
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setError('');
              setDismiss(true);
            }}
          >
            Dismiss
          </Button>
          {decision && decision.action !== 'open' && (
            <Button variant="ghost" disabled={busy} onClick={() => save('open')}>
              Reopen
            </Button>
          )}
        </div>
        <p className="decision-note">Your decision does not change the original result.</p>
        {error && !dismiss && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </div>
      {dismiss && (
        <Modal
          title="Dismiss this finding"
          onClose={() => {
            if (!busy) setDismiss(false);
          }}
        >
          <p>
            The check result stays {resultLabels[check.result].toLowerCase()}. Explain why you are
            dismissing it.
          </p>
          <div className="field">
            <label htmlFor="dismiss-reason">Reason for dismissal</label>
            <textarea
              id="dismiss-reason"
              ref={reasonRef}
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'reason-error' : undefined}
            />
          </div>
          {error && (
            <p role="alert" id="reason-error" className="form-error">
              {error}
            </p>
          )}
          <div className="button-row" style={{ marginTop: 20 }}>
            <Button disabled={busy} onClick={() => save('dismissed')}>
              {busy ? 'Saving dismissal…' : 'Save dismissal'}
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => setDismiss(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
