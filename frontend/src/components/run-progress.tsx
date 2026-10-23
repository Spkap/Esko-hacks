'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { repository } from '@/data/repository';
import type { Run } from '@/domain/types';
import { Button } from './ui/button';
export function RunProgress({
  runId,
  reviewId,
  onDone,
  onStartAnother,
}: {
  runId: string;
  reviewId: string;
  onDone?: () => void;
  onStartAnother?: () => void;
}) {
  const router = useRouter();
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  const [run, setRun] = useState<Run>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [restarting, setRestarting] = useState(false);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const start = Date.now();
    let count = 0;
    async function poll() {
      try {
        const current = await repository.getRun(runId);
        if (!active) return;
        if (!current) throw new Error('Analysis run was not found.');
        setRun(current);
        if (current.status === 'completed') {
          done.current?.();
          router.push(`/checks/${reviewId}`);
          return;
        }
        if (current.status === 'failed')
          throw new Error(
            current.error?.message || 'Analysis failed. Review the inputs and start another check.',
          );
        if (current.status === 'cancelled') return;
        if (Date.now() - start >= 300000)
          throw new Error(
            'Analysis is taking longer than five minutes. Resume checking status or cancel this run.',
          );
        timer = setTimeout(poll, Math.min(1000 + count++ * 1000, 5000));
      } catch (cause) {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Could not read analysis status.');
      }
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [runId, reviewId, attempt, router]);
  return (
    <section className="panel report-overview" aria-label="Analysis progress">
      <h2>Artwork analysis</h2>
      <p role="status" aria-live="polite">
        {run?.status || 'Connecting'}
        {run && ['queued', 'extracting', 'checking'].includes(run.status) ? '…' : ''}
      </p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="button-row">
        {run && ['failed', 'cancelled'].includes(run.status) && (
          <Button
            disabled={restarting}
            onClick={async () => {
              setRestarting(true);
              setError('');
              try {
                await repository.startRun({
                  reviewId: run.reviewId,
                  artworkVersionId: run.artworkVersionId,
                  referenceIds: run.referenceIds,
                  selectedRuleIds: run.selectedRuleIds,
                  ruleSetVersion: run.ruleSetVersion,
                  requestKey: crypto.randomUUID(),
                });
                router.replace(`/checks/${reviewId}`);
                done.current?.();
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : 'Could not restart analysis.');
                setRestarting(false);
              }
            }}
          >
            {restarting ? 'Restarting…' : 'Retry analysis with saved inputs'}
          </Button>
        )}

        {error && (
          <Button
            onClick={() => {
              setError('');
              setAttempt((n) => n + 1);
            }}
          >
            Retry status
          </Button>
        )}
        {(!run || !['completed', 'cancelled', 'failed'].includes(run.status)) && (
          <Button
            variant="outline"
            disabled={cancelling}
            onClick={async () => {
              setCancelling(true);
              try {
                setRun(await repository.cancelRun(runId));
                setError('');
                setAttempt((n) => n + 1);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setCancelling(false);
              }
            }}
          >
            Cancel analysis
          </Button>
        )}
        {onStartAnother ? (
          <Button variant="ghost" onClick={onStartAnother}>
            Start another check
          </Button>
        ) : (
          <Button asChild variant="ghost">
            <Link href="/checks/new">Start another check</Link>
          </Button>
        )}
      </div>
      <p className="small muted">
        Only selected checks are covered. You can leave this page; the server keeps the run.
      </p>
    </section>
  );
}
