import React, { Component, type ReactNode } from 'react';
import { Button } from '../components/ui/button';

interface Props {
  moduleKey: string;
  moduleLabel: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Per-module error boundary. Wraps every module mount point so a render
 * crash in one module shows a graceful fallback — navigation and other
 * modules remain functional.
 */
export class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center"
          role="alert"
        >
          <div className="rounded-full bg-destructive/10 p-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">
              {this.props.moduleLabel} encountered an error
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md truncate">
              {this.state.error?.message}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
