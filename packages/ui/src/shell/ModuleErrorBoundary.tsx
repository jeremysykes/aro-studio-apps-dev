import React, { Component, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
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
        <div className="flex flex-col items-center justify-center h-full p-8">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>{this.props.moduleLabel} encountered an error</AlertTitle>
            <AlertDescription className="mt-1 truncate">
              {this.state.error?.message}
            </AlertDescription>
            <Button variant="outline" size="sm" onClick={this.handleReset} className="mt-3">
              Retry
            </Button>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}
