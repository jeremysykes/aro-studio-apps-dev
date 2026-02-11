import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@aro/desktop/components';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@aro/desktop/components';
import type { InspectReport } from './types';

const JOB_SCAN = 'inspect:scan';
const JOB_EXPORT = 'inspect:export';

type View = 'setup' | 'run' | 'report';

interface ScanConfig {
	figmaFileKeys: string;
	figmaPat: string;
	codePaths: string;
	storybookUrl: string;
	storybookPath: string;
}

const defaultConfig: ScanConfig = {
	figmaFileKeys: '',
	figmaPat: '',
	codePaths: '',
	storybookUrl: '',
	storybookPath: '',
};

function hasAtLeastOneSource(config: ScanConfig): boolean {
	const hasFigma = config.figmaFileKeys.trim() && config.figmaPat.trim();
	const hasCode = config.codePaths.trim().length > 0;
	const hasStorybook =
		config.storybookUrl.trim().length > 0 ||
		config.storybookPath.trim().length > 0;
	return hasFigma || hasCode || hasStorybook;
}

function buildScanInput(config: ScanConfig): unknown {
	const input: Record<string, unknown> = {};
	if (config.figmaFileKeys.trim() && config.figmaPat.trim()) {
		input.figma = {
			fileKeys: config.figmaFileKeys.split(/[\s,]+/).filter(Boolean),
			pat: config.figmaPat.trim(),
		};
	}
	if (config.codePaths.trim()) {
		input.codeTokens = {
			paths: config.codePaths.split(/[\n\s,]+/).filter(Boolean),
		};
	}
	if (config.storybookUrl.trim()) {
		input.storybook = { indexUrl: config.storybookUrl.trim() };
	} else if (config.storybookPath.trim()) {
		input.storybook = { indexPath: config.storybookPath.trim() };
	}
	return input;
}

export default function Inspect() {
	const [workspacePath, setWorkspacePath] = useState<string | null>(null);
	const [view, setView] = useState<View>('setup');
	const [config, setConfig] = useState<ScanConfig>(defaultConfig);
	const [runs, setRuns] = useState<
		Array<{ id: string; status: string; startedAt: number }>
	>([]);
	const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
	const [logs, setLogs] = useState<
		Array<{ id: string; level: string; message: string }>
	>([]);
	const [report, setReport] = useState<InspectReport | null>(null);
	const [runningRunId, setRunningRunId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [reportTab, setReportTab] = useState<
		'health' | 'tokens' | 'components'
	>('health');

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
		const unsub = window.aro.workspace.onChanged(
			(data: { path: string } | null) => {
				setWorkspacePath(data?.path ?? null);
			},
		);
		return unsub;
	}, [loadWorkspace]);

	const loadRuns = useCallback(async () => {
		if (!workspacePath) return;
		try {
			const list = await window.aro.runs.list();
			setRuns(list);
		} catch {
			setRuns([]);
		}
	}, [workspacePath]);

	useEffect(() => {
		loadRuns();
	}, [loadRuns]);

	useEffect(() => {
		if (runningRunId == null) return;
		const id = setInterval(loadRuns, 2000);
		return () => clearInterval(id);
	}, [runningRunId, loadRuns]);

	useEffect(() => {
		const run = runs.find((r) => r.id === runningRunId);
		if (run && run.status !== 'running') {
			setRunningRunId(null);
			if (run.status === 'success') {
				setView('report');
				setSelectedRunId(run.id);
			}
		}
	}, [runs, runningRunId]);

	useEffect(() => {
		if (!selectedRunId || view !== 'report') {
			setReport(null);
			return;
		}
		let cancelled = false;
		window.aro.artifacts
			.read(selectedRunId, 'report.json')
			.then((content) => {
				if (cancelled) return;
				try {
					setReport(JSON.parse(content) as InspectReport);
				} catch {
					setReport(null);
				}
			})
			.catch(() => {
				if (!cancelled) setReport(null);
			});
		return () => {
			cancelled = true;
		};
	}, [selectedRunId, view]);

	useEffect(() => {
		if (!selectedRunId) {
			setLogs([]);
			return;
		}
		let unsub: (() => void) | null = null;
		const load = async () => {
			try {
				const logList = await window.aro.logs.list(selectedRunId);
				setLogs(logList);
				unsub = await window.aro.logs.subscribe(
					selectedRunId,
					(entry: { id: string; level: string; message: string }) => {
						setLogs((prev) => [...prev, entry]);
					},
				);
			} catch {
				setLogs([]);
			}
		};
		load();
		return () => {
			unsub?.();
		};
	}, [selectedRunId]);

	const handleSelectWorkspace = async () => {
		setError(null);
		try {
			const result = await window.aro.workspace.select();
			if (result) setWorkspacePath(result.path);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to select workspace');
		}
	};

	const handleRunScan = async () => {
		setError(null);
		try {
			const input = buildScanInput(config);
			const { runId } = await window.aro.job.run(JOB_SCAN, input);
			setRunningRunId(runId);
			setSelectedRunId(runId);
			setView('run');
			loadRuns();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to run scan');
		}
	};

	const handleCancelRun = async (runId: string) => {
		setError(null);
		try {
			await window.aro.job.cancel(runId);
			setRunningRunId(null);
			loadRuns();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to cancel');
		}
	};

	const handleExport = async (format: 'csv' | 'markdown') => {
		if (!selectedRunId) return;
		setError(null);
		try {
			await window.aro.job.run(JOB_EXPORT, { runId: selectedRunId, format });
			loadRuns();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Export failed');
		}
	};

	return (
		<main className='min-w-[900px] min-h-screen p-6 font-sans' role='main'>
			<h1 className='text-2xl font-semibold mb-4'>Aro Inspect</h1>

			{!workspacePath ? (
				<Card className='mb-4'>
					<CardHeader>
						<CardTitle>Workspace</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='mb-2 text-muted-foreground'>
							Select a workspace to configure sources and run Inspect.
						</p>
						<Button type='button' onClick={handleSelectWorkspace}>
							Select workspace
						</Button>
					</CardContent>
				</Card>
			) : (
				<>
					<Card className='mb-4'>
						<CardHeader>
							<CardTitle>Workspace</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='mb-2 text-sm'>
								<strong>Path:</strong> {workspacePath}
							</p>
							<Button
								type='button'
								variant='outline'
								onClick={handleSelectWorkspace}
							>
								Change workspace
							</Button>
						</CardContent>
					</Card>

					{error && (
						<div
							role='alert'
							className='rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200 mb-4'
						>
							{error}
						</div>
					)}

					<nav className='flex gap-2 mt-2 mb-2' aria-label='Inspect views'>
						<Button
							type='button'
							variant={view === 'setup' ? 'default' : 'outline'}
							onClick={() => setView('setup')}
						>
							Setup
						</Button>
						<Button
							type='button'
							variant={view === 'run' ? 'default' : 'outline'}
							onClick={() => setView('run')}
						>
							Run
						</Button>
						<Button
							type='button'
							variant={view === 'report' ? 'default' : 'outline'}
							onClick={() => setView('report')}
						>
							Report
						</Button>
					</nav>

					{view === 'setup' && !hasAtLeastOneSource(config) && (
						<p className='mb-2 text-sm text-muted-foreground'>
							Configure at least one source (Figma, Code tokens, or Storybook)
							to enable Run Inspect.
						</p>
					)}
					{view === 'setup' && (
						<section aria-labelledby='setup-heading'>
							<h2 id='setup-heading' className='sr-only'>
								Setup sources
							</h2>
							<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
								<Card>
									<CardHeader>
										<CardTitle>Figma</CardTitle>
									</CardHeader>
									<CardContent className='space-y-2'>
										<label className='block text-sm font-medium'>
											File key(s){' '}
											<span className='text-muted-foreground'>
												(comma-separated)
											</span>
										</label>
										<input
											type='text'
											className='w-full rounded border px-3 py-2 text-sm'
											value={config.figmaFileKeys}
											onChange={(e) =>
												setConfig((c) => ({
													...c,
													figmaFileKeys: e.target.value,
												}))
											}
											placeholder='abc123def456'
											aria-label='Figma file keys'
										/>
										<label className='block text-sm font-medium'>
											Personal access token
										</label>
										<input
											type='password'
											className='w-full rounded border px-3 py-2 text-sm'
											value={config.figmaPat}
											onChange={(e) =>
												setConfig((c) => ({ ...c, figmaPat: e.target.value }))
											}
											placeholder='figd_…'
											aria-label='Figma PAT'
										/>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>Code tokens</CardTitle>
									</CardHeader>
									<CardContent>
										<label className='block text-sm font-medium mb-1'>
											Path(s) to token files{' '}
											<span className='text-muted-foreground'>
												(one per line or comma-separated)
											</span>
										</label>
										<textarea
											className='w-full rounded border px-3 py-2 text-sm min-h-[80px]'
											value={config.codePaths}
											onChange={(e) =>
												setConfig((c) => ({ ...c, codePaths: e.target.value }))
											}
											placeholder='tokens/tokens.json'
											aria-label='Code token paths'
										/>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>Storybook</CardTitle>
									</CardHeader>
									<CardContent className='space-y-2'>
										<label className='block text-sm font-medium'>
											Index URL
										</label>
										<input
											type='url'
											className='w-full rounded border px-3 py-2 text-sm'
											value={config.storybookUrl}
											onChange={(e) =>
												setConfig((c) => ({
													...c,
													storybookUrl: e.target.value,
												}))
											}
											placeholder='Base URL (e.g. https://site.vercel.app/) or …/index.json'
											aria-label='Storybook index URL'
										/>
										<span className='text-sm text-muted-foreground'>
											or workspace path to index
										</span>
										<input
											type='text'
											className='w-full rounded border px-3 py-2 text-sm'
											value={config.storybookPath}
											onChange={(e) =>
												setConfig((c) => ({
													...c,
													storybookPath: e.target.value,
												}))
											}
											placeholder='storybook-static/index.json'
											aria-label='Storybook index path'
										/>
									</CardContent>
								</Card>
							</div>
							<Button
								type='button'
								disabled={!hasAtLeastOneSource(config)}
								onClick={handleRunScan}
							>
								Run Inspect
							</Button>
						</section>
					)}

					{view === 'run' && (
						<section aria-labelledby='run-heading'>
							<h2 id='run-heading' className='sr-only'>
								Run and logs
							</h2>
							<div className='grid grid-cols-1 min-[900px]:grid-cols-2 gap-4'>
								<div className='space-y-4'>
									<Card>
										<CardHeader>
											<CardTitle>Runs</CardTitle>
										</CardHeader>
										<CardContent>
											<ul className='list-none space-y-1'>
												{runs.map((run) => (
													<li key={run.id}>
														<Button
															type='button'
															variant={
																selectedRunId === run.id ? 'default' : 'ghost'
															}
															className='w-full justify-start font-normal'
															onClick={() => setSelectedRunId(run.id)}
														>
															{run.id.slice(0, 8)} — {run.status} —{' '}
															{new Date(run.startedAt).toLocaleString()}
														</Button>
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
									{runningRunId && (
										<Button
											type='button'
											variant='destructive'
											onClick={() => handleCancelRun(runningRunId)}
										>
											Abort scan
										</Button>
									)}
								</div>
								{selectedRunId && (
									<Card>
										<CardHeader>
											<CardTitle>Logs</CardTitle>
										</CardHeader>
										<CardContent>
											<ul
												className='list-none space-y-1 font-mono text-sm'
												role='log'
												aria-live='polite'
											>
												{logs.map((entry) => (
													<li key={entry.id}>
														[{entry.level}] {entry.message}
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
								)}
							</div>
						</section>
					)}

					{view === 'report' && (
						<section aria-labelledby='report-heading'>
							<h2 id='report-heading' className='sr-only'>
								Report
							</h2>
							<Card className='mb-4'>
								<CardHeader>
									<CardTitle>Run for report</CardTitle>
								</CardHeader>
								<CardContent>
									<ul className='list-none space-y-1'>
										{runs
											.filter((r) => r.status === 'success')
											.map((run) => (
												<li key={run.id}>
													<Button
														type='button'
														variant={
															selectedRunId === run.id ? 'default' : 'ghost'
														}
														className='w-full justify-start font-normal'
														onClick={() => setSelectedRunId(run.id)}
													>
														{run.id.slice(0, 8)} —{' '}
														{new Date(run.startedAt).toLocaleString()}
													</Button>
												</li>
											))}
									</ul>
								</CardContent>
							</Card>
							{report && (
								<>
									<div
										className='flex gap-2 mb-4'
										role='tablist'
										aria-label='Report tabs'
									>
										<Button
											type='button'
											variant={reportTab === 'health' ? 'default' : 'outline'}
											onClick={() => setReportTab('health')}
											role='tab'
											aria-selected={reportTab === 'health'}
										>
											Health Dashboard
										</Button>
										<Button
											type='button'
											variant={reportTab === 'tokens' ? 'default' : 'outline'}
											onClick={() => setReportTab('tokens')}
											role='tab'
											aria-selected={reportTab === 'tokens'}
										>
											Token Inventory
										</Button>
										<Button
											type='button'
											variant={
												reportTab === 'components' ? 'default' : 'outline'
											}
											onClick={() => setReportTab('components')}
											role='tab'
											aria-selected={reportTab === 'components'}
										>
											Component Inventory
										</Button>
									</div>
									{reportTab === 'health' && (
										<Card>
											<CardHeader>
												<CardTitle>Health score</CardTitle>
											</CardHeader>
											<CardContent>
												<p className='text-lg'>
													Composite:{' '}
													<strong>{report.healthScore.composite}</strong> out of
													100
												</p>
												<ul className='list-disc pl-6 mt-2 space-y-1'>
													<li>
														Token consistency:{' '}
														{report.healthScore.tokenConsistency}
													</li>
													<li>
														Component coverage:{' '}
														{report.healthScore.componentCoverage}
													</li>
													<li>
														Naming alignment:{' '}
														{report.healthScore.namingAlignment}
													</li>
													<li>
														Value parity: {report.healthScore.valueParity}
													</li>
												</ul>
												<p className='mt-4 font-medium'>Findings by severity</p>
												<ul className='list-disc pl-6'>
													<li>
														Critical:{' '}
														{report.summary.findingsBySeverity?.critical ?? 0}
													</li>
													<li>
														Warning:{' '}
														{report.summary.findingsBySeverity?.warning ?? 0}
													</li>
													<li>
														Info: {report.summary.findingsBySeverity?.info ?? 0}
													</li>
												</ul>
												<div className='mt-4 flex gap-2'>
													<Button
														type='button'
														variant='outline'
														onClick={() => handleExport('csv')}
													>
														Export CSV
													</Button>
													<Button
														type='button'
														variant='outline'
														onClick={() => handleExport('markdown')}
													>
														Export Markdown
													</Button>
												</div>
											</CardContent>
										</Card>
									)}
									{reportTab === 'tokens' && (
										<Card>
											<CardHeader>
												<CardTitle>Token inventory</CardTitle>
											</CardHeader>
											<CardContent className='overflow-x-auto'>
												<table className='w-full text-sm border-collapse'>
													<thead>
														<tr>
															<th scope='col' className='text-left border p-2'>
																Name
															</th>
															<th scope='col' className='text-left border p-2'>
																Value
															</th>
															<th scope='col' className='text-left border p-2'>
																Type
															</th>
															<th scope='col' className='text-left border p-2'>
																Source
															</th>
														</tr>
													</thead>
													<tbody>
														{report.tokens.map((t) => (
															<tr key={t.name}>
																<td className='border p-2'>{t.name}</td>
																<td className='border p-2'>{t.value}</td>
																<td className='border p-2'>{t.type}</td>
																<td className='border p-2'>{t.source}</td>
															</tr>
														))}
													</tbody>
												</table>
											</CardContent>
										</Card>
									)}
									{reportTab === 'components' && (
										<Card>
											<CardHeader>
												<CardTitle>Component inventory</CardTitle>
											</CardHeader>
											<CardContent className='overflow-x-auto'>
												<table className='w-full text-sm border-collapse'>
													<thead>
														<tr>
															<th scope='col' className='text-left border p-2'>
																Name
															</th>
															<th scope='col' className='text-left border p-2'>
																Surfaces
															</th>
															<th scope='col' className='text-left border p-2'>
																Coverage
															</th>
															<th scope='col' className='text-left border p-2'>
																Orphan
															</th>
														</tr>
													</thead>
													<tbody>
														{report.components.map((c) => (
															<tr key={c.name}>
																<td className='border p-2'>{c.name}</td>
																<td className='border p-2'>
																	{[
																		c.surfaces.figma && 'Figma',
																		c.surfaces.storybook && 'Storybook',
																		c.surfaces.code && 'Code',
																	]
																		.filter(Boolean)
																		.join(', ') || '—'}
																</td>
																<td className='border p-2'>
																	{c.coverage.join(', ')}
																</td>
																<td className='border p-2'>
																	{c.isOrphan ? 'Yes' : 'No'}
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</CardContent>
										</Card>
									)}
								</>
							)}
							{selectedRunId && !report && (
								<p className='text-muted-foreground'>Loading report…</p>
							)}
						</section>
					)}
				</>
			)}
		</main>
	);
}
