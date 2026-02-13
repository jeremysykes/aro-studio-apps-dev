import React, { Component, type ReactNode } from 'react';
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
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
          <p className="text-sm font-medium text-destructive">
            {this.props.moduleLabel} encountered an error
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-full">
            {this.state.error?.message}
          </p>
          <Button variant="outline" size="xs" onClick={this.handleReset}>
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
