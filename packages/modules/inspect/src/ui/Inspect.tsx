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
			<div className='flex flex-col min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between gap-4 mb-3 pb-4 border-b border-[#E4E4E7]'>
					<div className='flex flex-col gap-1 min-w-0'>
						<h1 className='text-xl font-semibold'>Aro Inspect</h1>
						<p className='text-sm text-zinc-500'>
							Design system inventory & health
						</p>
					</div>
					<div className='min-w-0 min-[900px]:shrink-0'>
						<WorkspaceCard />
					</div>
				</div>

				{workspacePath && (
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
							className='mt-2'
						>
							<TabsList size='xs' className='mb-3' aria-label='Inspect views'>
								{VIEW_TABS.map((tab) => (
									<TabsTrigger key={tab.id} value={tab.id} size='xs'>
										{tab.label}
									</TabsTrigger>
								))}
							</TabsList>
							{view === 'run' && (
								<p className='mt-2 mb-4 text-sm text-zinc-500'>
									Run Inspect from the Setup tab, then select a run here to view
									logs and progress.
								</p>
							)}
							{view === 'report' && (
								<p className='mt-2 mb-4 text-sm text-zinc-500'>
									Select a completed run to view its health report, or export to
									CSV, Markdown, or PDF.
								</p>
							)}
							<TabsContent value='setup'>
								<SetupView hasAtLeastOneSource={hasAtLeastOneSource(config)} />
							</TabsContent>
							<TabsContent value='run'>
								<RunView />
							</TabsContent>
							<TabsContent value='report'>
								<ReportView />
							</TabsContent>
						</Tabs>
					</>
				)}
		</main>
		</TooltipProvider>
		</InspectErrorBoundary>
	);
}
