import React, { type RefObject } from 'react';
import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardTitle,
	Skeleton,
	Tabs,
	TabsList,
	TabsTrigger,
} from '@aro/desktop/components';
import { RunsListbox } from '../components/RunsListbox';
import {
	TwoColumnLayout,
	CARD_CLASS,
	CARD_CONTENT_CLASS,
	COLUMN_HEADER_CLASS,
} from '../components/TwoColumnLayout';
import { ReportContent, REPORT_TABS } from '../report/ReportContent';
import { formatRunLabel, formatRunLabelFull } from '../lib/format';
import type { RunItem, InspectReport, ReportTab, ReportLoadState } from '../types';

export interface ReportViewProps {
	runs: RunItem[];
	runsWithReport: string[];
	runsWithReportLoading: boolean;
	selectedRunId: string | null;
	focusedRunId: string | null;
	report: InspectReport | null;
	reportLoadState: ReportLoadState;
	reportTab: ReportTab;
	listboxRef: RefObject<HTMLDivElement | null>;
	onSelectRun: (id: string) => void;
	onFocusChange: (id: string) => void;
	onReportTabChange: (tab: ReportTab) => void;
	onExportCsv: () => void;
	onExportMarkdown: () => void;
	canExport: boolean;
}

export function ReportView({
	runs,
	runsWithReport,
	runsWithReportLoading,
	selectedRunId,
	focusedRunId,
	report,
	reportLoadState,
	reportTab,
	listboxRef,
	onSelectRun,
	onFocusChange,
	onReportTabChange,
	onExportCsv,
	onExportMarkdown,
	canExport,
}: ReportViewProps) {
	const reportRuns = runs.filter((r) => runsWithReport.includes(r.id));

	const sidebar = (
		<Card className={CARD_CLASS}>
			<div className={COLUMN_HEADER_CLASS} role="region" aria-label="Runs">
				<CardTitle className="mb-0 text-base font-medium text-muted-foreground">
					Runs
				</CardTitle>
			</div>
			<CardContent className={`${CARD_CONTENT_CLASS} px-0`}>
				{runsWithReportLoading ? (
					<ul className="list-none space-y-1 min-w-0">
						{Array.from({ length: 6 }, (_, i) => (
							<li key={i} className="min-w-0">
								<Skeleton className="h-10 w-full rounded-md" />
							</li>
						))}
					</ul>
				) : (
					<RunsListbox<RunItem>
						items={reportRuns}
						selectedId={selectedRunId}
						focusedId={focusedRunId}
						onSelect={onSelectRun}
						onFocusChange={onFocusChange}
						optionIdPrefix="runs-report-option-"
						getOptionLabel={(run) => formatRunLabel(run)}
						getOptionTooltip={formatRunLabelFull}
						listboxRef={listboxRef}
						ariaLabel="Runs"
					/>
				)}
			</CardContent>
		</Card>
	);

	const main = (
		<Card className={`${CARD_CLASS} flex flex-col`}>
			<div
				className={`${COLUMN_HEADER_CLASS} justify-between gap-4`}
				role="region"
				aria-label="Reports"
			>
			<CardTitle className="mb-0 text-base font-medium text-muted-foreground">
				Reports
			</CardTitle>
			<Tabs
				value={reportTab}
				onValueChange={(value) => onReportTabChange(value as ReportTab)}
				className="shrink-0"
			>
				<TabsList size="xs" aria-label="Report tabs">
					{REPORT_TABS.map((tab) => (
						<TabsTrigger
							key={tab.id}
							value={tab.id}
							size="xs"
							disabled={report ? tab.getDisabled(report) : true}
						>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			</div>
			<CardContent
				className={`${CARD_CONTENT_CLASS} flex-1 min-h-0 overflow-y-auto pt-6 px-6 pb-6`}
			>
				{reportLoadState === 'loading' && (
					<p className="text-sm text-muted-foreground">Loading report…</p>
				)}
				{reportLoadState === 'error' && (
					<p className="text-sm text-muted-foreground">
						Report not available for this run.
					</p>
				)}
				{reportLoadState === 'success' && report && (
					<ReportContent report={report} reportTab={reportTab} />
				)}
				{!selectedRunId && (
					<p className="text-muted-foreground text-[11px]">
						Select a run from the list to view its report. Each run includes a
						health dashboard, token inventory, and component inventory. Runs
						with a completed scan will show the full report here.
					</p>
				)}
			</CardContent>
			{reportLoadState === 'success' && report && reportTab === 'health' && (
				<CardFooter className="shrink-0 flex items-center justify-end gap-2 border-t border-zinc-200 py-3 px-4">
					<Button
						type="button"
						variant="outline"
						size="xs"
						disabled={!canExport}
						onClick={onExportCsv}
					>
						Export CSV
					</Button>
					<Button
						type="button"
						variant="outline"
						size="xs"
						disabled={!canExport}
						onClick={onExportMarkdown}
					>
						Export Markdown
					</Button>
				</CardFooter>
			)}
		</Card>
	);

	return (
		<section aria-labelledby="report-heading">
			<h2 id="report-heading" className="sr-only">
				Report
			</h2>
			<TwoColumnLayout sidebar={sidebar} main={main} sidebarAside />
		</section>
	);
}
