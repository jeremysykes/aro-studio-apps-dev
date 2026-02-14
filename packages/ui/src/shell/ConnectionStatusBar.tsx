import React from 'react';
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
    <div
      role="status"
      className="flex items-center gap-3 px-4 py-2 mb-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md"
    >
      <span className="flex-1">
        Something went wrong. Try again or restart the app.
      </span>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={onRetry}
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
