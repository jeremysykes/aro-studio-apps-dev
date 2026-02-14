import React, { useState, useEffect, useCallback } from 'react';
import type { Run, LogEntry, Artifact } from '@aro/types';
import { Button } from '@aro/ui/components';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@aro/ui/components';
import { useConnectionStatus } from '@aro/ui/hooks';
import { ConnectionStatusBar } from '@aro/ui/shell';

const JOB_KEY = 'hello-world:greet';

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
			const { runId } = await window.aro.job.run(JOB_KEY);
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
		<main className='p-4 font-sans'>
			<ConnectionStatusBar status={status} onRetry={loadRuns} />
			<h1 className='text-2xl font-semibold mb-4'>Aro Studio — Hello World</h1>
			<p className='text-sm text-muted-foreground mb-4'>
				Starter module for testing the platform. Configure modules via
				ARO_ENABLED_MODULES in the project root `.env`. See README.
			</p>

			<Card className='mb-4'>
				<CardHeader>
					<CardTitle>Workspace</CardTitle>
				</CardHeader>
				<CardContent>
					{!workspacePath ? (
						<Button type='button' onClick={handleSelectWorkspace}>
							Select workspace
						</Button>
					) : (
						<div>
							<p className='mb-2'>
								<strong>Path:</strong> {workspacePath}
							</p>
							<Button
								type='button'
								variant='outline'
								onClick={handleSelectWorkspace}
							>
								Set workspace
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{error && (
				<div
					role='alert'
					className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 mb-4'
				>
					{error}
				</div>
			)}

			{workspacePath && (
				<>
					<Card className='mb-4'>
						<CardHeader>
							<CardTitle>Jobs</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className='list-none space-y-2'>
								<li className='flex items-center gap-2'>
									<Button type='button' onClick={handleRunJob}>
										Run {JOB_KEY}
									</Button>
									{runningRunId && (
										<Button
											type='button'
											variant='destructive'
											onClick={() => handleCancelJob(runningRunId)}
										>
											Cancel
										</Button>
									)}
								</li>
							</ul>
						</CardContent>
					</Card>

					<Card className='mb-4'>
						<CardHeader>
							<CardTitle>Runs</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className='list-none space-y-1'>
								{runs.map((run) => (
									<li key={run.id}>
										<Button
											type='button'
											variant={selectedRunId === run.id ? 'default' : 'ghost'}
											className='w-full justify-start font-normal'
											onClick={() => setSelectedRunId(run.id)}
										>
											{run.id.slice(0, 8)} - {run.status} -{' '}
											{new Date(run.startedAt).toISOString()}
										</Button>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>

					{selectedRunId && (
						<>
							<Card className='mb-4'>
								<CardHeader>
									<CardTitle>Logs</CardTitle>
								</CardHeader>
								<CardContent>
									<ul className='list-none space-y-1 font-mono text-sm'>
										{logs.map((entry) => (
											<li key={entry.id}>
												[{entry.level}] {entry.message}
											</li>
										))}
									</ul>
								</CardContent>
							</Card>

							<Card className='mb-4'>
								<CardHeader>
									<CardTitle>Artifacts</CardTitle>
								</CardHeader>
								<CardContent>
									<ul className='list-none space-y-1'>
										{artifacts.map((artifact) => (
											<li key={artifact.id}>
												<Button
													type='button'
													variant='link'
													className='p-0 h-auto font-normal'
													onClick={() => handleSelectArtifact(artifact)}
												>
													{artifact.path}
												</Button>
											</li>
										))}
									</ul>
									{artifactContent !== null && (
										<pre className='mt-4 rounded-md bg-zinc-100 p-4 text-sm overflow-auto'>
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
	);
}
