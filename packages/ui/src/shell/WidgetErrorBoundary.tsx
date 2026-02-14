import React, { Component, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';

interface Props {
  moduleLabel: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Per-widget error boundary. Prevents one crashing widget
 * from taking down the entire dashboard grid.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
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
        <div className="flex flex-col items-center justify-center h-full p-4">
          <Alert variant="destructive" className="max-w-full">
            <AlertTitle>{this.props.moduleLabel} encountered an error</AlertTitle>
            <AlertDescription className="truncate">
              {this.state.error?.message}
            </AlertDescription>
            <Button variant="outline" size="xs" onClick={this.handleReset} className="mt-2">
              Retry
            </Button>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}
