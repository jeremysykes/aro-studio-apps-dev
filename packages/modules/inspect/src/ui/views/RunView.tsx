import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, CardContent, CardTitle, Progress } from '@aro/ui/components';
import { RunsTable } from '../components/RunsTable';
import {
	TwoColumnLayout,
	CARD_CLASS,
	CARD_CONTENT_CLASS,
	COLUMN_HEADER_CLASS,
} from '../components/TwoColumnLayout';
import { useInspectStore } from '../store';
import type { LogEntry } from '../types';

/* ── Log-level styling (zinc scale, brand-neutral) ── */
const LOG_LEVEL_STYLES: Record<string, { className: string; icon: string }> = {
	error: { className: 'text-zinc-900 font-medium', icon: '\u2716' },
	warn: { className: 'text-zinc-700', icon: '\u26A0' },
	info: { className: 'text-zinc-600', icon: '\u2139' },
	debug: { className: 'text-zinc-400', icon: '\u2022' },
};

function logStyle(level: string) {
	return LOG_LEVEL_STYLES[level] ?? LOG_LEVEL_STYLES['info']!;
}

/* ── Elapsed timer ── */
function useElapsedTime(running: boolean, startMs: number | null): string {
	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		if (!running || startMs == null) return;
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, [running, startMs]);

	if (!running || startMs == null) return '';
	const elapsed = Math.max(0, Math.floor((now - startMs) / 1000));
	const m = Math.floor(elapsed / 60);
	const s = elapsed % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RunView() {
	const runs = useInspectStore((s) => s.runs);
	const selectedRunId = useInspectStore((s) => s.selectedRunId);
	const logs = useInspectStore((s) => s.logs);
	const runningRunId = useInspectStore((s) => s.runningRunId);
	const cancelRun = useInspectStore((s) => s.cancelRun);
	const setView = useInspectStore((s) => s.setView);

	const selectedRun = runs.find((r) => r.id === selectedRunId);
	const isRunning = runningRunId != null && runningRunId === selectedRunId;
	const canViewReports = selectedRun?.status === 'success';

	const elapsed = useElapsedTime(isRunning, selectedRun?.startedAt ?? null);

	/* ── Auto-scroll ── */
	const logsEndRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [logs.length]);

	const sidebar = (
		<div className='space-y-4 min-[900px]:flex min-[900px]:flex-col min-[900px]:min-h-0 min-[900px]:space-y-0'>
			<Card className={CARD_CLASS}>
				<div className={COLUMN_HEADER_CLASS} role='region' aria-label='Runs'>
					<CardTitle className='mb-0 text-base font-medium text-zinc-500'>
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
				<div className='flex items-center gap-3'>
					<CardTitle className='mb-0 text-base font-medium text-zinc-500'>
						Logs
					</CardTitle>
					{selectedRunId && (
						<span className='text-xs text-zinc-400 tabular-nums'>
							{logs.length} entr{logs.length === 1 ? 'y' : 'ies'}
							{elapsed && <> &middot; {elapsed}</>}
						</span>
					)}
				</div>
				{selectedRunId && (
					<Button
						type='button'
						variant='outline'
						size='xs'
						disabled={isRunning || !canViewReports}
						onClick={() => setView('report')}
					>
						{isRunning && (
							<span
								className='mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent'
								aria-hidden='true'
							/>
						)}
						View Reports
					</Button>
				)}
			</div>

			{/* Indeterminate progress bar during scan */}
			{isRunning && (
				<div className='px-6'>
					<Progress aria-label='Scan in progress' />
				</div>
			)}

			<CardContent className={`${CARD_CONTENT_CLASS} pt-6 px-6 pb-6`}>
				{selectedRunId ? (
					<ul
						className='list-none space-y-0.5 text-[11px] font-mono max-h-[60vh] overflow-y-auto'
						role='log'
						aria-live='polite'
					>
						{logs.map((entry: LogEntry) => {
							const style = logStyle(entry.level);
							return (
								<li key={entry.id} className={style.className}>
									<span aria-hidden='true'>{style.icon}</span>{' '}
									<span className='text-zinc-400'>[{entry.level}]</span>{' '}
									{entry.message}
								</li>
							);
						})}
						<div ref={logsEndRef} aria-hidden='true' />
					</ul>
				) : (
					<p className='text-zinc-500 text-[11px]'>
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
