import React, { useEffect } from 'react';
import {
	Alert,
	AlertDescription,
	AlertTitle,
	AlertTriangleIcon,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	TooltipProvider,
} from '@aro/ui/components';
import { useConnectionStatus } from '@aro/ui/hooks';
import { ConnectionStatusBar } from '@aro/ui/shell';
import { useInspectStore, initInspectSubscriptions } from './store';
import { WorkspaceCard } from './components/WorkspaceCard';
import { SetupView } from './views/SetupView';
import { RunView } from './views/RunView';
import { ReportView } from './views/ReportView';
import { InspectErrorBoundary } from './components/ErrorBoundary';
import { hasAtLeastOneSource } from './lib/config';
import type { View } from './types';

const VIEW_TABS: Array<{ id: View; label: string }> = [
	{ id: 'setup', label: 'Setup' },
	{ id: 'run', label: 'Logs' },
	{ id: 'report', label: 'Reports' },
];

export default function Inspect() {
	const view = useInspectStore((s) => s.view);
	const setView = useInspectStore((s) => s.setView);
	const config = useInspectStore((s) => s.config);
	const workspacePath = useInspectStore((s) => s.workspacePath);
	const error = useInspectStore((s) => s.error);
	const fetchSeq = useInspectStore((s) => s._fetchSeq);
	const loadRuns = useInspectStore((s) => s._loadRuns);

	const { status, reportSuccess, reportFailure } = useConnectionStatus();

	useEffect(() => {
		const cleanup = initInspectSubscriptions();
		return cleanup;
	}, []);

	// Bridge store fetch status → connection hook
	// _fetchSeq: positive = success, negative = failure, 0 = no fetch yet
	useEffect(() => {
		if (fetchSeq === 0) return;
		if (fetchSeq > 0) reportSuccess();
		else reportFailure();
	}, [fetchSeq, reportSuccess, reportFailure]);

	return (
		<InspectErrorBoundary>
			<TooltipProvider delayDuration={300}>
				<main className='p-6 font-sans' role='main'>
					<ConnectionStatusBar status={status} onRetry={loadRuns} />

					{/* Title */}
					<div className='mb-4 pb-4 border-b border-[#E4E4E7]'>
						<h1 className='flex items-center gap-1'>
							<span className='text-xl font-semibold'>Aro Inspect</span>
							<span className='text-sm text-zinc-500'>
								Design system inventory & health
							</span>
						</h1>
					</div>

					{/* Workspace picker */}
					<div className='mb-6 w-fit'>
						<p className='mb-2 text-sm text-zinc-500'>
							Set your workspace to where you want to Inspect.
						</p>
						<WorkspaceCard />
					</div>

					{workspacePath ? (
						<>
							{error && (
								<Alert variant='destructive' className='mb-4'>
									<AlertTriangleIcon />
									<AlertTitle>Error</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<Tabs
								value={view}
								onValueChange={(value) => setView(value as View)}
							>
								<TabsList size='xs' className='mb-3' aria-label='Inspect views'>
									{VIEW_TABS.map((tab) => (
										<TabsTrigger key={tab.id} value={tab.id} size='xs'>
											{tab.label}
										</TabsTrigger>
									))}
								</TabsList>
								{view === 'setup' && (
									<p className='mb-4 text-sm text-zinc-500'>
										Configure at least one source (Figma, Code tokens, or
										Storybook) to enable Run Inspect.
									</p>
								)}
								{view === 'run' && (
									<p className='mb-4 text-sm text-zinc-500'>
										Run Inspect from the Setup tab, then select a run here to
										view logs and progress.
									</p>
								)}
								{view === 'report' && (
									<p className='mb-4 text-sm text-zinc-500'>
										Run Inspect from the Setup tab, then select a run here to
										view reports.
									</p>
								)}
								<TabsContent value='setup'>
									<SetupView
										hasAtLeastOneSource={hasAtLeastOneSource(config)}
										hasWorkspace={!!workspacePath}
									/>
								</TabsContent>
								<TabsContent value='run'>
									<RunView />
								</TabsContent>
								<TabsContent value='report'>
									<ReportView />
								</TabsContent>
							</Tabs>
						</>
					) : (
						<p className='text-sm text-zinc-500'>
							Configure at least one source to enable Run Inspect (Figma, Code
							tokens, or Storybook).
						</p>
					)}
				</main>
			</TooltipProvider>
		</InspectErrorBoundary>
	);
}
