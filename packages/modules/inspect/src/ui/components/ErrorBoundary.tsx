import React, { Component, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle, AlertTriangleIcon, Button } from '@aro/ui/components';

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
				<div className='flex flex-col items-center justify-center p-8'>
					<Alert variant='destructive' className='max-w-lg'>
						<AlertTriangleIcon />
						<AlertTitle>Inspect encountered an error</AlertTitle>
						<AlertDescription>
							<p>{this.state.error.message}</p>
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={this.handleReset}
								className='mt-2'
							>
								Try again
							</Button>
						</AlertDescription>
					</Alert>
				</div>
			);
		}
		return this.props.children;
	}
}
