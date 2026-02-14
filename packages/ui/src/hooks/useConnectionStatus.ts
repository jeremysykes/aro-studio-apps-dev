import { useState, useCallback, useRef } from 'react';

export type ConnectionStatus = 'connected' | 'disconnected';

export interface UseConnectionStatusOptions {
  /** Consecutive fetch failures before status becomes 'disconnected'. Default 3. */
  failureThreshold?: number;
}

export interface UseConnectionStatusReturn {
  status: ConnectionStatus;
  reportSuccess: () => void;
  reportFailure: () => void;
}

/**
 * Tracks whether the backend is reachable based on success/failure reports
 * from data-fetching code.
 *
 * Returns `'disconnected'` only after {@link failureThreshold} consecutive
 * failures (default 3). A single success resets to `'connected'`.
 */
export function useConnectionStatus(
  opts?: UseConnectionStatusOptions,
): UseConnectionStatusReturn {
  const failureThreshold = opts?.failureThreshold ?? 3;
  const failuresRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>('connected');

  const reportSuccess = useCallback(() => {
    failuresRef.current = 0;
    setStatus('connected');
  }, []);

  const reportFailure = useCallback(() => {
    failuresRef.current += 1;
    if (failuresRef.current >= failureThreshold) {
      setStatus('disconnected');
    }
  }, [failureThreshold]);

  // No interval needed — status only changes on explicit report calls
  // This avoids unnecessary re-renders and keeps the hook simple.

  return { status, reportSuccess, reportFailure };
}
