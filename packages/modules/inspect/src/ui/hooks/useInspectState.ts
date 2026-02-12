import { useState, useEffect, useCallback, useRef } from 'react';
import type {
	View,
	ScanConfig,
	RunItem,
	LogEntry,
	InspectReport,
	ReportTab,
} from '../types';
import { JOB_SCAN, JOB_EXPORT } from '../constants';
import {
	getInitialConfig,
	buildScanInput,
} from '../lib/config';

type ReportLoadState = 'idle' | 'loading' | 'success' | 'error';

const RUNS_WITH_REPORT_LIMIT = 50;

export function useInspectState() {
	const [workspacePath, setWorkspacePath] = useState<string | null>(null);
	const [view, setView] = useState<View>('setup');
	const [config, setConfig] = useState<ScanConfig>(getInitialConfig);
	const [runs, setRuns] = useState<RunItem[]>([]);
	const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [report, setReport] = useState<InspectReport | null>(null);
	const [reportLoadState, setReportLoadState] = useState<ReportLoadState>('idle');
	const [runningRunId, setRunningRunId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [reportTab, setReportTab] = useState<ReportTab>('health');
	const [runsWithReport, setRunsWithReport] = useState<string[]>([]);
	const [runsWithReportLoading, setRunsWithReportLoading] = useState(false);
	const [focusedRunId, setFocusedRunId] = useState<string | null>(null);
	const listboxRef = useRef<HTMLDivElement>(null);

	const handleSelectRun = useCallback((id: string) => {
		setSelectedRunId(id);
		setFocusedRunId(id);
		listboxRef.current?.focus();
	}, []);

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
		if (view !== 'report' || !workspacePath) {
			setRunsWithReport([]);
			setRunsWithReportLoading(false);
			return;
		}
		const successfulRuns = runs
			.filter((r) => r.status === 'success')
			.slice(0, RUNS_WITH_REPORT_LIMIT);
		if (successfulRuns.length === 0) {
			setRunsWithReport([]);
			setRunsWithReportLoading(false);
			return;
		}
		setRunsWithReportLoading(true);
		Promise.allSettled(
			successfulRuns.map((r) => window.aro.artifacts.list(r.id)),
		)
			.then((results) => {
				const ids: string[] = [];
				results.forEach((result, i) => {
					if (result.status === 'fulfilled') {
						const artifacts = result.value as Array<{ path: string }>;
						if (artifacts.some((a) => a.path === 'report.json')) {
							ids.push(successfulRuns[i]!.id);
						}
					}
				});
				setRunsWithReport(ids);
			})
			.finally(() => setRunsWithReportLoading(false));
	}, [view, workspacePath, runs]);

	useEffect(() => {
		if (
			selectedRunId &&
			runsWithReport.length > 0 &&
			!runsWithReport.includes(selectedRunId)
		) {
			const first = runsWithReport[0]!;
			setSelectedRunId(first);
			setFocusedRunId(first);
		}
	}, [selectedRunId, runsWithReport]);

	useEffect(() => {
		const run = runs.find((r) => r.id === runningRunId);
		if (run && run.status !== 'running') {
			setRunningRunId(null);
			if (run.status === 'success') {
				setView('report');
				setSelectedRunId(run.id);
				setFocusedRunId(run.id);
			}
		}
	}, [runs, runningRunId]);

	useEffect(() => {
		if (!selectedRunId || view !== 'report') {
			setReport(null);
			setReportLoadState('idle');
			return;
		}
		let cancelled = false;
		setReportLoadState('loading');
		setReport(null);
		window.aro.artifacts
			.read(selectedRunId, 'report.json')
			.then((content) => {
				if (cancelled) return;
				try {
					setReport(JSON.parse(content) as InspectReport);
					setReportLoadState('success');
				} catch {
					setReport(null);
					setReportLoadState('error');
				}
			})
			.catch(() => {
				if (!cancelled) {
					setReport(null);
					setReportLoadState('error');
				}
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
					(entry: LogEntry) => {
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

	const handleSelectWorkspace = useCallback(async () => {
		setError(null);
		try {
			const result = await window.aro.workspace.select();
			if (result) setWorkspacePath(result.path);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to select workspace');
		}
	}, []);

	const handleRunScan = useCallback(async () => {
		setError(null);
		try {
			const input = buildScanInput(config);
			const { runId } = await window.aro.job.run(JOB_SCAN, input);
			setRunningRunId(runId);
			setSelectedRunId(runId);
			setFocusedRunId(runId);
			setView('run');
			loadRuns();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to run scan');
		}
	}, [config, loadRuns]);

	const handleCancelRun = useCallback(async (runId: string) => {
		setError(null);
		try {
			await window.aro.job.cancel(runId);
			setRunningRunId(null);
			loadRuns();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to cancel');
		}
	}, [loadRuns]);

	const handleExport = useCallback(async (format: 'csv' | 'markdown') => {
		if (!selectedRunId) return;
		setError(null);
		try {
			const artifacts = await window.aro.artifacts.list(selectedRunId);
			if (!artifacts.some((a: { path: string }) => a.path === 'report.json')) {
				setError('Report not available for this run. Cannot export.');
				return;
			}
			const { runId } = await window.aro.job.run(JOB_EXPORT, {
				runId: selectedRunId,
				format,
			});
			let run = await window.aro.runs.get(runId);
			while (run?.status === 'running') {
				await new Promise((r) => setTimeout(r, 100));
				run = await window.aro.runs.get(runId);
			}
			if (run?.status === 'success') {
				const ext = format === 'csv' ? 'csv' : 'md';
				const content = await window.aro.artifacts.read(
					runId,
					`inspect-export.${ext}`,
				);
				const blob = new Blob([content], {
					type: format === 'csv' ? 'text/csv' : 'text/markdown',
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `inspect-report.${ext}`;
				a.click();
				URL.revokeObjectURL(url);
			}
			loadRuns();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Export failed');
		}
	}, [selectedRunId, loadRuns]);

	return {
		workspacePath,
		view,
		setView,
		config,
		setConfig,
		runs,
		selectedRunId,
		logs,
		report,
		reportLoadState,
		runningRunId,
		error,
		reportTab,
		setReportTab,
		runsWithReport,
		runsWithReportLoading,
		focusedRunId,
		setFocusedRunId,
		listboxRef,
		handleSelectRun,
		handleSelectWorkspace,
		handleRunScan,
		handleCancelRun,
		handleExport,
		loadRuns,
	};
}
