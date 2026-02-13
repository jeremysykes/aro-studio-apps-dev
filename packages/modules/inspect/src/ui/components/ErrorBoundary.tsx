import React, { Component, type ReactNode } from 'react';
import { Alert, Button } from '@aro/desktop/components';

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * Module-level error boundary for Inspect.
 * Catches render errors in the inspect component tree and displays
 * a recoverable error panel instead of crashing the entire app.
 */
export class InspectErrorBoundary extends Component<Props, State> {
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
		if (this.state.hasError && this.state.error) {
			return (
				<div
					className='flex flex-col items-center justify-center p-8 gap-4'
					role='alert'
				>
					<Alert variant='destructive' className='max-w-lg'>
						<p className='font-medium'>Inspect encountered an error</p>
						<p className='mt-1 text-xs text-muted-foreground'>
							{this.state.error.message}
						</p>
					</Alert>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={this.handleReset}
					>
						Try again
					</Button>
				</div>
			);
		}
		return this.props.children;
	}
}
