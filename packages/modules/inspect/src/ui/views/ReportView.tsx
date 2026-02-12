import React, { useState } from 'react';
import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardTitle,
	Input,
	Skeleton,
	Tabs,
	TabsList,
	TabsTrigger,
} from '@aro/desktop/components';
import { RunsTable } from '../components/RunsTable';
import {
	TwoColumnLayout,
	CARD_CLASS,
	CARD_CONTENT_CLASS,
	COLUMN_HEADER_CLASS,
} from '../components/TwoColumnLayout';
import { ReportContent, REPORT_TABS } from '../report/ReportContent';
import type {
	RunItem,
	InspectReport,
	ReportTab,
	ReportLoadState,
} from '../types';

export interface ReportViewProps {
	runs: RunItem[];
	runsWithReport: string[];
	runsWithReportLoading: boolean;
	selectedRunId: string | null;
	report: InspectReport | null;
	reportLoadState: ReportLoadState;
	reportTab: ReportTab;
	onSelectRun: (id: string) => void;
	onReportTabChange: (tab: ReportTab) => void;
	onExportCsv: () => void;
	onExportMarkdown: () => void;
	onExportPdf: () => void;
	canExport: boolean;
	storybookUrl?: string;
}

export function ReportView({
	runs,
	runsWithReport,
	runsWithReportLoading,
	selectedRunId,
	report,
	reportLoadState,
	reportTab,
	onSelectRun,
	onReportTabChange,
	onExportCsv,
	onExportMarkdown,
	onExportPdf,
	canExport,
	storybookUrl,
}: ReportViewProps) {
	const storybookBaseUrl =
		report?.storybookBaseUrl ??
		(storybookUrl?.trim()
			? `${new URL(storybookUrl.trim()).origin}/`
			: undefined);
	const [filter, setFilter] = useState('');
	const reportRuns = runs.filter((r) => runsWithReport.includes(r.id));
	const showFilter = reportTab === 'tokens' || reportTab === 'components';

	const handleTabChange = (tab: ReportTab) => {
		setFilter('');
		onReportTabChange(tab);
	};

	const sidebar = (
		<Card className={CARD_CLASS}>
			<div className={COLUMN_HEADER_CLASS} role='region' aria-label='Runs'>
				<CardTitle className='mb-0 text-base font-medium text-muted-foreground'>
					Runs
				</CardTitle>
			</div>
			<CardContent className={`${CARD_CONTENT_CLASS} p-0`}>
				{runsWithReportLoading ? (
					<ul className='list-none space-y-1 min-w-0 p-2'>
						{Array.from({ length: 6 }, (_, i) => (
							<li key={i} className='min-w-0'>
								<Skeleton className='h-8 w-full rounded-md' />
							</li>
						))}
					</ul>
				) : (
					<RunsTable
						runs={reportRuns}
						selectedRunId={selectedRunId}
						onSelectRun={onSelectRun}
					/>
				)}
			</CardContent>
		</Card>
	);

	const main = (
		<Card className={`${CARD_CLASS} flex flex-col`}>
			<div
				className={`${COLUMN_HEADER_CLASS} justify-between gap-4`}
				role='region'
				aria-label='Reports'
			>
				<CardTitle className='mb-0 text-base font-medium text-muted-foreground'>
					Reports
				</CardTitle>
				<div className='flex items-center gap-3 shrink-0'>
					<Tabs
						value={reportTab}
						onValueChange={(value) => handleTabChange(value as ReportTab)}
					>
						<TabsList size='xs' aria-label='Report tabs'>
							{REPORT_TABS.map((tab) => (
								<TabsTrigger
									key={tab.id}
									value={tab.id}
									size='xs'
									disabled={report ? tab.getDisabled(report) : true}
								>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
					{showFilter && (
						<Input
							type='search'
							placeholder='Filter…'
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							className='w-40'
							aria-label={`Filter ${reportTab}`}
						/>
					)}
				</div>
			</div>
			<CardContent
				className={`${CARD_CONTENT_CLASS} flex-1 min-h-0 overflow-y-auto ${reportTab === 'health' ? 'p-6' : 'p-0'}`}
			>
				{reportLoadState === 'loading' && (
					<p className='text-sm text-muted-foreground'>Loading report…</p>
				)}
				{reportLoadState === 'error' && (
					<p className='text-sm text-muted-foreground'>
						Report not available for this run.
					</p>
				)}
				{reportLoadState === 'success' && report && (
					<ReportContent
						report={report}
						reportTab={reportTab}
						filter={filter}
						storybookBaseUrl={storybookBaseUrl}
					/>
				)}
				{!selectedRunId && (
					<p className='text-muted-foreground text-[11px]'>
						Select a run from the list to view its report. Each run includes a
						health dashboard, token inventory, and component inventory. Runs
						with a completed scan will show the full report here.
					</p>
				)}
			</CardContent>
			{reportLoadState === 'success' && report && reportTab === 'health' && (
				<CardFooter className='shrink-0 flex items-center justify-end gap-2 border-t border-zinc-200 py-3 px-4'>
					<Button
						type='button'
						variant='outline'
						size='xs'
						disabled={!canExport}
						onClick={onExportCsv}
					>
						Export CSV
					</Button>
					<Button
						type='button'
						variant='outline'
						size='xs'
						disabled={!canExport}
						onClick={onExportMarkdown}
					>
						Export Markdown
					</Button>
					<Button
						type='button'
						variant='outline'
						size='xs'
						disabled={!canExport}
						onClick={onExportPdf}
					>
						Export PDF
					</Button>
				</CardFooter>
			)}
		</Card>
	);

	return (
		<section aria-labelledby='report-heading'>
			<h2 id='report-heading' className='sr-only'>
				Report
			</h2>
			<TwoColumnLayout sidebar={sidebar} main={main} sidebarAside />
		</section>
	);
}
