import React from 'react';
import { Alert, AlertDescription, AlertTitle, AlertTriangleIcon } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import type { ConnectionStatus } from '../hooks/useConnectionStatus';

export interface ConnectionStatusBarProps {
  status: ConnectionStatus;
  onRetry?: () => void;
}

/**
 * Shows a warning bar only when the backend is completely unreachable.
 * Returns `null` when connected (zero visual footprint).
 */
export function ConnectionStatusBar({
  status,
  onRetry,
}: ConnectionStatusBarProps) {
  if (status === 'connected') return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangleIcon />
      <AlertTitle>Failed to fetch</AlertTitle>
      <AlertDescription>
        Something went wrong. Try again or restart the app.
        {onRetry && (
          <Button type="button" variant="outline" size="xs" onClick={onRetry} className="mt-2 block">
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
