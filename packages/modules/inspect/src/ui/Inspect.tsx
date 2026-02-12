import React from 'react';
import { Alert, Button, TooltipProvider } from '@aro/desktop/components';
import { useInspectState } from './hooks/useInspectState';
import { WorkspaceCard } from './components/WorkspaceCard';
import { SetupView } from './views/SetupView';
import { RunView } from './views/RunView';
import { ReportView } from './views/ReportView';
import { hasAtLeastOneSource } from './lib/config';
import type { View } from './types';

const VIEW_TABS: Array<{ id: View; label: string }> = [
	{ id: 'setup', label: 'Setup' },
	{ id: 'run', label: 'Logs' },
	{ id: 'report', label: 'Reports' },
];

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
				<div className="flex flex-col min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between gap-4 mb-3">
					<div className="flex flex-col gap-1 min-w-0">
						<h1 className="text-xl font-semibold">Aro Inspect</h1>
						<p className="text-sm text-muted-foreground">
							Design system inventory & health
						</p>
					</div>
					<div className="min-w-0 min-[900px]:shrink-0">
						<WorkspaceCard
							workspacePath={workspacePath}
							onSelectWorkspace={handleSelectWorkspace}
						/>
					</div>
				</div>

				{workspacePath && (
					<>
						{error && (
							<Alert variant="destructive" className="mb-4">
								{error}
							</Alert>
						)}

						<nav
							className="flex gap-2 mt-2 mb-3"
							aria-label="Inspect views"
						>
							{VIEW_TABS.map((tab) => (
								<Button
									key={tab.id}
									type="button"
									variant={view === tab.id ? 'default' : 'outline'}
									onClick={() => setView(tab.id)}
								>
									{tab.label}
								</Button>
							))}
						</nav>

						{view === 'setup' && !hasAtLeastOneSource(config) && (
							<p className="mb-4 text-sm text-muted-foreground">
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
