import React from 'react';
import {
	Alert,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@aro/desktop/components';
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
		handleSelectRun,
		handleSelectWorkspace,
		handleRunScan,
		handleCancelRun,
		handleExport,
	} = state;

	return (
		<main className='min-w-[900px] min-h-screen p-6 font-sans' role='main'>
			<div className='flex flex-col min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between gap-4 mb-3 pb-4 border-b border-[#E4E4E7]'>
					<div className='flex flex-col gap-1 min-w-0'>
						<h1 className='text-xl font-semibold'>Aro Inspect</h1>
						<p className='text-sm text-muted-foreground'>
							Design system inventory & health
						</p>
					</div>
					<div className='min-w-0 min-[900px]:shrink-0'>
						<WorkspaceCard
							workspacePath={workspacePath}
							onSelectWorkspace={handleSelectWorkspace}
						/>
					</div>
				</div>

				{workspacePath && (
					<>
						{error && (
							<Alert variant='destructive' className='mb-4'>
								{error}
							</Alert>
						)}

						{view === 'setup' && !hasAtLeastOneSource(config) && (
							<p className='mb-4 text-[11px] text-muted-foreground'>
								Configure at least one source (Figma, Code tokens, or Storybook)
								to enable Run Inspect.
							</p>
						)}
						{view === 'run' && (
							<p className='mb-4 text-[11px] text-muted-foreground'>
								Run Inspect from the Setup tab, then select a run here to view
								logs and progress.
							</p>
						)}
						{view === 'report' && (
							<p className='mb-4 text-[11px] text-muted-foreground'>
								Select a completed run to view its health report, or export to
								CSV or Markdown.
							</p>
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
							<TabsContent value='setup'>
								<SetupView
									config={config}
									onConfigChange={setConfig}
									onRunScan={handleRunScan}
									hasAtLeastOneSource={hasAtLeastOneSource(config)}
								/>
							</TabsContent>
							<TabsContent value='run'>
								<RunView
									runs={runs}
									selectedRunId={selectedRunId}
									logs={logs}
									runningRunId={runningRunId}
									onSelectRun={handleSelectRun}
									onCancelRun={handleCancelRun}
									onViewReports={() => setView('report')}
								/>
							</TabsContent>
							<TabsContent value='report'>
								<ReportView
									runs={runs}
									runsWithReport={runsWithReport}
									runsWithReportLoading={runsWithReportLoading}
									selectedRunId={selectedRunId}
									report={report}
									reportLoadState={reportLoadState}
									reportTab={reportTab}
									onSelectRun={handleSelectRun}
									onReportTabChange={setReportTab}
									onExportCsv={() => handleExport('csv')}
									onExportMarkdown={() => handleExport('markdown')}
									onExportPdf={() => handleExport('pdf')}
									canExport={runsWithReport.includes(selectedRunId ?? '')}
									storybookUrl={config.storybookUrl}
								/>
							</TabsContent>
						</Tabs>
					</>
				)}
		</main>
	);
}
