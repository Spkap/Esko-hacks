'use client';
import { useEffect, useState } from 'react';
export function useRepository<T>(loader: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({
    loading: true,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setState({ loading: true });
      })
      .then(loader)
      .then((data) => {
        if (active) setState({ loading: false, data });
      })
      .catch((error) => {
        if (active)
          setState({
            loading: false,
            error: error instanceof Error ? error.message : 'Please try again.',
          });
      });
    return () => {
      active = false;
    };
    // Caller supplies primitive dependencies; loader intentionally captures their current values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);
  useEffect(() => {
    const reset = () => setAttempt((n) => n + 1);
    window.addEventListener('wavelength-reset', reset);
    return () => window.removeEventListener('wavelength-reset', reset);
  }, []);
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
