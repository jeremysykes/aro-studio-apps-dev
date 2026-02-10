import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6" role="alert">
          <h1 className="text-lg font-semibold text-destructive">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
