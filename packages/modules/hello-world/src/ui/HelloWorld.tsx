import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Run, LogEntry, Artifact } from '@aro/types';
import {
	Alert,
	AlertDescription,
	AlertTitle,
	AlertTriangleIcon,
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@aro/ui/components';
import { useConnectionStatus } from '@aro/ui/hooks';
import { ConnectionStatusBar } from '@aro/ui/shell';

const JOB_KEY = 'hello-world:greet';

function formatRelativeTime(ms: number): string {
	const now = Date.now();
	const diff = now - ms;
	const sec = Math.floor(diff / 1000);
	const min = Math.floor(sec / 60);
	const hr = Math.floor(min / 60);
	if (sec < 60) return 'Just now';
	if (min < 60) return `${min}m ago`;
	if (hr < 24) return `${hr}h ago`;
	return new Date(ms).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});
}

function statusBadge(status: string): React.ReactNode {
	switch (status) {
		case 'success':
			return <Badge variant='default'>Success</Badge>;
		case 'error':
			return <Badge variant='destructive'>Error</Badge>;
		case 'running':
			return <Badge variant='secondary'>Running</Badge>;
		case 'cancelled':
			return <Badge variant='outline'>Cancelled</Badge>;
		default:
			return <Badge variant='outline'>{status}</Badge>;
	}
}

const LOG_LEVEL_STYLES: Record<string, { className: string; icon: string }> = {
	error: { className: 'text-zinc-900 font-medium', icon: '\u00D7' },
	warn: { className: 'text-zinc-700', icon: '\u25B3' },
	info: { className: 'text-zinc-600', icon: '\u2013' },
	debug: { className: 'text-zinc-400', icon: '\u00B7' },
};

function logStyle(level: string) {
	return LOG_LEVEL_STYLES[level] ?? LOG_LEVEL_STYLES['info']!;
}

export default function HelloWorld() {
	const [workspacePath, setWorkspacePath] = useState<string | null>(null);
	const [runs, setRuns] = useState<Run[]>([]);
	const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [artifacts, setArtifacts] = useState<Artifact[]>([]);
	const [artifactContent, setArtifactContent] = useState<string | null>(null);
	const [runningRunId, setRunningRunId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { status, reportSuccess, reportFailure } = useConnectionStatus();
	const logsEndRef = useRef<HTMLDivElement>(null);

	const loadWorkspace = useCallback(async () => {
		try {
			const current = await window.aro.workspace.getCurrent();
			setWorkspacePath(current?.path ?? null);
		} catch {
			setWorkspacePath(null);
		}
	}, []);

	useEffect(() => {
		loadWorkspace();
		const unsub = window.aro.workspace.onChanged((data) => {
			setWorkspacePath(data?.path ?? null);
		});
		return unsub;
	}, [loadWorkspace]);

	const handleSelectWorkspace = async () => {
		setError(null);
		try {
			const result = await window.aro.workspace.select();
			if (result) {
				setWorkspacePath(result.path);
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to select workspace');
		}
	};

	const loadRuns = useCallback(async () => {
		if (!workspacePath) return;
		try {
			const list = await window.aro.runs.list();
			setRuns(list);
			reportSuccess();
		} catch {
			setRuns([]);
			reportFailure();
		}
	}, [workspacePath, reportSuccess, reportFailure]);

	useEffect(() => {
		loadRuns();
	}, [loadRuns]);

	useEffect(() => {
		if (runningRunId == null) return;
		const id = setInterval(loadRuns, 2000);
		return () => clearInterval(id);
	}, [runningRunId, loadRuns]);

	const handleRunJob = async () => {
		setError(null);
		try {
			const traceId = crypto.randomUUID();
			const { runId } = await window.aro.job.run(JOB_KEY, undefined, { traceId });
			setRunningRunId(runId);
			setSelectedRunId(runId);
			loadRuns();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to run job');
		}
	};

	const handleCancelJob = async (runId: string) => {
		setError(null);
		try {
			await window.aro.job.cancel(runId);
			setRunningRunId(null);
			loadRuns();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to cancel job');
		}
	};

	useEffect(() => {
		if (!selectedRunId) {
			setLogs([]);
			setArtifacts([]);
			setArtifactContent(null);
			return;
		}

		let unsubLogs: (() => void) | null = null;

		const load = async () => {
			try {
				const [logList, artifactList] = await Promise.all([
					window.aro.logs.list(selectedRunId),
					window.aro.artifacts.list(selectedRunId),
				]);
				setLogs(logList);
				setArtifacts(artifactList);

				unsubLogs = await window.aro.logs.subscribe(selectedRunId, (entry) => {
					setLogs((prev) => [...prev, entry]);
				});
			} catch {
				setLogs([]);
				setArtifacts([]);
			}
		};

		load();
		return () => {
			unsubLogs?.();
		};
	}, [selectedRunId]);

	useEffect(() => {
		const run = runs.find((r) => r.id === runningRunId);
		if (run && run.status !== 'running') {
			setRunningRunId(null);
		}
	}, [runs, runningRunId]);

	useEffect(() => {
		logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [logs.length]);

	const handleSelectArtifact = async (artifact: Artifact) => {
		if (!selectedRunId) return;
		try {
			const content = await window.aro.artifacts.read(
				selectedRunId,
				artifact.path,
			);
			setArtifactContent(content);
		} catch {
			setArtifactContent('Failed to read artifact');
		}
	};

	return (
		<TooltipProvider delayDuration={300}>
			<main className='px-3 py-6 sm:px-6 max-w-5xl mx-auto font-sans' role='main'>
				<ConnectionStatusBar status={status} onRetry={loadRuns} />

				{/* Title */}
				<div className='mb-6'>
					<h1 className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
						<span className='text-xl font-semibold'>Hello World</span>
						<span className='text-sm text-zinc-500'>
							Starter module for testing the platform
						</span>
					</h1>
				</div>

				{/* Workspace picker */}
				<div className='mb-6'>
					<Card className='mb-0 py-3 px-4'>
						<CardContent className='p-0'>
							{!workspacePath ? (
								<div className='space-y-1'>
									<Button
										type='button'
										variant='secondary'
										size='xs'
										onClick={handleSelectWorkspace}
									>
										Select workspace
									</Button>
									<p className='text-xs text-zinc-500'>
										Select a workspace to run hello-world jobs.
									</p>
								</div>
							) : (
								<div className='space-y-1'>
									<Button
										type='button'
										variant='ghost'
										size='xs'
										onClick={handleSelectWorkspace}
									>
										Set workspace
									</Button>
									<Tooltip>
										<TooltipTrigger asChild>
											<p className='truncate text-[11px] text-zinc-500 cursor-default min-w-0'>
												{workspacePath}
											</p>
										</TooltipTrigger>
										<TooltipContent>{workspacePath}</TooltipContent>
									</Tooltip>
								</div>
							)}
						</CardContent>
					</Card>
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

						{/* CTA row */}
						<div className='flex items-center gap-3 mb-4'>
							<Button
								type='button'
								variant='default'
								size='sm'
								onClick={handleRunJob}
							>
								Run {JOB_KEY}
							</Button>
							{runningRunId && (
								<Button
									type='button'
									variant='destructive'
									size='xs'
									onClick={() => handleCancelJob(runningRunId)}
								>
									Cancel
								</Button>
							)}
							{!runningRunId && runs.length > 0 && (
								<span className='text-xs text-zinc-500'>
									{runs.length} run{runs.length !== 1 ? 's' : ''}
								</span>
							)}
						</div>

						{/* Runs table */}
						<Card className='mb-4'>
							<CardHeader>
								<CardTitle>Runs</CardTitle>
							</CardHeader>
							<CardContent className='p-0'>
								<div className='overflow-x-auto'>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Time</TableHead>
												<TableHead>ID</TableHead>
												<TableHead className='text-right'>Status</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{runs.map((run) => {
												const isSelected = selectedRunId === run.id;
												return (
													<TableRow
														key={run.id}
														data-state={isSelected ? 'selected' : undefined}
														className={`cursor-pointer ${isSelected ? 'bg-zinc-100' : ''}`}
														onClick={() => setSelectedRunId(run.id)}
													>
														<TableCell className='text-[11px] whitespace-nowrap'>
															{formatRelativeTime(run.startedAt)}
														</TableCell>
														<TableCell className='text-[11px] font-mono text-zinc-500 py-3'>
															<Tooltip>
																<TooltipTrigger asChild>
																	<span className='cursor-default'>
																		{run.id.slice(0, 8)}
																	</span>
																</TooltipTrigger>
																<TooltipContent>{run.id}</TooltipContent>
															</Tooltip>
														</TableCell>
														<TableCell className='text-right'>
															{statusBadge(run.status)}
														</TableCell>
													</TableRow>
												);
											})}
											{runs.length === 0 && (
												<TableRow>
													<TableCell
														colSpan={3}
														className='text-center text-zinc-500 text-[11px] py-4'
													>
														No runs yet
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>

						{selectedRunId && (
							<>
								{/* Logs */}
								<Card className='mb-4'>
									<CardHeader>
										<CardTitle>Logs</CardTitle>
									</CardHeader>
									<CardContent>
										{logs.length > 0 ? (
											<ul
												className='list-none space-y-0.5 text-[11px] font-mono max-h-[60vh] overflow-y-auto'
												role='log'
												aria-live='polite'
											>
												{logs.map((entry) => {
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
												Select a run to view its logs.
											</p>
										)}
									</CardContent>
								</Card>

								{/* Artifacts */}
								<Card className='mb-4'>
									<CardHeader>
										<CardTitle>Artifacts</CardTitle>
									</CardHeader>
									<CardContent>
										{artifacts.length > 0 ? (
											<ul className='list-none space-y-0.5'>
												{artifacts.map((artifact) => (
													<li key={artifact.id}>
														<Button
															type='button'
															variant='link'
															className='p-0 h-auto font-mono text-[11px] font-normal'
															onClick={() => handleSelectArtifact(artifact)}
														>
															{artifact.path}
														</Button>
													</li>
												))}
											</ul>
										) : (
											<p className='text-zinc-500 text-[11px]'>No artifacts.</p>
										)}
										{artifactContent !== null && (
											<pre className='mt-4 rounded-md bg-zinc-100 p-3 text-[11px] font-mono overflow-auto max-h-[40vh]'>
												{artifactContent}
											</pre>
										)}
									</CardContent>
								</Card>
							</>
						)}
					</>
				)}
			</main>
		</TooltipProvider>
	);
}
