import React from 'react';
import { Button, TooltipProvider } from '@aro/desktop/components';
import { useInspectState } from './hooks/useInspectState';
import { WorkspaceCard } from './components/WorkspaceCard';
import { SetupView } from './views/SetupView';
import { RunView } from './views/RunView';
import { ReportView } from './views/ReportView';
import { hasAtLeastOneSource } from './lib/config';

export default function Inspect() {
	const state = useInspectState();
	const {
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
	} = state;

	return (
		<main className="min-w-[900px] min-h-screen p-6 font-sans" role="main">
			<TooltipProvider delayDuration={300}>
				<h1 className="text-2xl font-semibold mb-4">Aro Inspect</h1>

				<WorkspaceCard
					workspacePath={workspacePath}
					onSelectWorkspace={handleSelectWorkspace}
				/>

				{workspacePath && (
					<>
						{error && (
							<div
								role="alert"
								className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200 mb-4"
							>
								{error}
							</div>
						)}

						<nav
							className="flex gap-2 mt-2 mb-2"
							aria-label="Inspect views"
						>
							<Button
								type="button"
								variant={view === 'setup' ? 'default' : 'outline'}
								onClick={() => setView('setup')}
							>
								Setup
							</Button>
							<Button
								type="button"
								variant={view === 'run' ? 'default' : 'outline'}
								onClick={() => setView('run')}
							>
								Logs
							</Button>
							<Button
								type="button"
								variant={view === 'report' ? 'default' : 'outline'}
								onClick={() => setView('report')}
							>
								Report
							</Button>
						</nav>

						{view === 'setup' && !hasAtLeastOneSource(config) && (
							<p className="mb-2 text-sm text-muted-foreground">
								Configure at least one source (Figma, Code tokens, or Storybook)
								to enable Run Inspect.
							</p>
						)}
						{view === 'setup' && (
							<SetupView
								config={config}
								onConfigChange={setConfig}
								onRunScan={handleRunScan}
								hasAtLeastOneSource={hasAtLeastOneSource(config)}
							/>
						)}
						{view === 'run' && (
							<RunView
								runs={runs}
								selectedRunId={selectedRunId}
								focusedRunId={focusedRunId}
								logs={logs}
								runningRunId={runningRunId}
								listboxRef={listboxRef}
								onSelectRun={handleSelectRun}
								onFocusChange={setFocusedRunId}
								onCancelRun={handleCancelRun}
							/>
						)}
						{view === 'report' && (
							<ReportView
								runs={runs}
								runsWithReport={runsWithReport}
								runsWithReportLoading={runsWithReportLoading}
								selectedRunId={selectedRunId}
								focusedRunId={focusedRunId}
								report={report}
								reportLoadState={reportLoadState}
								reportTab={reportTab}
								listboxRef={listboxRef}
								onSelectRun={handleSelectRun}
								onFocusChange={setFocusedRunId}
								onReportTabChange={setReportTab}
								onExportCsv={() => handleExport('csv')}
								onExportMarkdown={() => handleExport('markdown')}
								canExport={runsWithReport.includes(selectedRunId ?? '')}
							/>
						)}
					</>
				)}
			</TooltipProvider>
		</main>
	);
}
