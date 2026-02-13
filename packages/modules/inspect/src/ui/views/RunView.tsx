import React from 'react';
import { Button, Card, CardContent, CardTitle } from '@aro/desktop/components';
import { RunsTable } from '../components/RunsTable';
import {
	TwoColumnLayout,
	CARD_CLASS,
	CARD_CONTENT_CLASS,
	COLUMN_HEADER_CLASS,
} from '../components/TwoColumnLayout';
import { useInspectStore } from '../store';

export function RunView() {
	const runs = useInspectStore((s) => s.runs);
	const selectedRunId = useInspectStore((s) => s.selectedRunId);
	const logs = useInspectStore((s) => s.logs);
	const runningRunId = useInspectStore((s) => s.runningRunId);
	const cancelRun = useInspectStore((s) => s.cancelRun);
	const setView = useInspectStore((s) => s.setView);

	const selectedRun = runs.find((r) => r.id === selectedRunId);
	const isLoading = runningRunId != null && runningRunId === selectedRunId;
	const canViewReports = selectedRun?.status === 'success';

	const sidebar = (
		<div className='space-y-4 min-[900px]:flex min-[900px]:flex-col min-[900px]:min-h-0 min-[900px]:space-y-0'>
			<Card className={CARD_CLASS}>
				<div className={COLUMN_HEADER_CLASS} role='region' aria-label='Runs'>
					<CardTitle className='mb-0 text-base font-medium text-muted-foreground'>
						Runs
					</CardTitle>
				</div>
				<CardContent className={`${CARD_CONTENT_CLASS} p-0`}>
					<RunsTable showStatus />
				</CardContent>
			</Card>
			{runningRunId && (
				<Button
					type='button'
					variant='destructive'
					size='xs'
					className='min-[900px]:mt-4'
					onClick={() => cancelRun(runningRunId)}
				>
					Abort scan
				</Button>
			)}
		</div>
	);

	const main = (
		<Card className={CARD_CLASS}>
			<div
				className={`${COLUMN_HEADER_CLASS} justify-between gap-4`}
				role='region'
				aria-label='Logs'
			>
				<CardTitle className='mb-0 text-base font-medium text-muted-foreground'>
					Logs
				</CardTitle>
				{selectedRunId && (
					<Button
						type='button'
						variant='outline'
						size='xs'
						disabled={isLoading || !canViewReports}
						onClick={() => setView('report')}
					>
						{isLoading && (
							<span
								className='mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent'
								aria-hidden='true'
							/>
						)}
						View Reports
					</Button>
				)}
			</div>
			<CardContent className={`${CARD_CONTENT_CLASS} pt-6 px-6 pb-6`}>
				{selectedRunId ? (
					<ul
						className='list-none space-y-1 text-[11px]'
						role='log'
						aria-live='polite'
					>
						{logs.map((entry) => (
							<li key={entry.id}>
								[{entry.level}] {entry.message}
							</li>
						))}
					</ul>
				) : (
					<p className='text-muted-foreground text-[11px]'>
						Select a run from the list to view its logs. After you run Inspect,
						completed runs appear here; choose one to see the log output.
					</p>
				)}
			</CardContent>
		</Card>
	);

	return (
		<section aria-labelledby='run-heading'>
			<h2 id='run-heading' className='sr-only'>
				Run and logs
			</h2>
			<TwoColumnLayout sidebar={sidebar} main={main} />
		</section>
	);
}
