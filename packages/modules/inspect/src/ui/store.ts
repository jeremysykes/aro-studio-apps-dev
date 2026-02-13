import { create } from 'zustand';
import type {
	View,
	ScanConfig,
	RunItem,
	LogEntry,
	InspectReport,
	ReportTab,
	ReportLoadState,
} from './types';
import { JOB_SCAN, JOB_EXPORT } from './constants';
import { getInitialConfig, buildScanInput } from './lib/config';

const RUNS_WITH_REPORT_LIMIT = 50;

export interface InspectState {
	// -- State --
	workspacePath: string | null;
	view: View;
	config: ScanConfig;
	runs: RunItem[];
	selectedRunId: string | null;
	logs: LogEntry[];
	report: InspectReport | null;
	reportLoadState: ReportLoadState;
	runningRunId: string | null;
	error: string | null;
	reportTab: ReportTab;
	runsWithReport: string[];
	runsWithReportLoading: boolean;

	// -- Actions --
	setView: (view: View) => void;
	setConfig: (updater: ScanConfig | ((prev: ScanConfig) => ScanConfig)) => void;
	setReportTab: (tab: ReportTab) => void;
	selectRun: (id: string) => void;
	selectWorkspace: () => Promise<void>;
	runScan: () => Promise<void>;
	cancelRun: (runId: string) => Promise<void>;
	exportReport: (format: 'csv' | 'markdown' | 'pdf') => Promise<void>;

	// -- Internal actions (used by subscriptions) --
	_setWorkspacePath: (path: string | null) => void;
	_loadRuns: () => Promise<void>;
	_loadReport: () => Promise<void>;
	_loadRunsWithReport: () => Promise<void>;
	_loadLogs: () => Promise<void>;
}

// Subscription cleanup handles stored outside the store
let _workspaceUnsub: (() => void) | null = null;
let _logsUnsub: (() => void) | null = null;
let _pollingInterval: ReturnType<typeof setInterval> | null = null;

export const useInspectStore = create<InspectState>((set, get) => ({
	// -- Initial state --
	workspacePath: null,
	view: 'setup',
	config: getInitialConfig(),
	runs: [],
	selectedRunId: null,
	logs: [],
	report: null,
	reportLoadState: 'idle',
	runningRunId: null,
	error: null,
	reportTab: 'health',
	runsWithReport: [],
	runsWithReportLoading: false,

	// -- Actions --
	setView: (view) => set({ view }),

	setConfig: (updater) =>
		set((state) => ({
			config: typeof updater === 'function' ? updater(state.config) : updater,
		})),

	setReportTab: (tab) => set({ reportTab: tab }),

	selectRun: (id) => set({ selectedRunId: id }),

	selectWorkspace: async () => {
		set({ error: null });
		try {
			const result = await window.aro.workspace.select();
			if (result) set({ workspacePath: result.path });
		} catch (e) {
			set({
				error: e instanceof Error ? e.message : 'Failed to select workspace',
			});
		}
	},

	runScan: async () => {
		const { config, _loadRuns } = get();
		set({ error: null });
		try {
			const input = buildScanInput(config);
			const { runId } = await window.aro.job.run(JOB_SCAN, input);
			set({ runningRunId: runId, selectedRunId: runId, view: 'run', reportTab: 'health' });
			_loadRuns();
		} catch (e) {
			set({ error: e instanceof Error ? e.message : 'Failed to run scan' });
		}
	},

	cancelRun: async (runId) => {
		const { _loadRuns } = get();
		set({ error: null });
		try {
			await window.aro.job.cancel(runId);
			set({ runningRunId: null });
			_loadRuns();
		} catch (e) {
			set({ error: e instanceof Error ? e.message : 'Failed to cancel' });
		}
	},

	exportReport: async (format) => {
		const { selectedRunId, _loadRuns } = get();
		if (!selectedRunId) return;
		set({ error: null });
		try {
			const artifacts = await window.aro.artifacts.list(selectedRunId);
			if (
				!artifacts.some((a: { path: string }) => a.path === 'report.json')
			) {
				set({ error: 'Report not available for this run. Cannot export.' });
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
				const ext =
					format === 'csv' ? 'csv' : format === 'markdown' ? 'md' : 'pdf';
				const artifactPath =
					format === 'pdf' ? 'inspect-export.pdf' : `inspect-export.${ext}`;
				const content = await window.aro.artifacts.read(runId, artifactPath);
				let blob: Blob;
				if (format === 'pdf') {
					const binary = atob(content);
					const bytes = new Uint8Array(binary.length);
					for (let i = 0; i < binary.length; i++)
						bytes[i] = binary.charCodeAt(i);
					blob = new Blob([bytes], { type: 'application/pdf' });
				} else {
					blob = new Blob([content], {
						type: format === 'csv' ? 'text/csv' : 'text/markdown',
					});
				}
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `inspect-report.${ext}`;
				a.click();
				URL.revokeObjectURL(url);
			}
			_loadRuns();
		} catch (e) {
			set({ error: e instanceof Error ? e.message : 'Export failed' });
		}
	},

	// -- Internal actions --
	_setWorkspacePath: (path) => set({ workspacePath: path }),

	_loadRuns: async () => {
		const { workspacePath } = get();
		if (!workspacePath) return;
		try {
			const list = await window.aro.runs.list();
			set({ runs: list });
		} catch {
			set({ runs: [] });
		}
	},

	_loadReport: async () => {
		const { selectedRunId, view } = get();
		if (!selectedRunId || view !== 'report') {
			set({ report: null, reportLoadState: 'idle' });
			return;
		}
		set({ reportLoadState: 'loading', report: null });
		try {
			const content = await window.aro.artifacts.read(
				selectedRunId,
				'report.json',
			);
			const parsed = JSON.parse(content) as InspectReport;
			set({ report: parsed, reportLoadState: 'success' });
		} catch {
			set({ report: null, reportLoadState: 'error' });
		}
	},

	_loadRunsWithReport: async () => {
		const { view, workspacePath, runs } = get();
		if (view !== 'report' || !workspacePath) {
			set({ runsWithReport: [], runsWithReportLoading: false });
			return;
		}
		const successfulRuns = runs
			.filter((r) => r.status === 'success')
			.slice(0, RUNS_WITH_REPORT_LIMIT);
		if (successfulRuns.length === 0) {
			set({ runsWithReport: [], runsWithReportLoading: false });
			return;
		}
		set({ runsWithReportLoading: true });
		try {
			const results = await Promise.allSettled(
				successfulRuns.map((r) => window.aro.artifacts.list(r.id)),
			);
			const ids: string[] = [];
			results.forEach((result, i) => {
				if (result.status === 'fulfilled') {
					const artifacts = result.value as Array<{ path: string }>;
					if (artifacts.some((a) => a.path === 'report.json')) {
						ids.push(successfulRuns[i]!.id);
					}
				}
			});
			set({ runsWithReport: ids });
		} finally {
			set({ runsWithReportLoading: false });
		}
	},

	_loadLogs: async () => {
		const { selectedRunId } = get();
		if (!selectedRunId) {
			set({ logs: [] });
			return;
		}
		// Clean up previous subscription
		_logsUnsub?.();
		_logsUnsub = null;
		try {
			const logList = await window.aro.logs.list(selectedRunId);
			set({ logs: logList });
			_logsUnsub = await window.aro.logs.subscribe(
				selectedRunId,
				(entry: LogEntry) => {
					set((state) => ({ logs: [...state.logs, entry] }));
				},
			);
		} catch {
			set({ logs: [] });
		}
	},
}));

/**
 * Initialize subscriptions and side effects.
 * Call once when the inspect module mounts. Returns a cleanup function.
 */
export function initInspectSubscriptions(): () => void {
	const store = useInspectStore;

	// Load initial workspace
	window.aro.workspace
		.getCurrent()
		.then((current) => {
			store.getState()._setWorkspacePath(current?.path ?? null);
		})
		.catch(() => {
			store.getState()._setWorkspacePath(null);
		});

	// Subscribe to workspace changes
	_workspaceUnsub = window.aro.workspace.onChanged(
		(data: { path: string } | null) => {
			store.getState()._setWorkspacePath(data?.path ?? null);
		},
	);

	// React to state changes with zustand subscribe
	const unsubStore = store.subscribe((state, prev) => {
		// When workspacePath changes, reload runs
		if (state.workspacePath !== prev.workspacePath) {
			state._loadRuns();
		}

		// When runningRunId changes, start/stop polling
		if (state.runningRunId !== prev.runningRunId) {
			if (_pollingInterval) {
				clearInterval(_pollingInterval);
				_pollingInterval = null;
			}
			if (state.runningRunId != null) {
				_pollingInterval = setInterval(() => {
					store.getState()._loadRuns();
				}, 2000);
			}
		}

		// When runs change and a running run finishes, clear runningRunId
		if (state.runs !== prev.runs && state.runningRunId) {
			const run = state.runs.find((r) => r.id === state.runningRunId);
			if (run && run.status !== 'running') {
				store.setState({ runningRunId: null });
			}
		}

		// When view/workspacePath/runs change, reload runsWithReport
		if (
			state.view !== prev.view ||
			state.workspacePath !== prev.workspacePath ||
			state.runs !== prev.runs
		) {
			state._loadRunsWithReport();
		}

		// When runsWithReport changes, auto-adjust selectedRunId
		if (state.runsWithReport !== prev.runsWithReport) {
			if (
				state.selectedRunId &&
				state.runsWithReport.length > 0 &&
				!state.runsWithReport.includes(state.selectedRunId)
			) {
				store.setState({ selectedRunId: state.runsWithReport[0]! });
			}
		}

		// When selectedRunId or view changes, reload report
		if (
			state.selectedRunId !== prev.selectedRunId ||
			state.view !== prev.view
		) {
			state._loadReport();
		}

		// When report loads and current tab has no data, reset to health
		if (
			state.reportLoadState === 'success' &&
			state.report &&
			(state.report !== prev.report || state.reportTab !== prev.reportTab)
		) {
			const tabHasNoData =
				(state.reportTab === 'tokens' && !state.report.tokens?.length) ||
				(state.reportTab === 'components' &&
					!state.report.components?.length);
			if (tabHasNoData) {
				store.setState({ reportTab: 'health' });
			}
		}

		// When selectedRunId changes, reload logs
		if (state.selectedRunId !== prev.selectedRunId) {
			state._loadLogs();
		}
	});

	return () => {
		_workspaceUnsub?.();
		_workspaceUnsub = null;
		_logsUnsub?.();
		_logsUnsub = null;
		if (_pollingInterval) {
			clearInterval(_pollingInterval);
			_pollingInterval = null;
		}
		unsubStore();
	};
}
