import type { CheckResult } from '@/domain/types';
export function AIExplanation({ check }: { check: CheckResult }) {
  const ai = check.aiExplanation;
  if (!ai || ai.status === 'disabled' || ai.status === 'no_source') return null;
  return (
    <div className="source-panel">
      <h3>AI explanation · reviewer verification required</h3>
      <p>
        {ai.status === 'explained'
          ? ai.explanation
          : 'An AI explanation is unavailable for this finding. The evidence-based comparison above is still available.'}
      </p>
      {ai.status === 'explained' && (
        <p className="small muted">
          {ai.model} · {ai.promptVersion} · cites the reference evidence below
        </p>
      )}
    </div>
  );
}
