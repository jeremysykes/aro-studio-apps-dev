import React, { type RefObject } from 'react';
import {
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	Skeleton,
} from '@aro/desktop/components';
import { RunsListbox } from '../components/RunsListbox';
import { TwoColumnLayout, CARD_CLASS, CARD_CONTENT_CLASS } from '../components/TwoColumnLayout';
import { ReportContent, REPORT_TABS } from '../report/ReportContent';
import { formatRunLabel } from '../lib/format';
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
			<CardHeader>
				<CardTitle>Runs</CardTitle>
			</CardHeader>
			<CardContent className={CARD_CONTENT_CLASS}>
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
						listboxRef={listboxRef}
						ariaLabel="Runs"
					/>
				)}
			</CardContent>
		</Card>
	);

	const main = (
		<Card className={`${CARD_CLASS} flex flex-col`}>
			<CardHeader className="shrink-0 flex flex-row items-center justify-between gap-4">
				<CardTitle className="mb-0">Reports</CardTitle>
				<div
					className="flex gap-2 shrink-0"
					role="tablist"
					aria-label="Report tabs"
				>
					{REPORT_TABS.map((tab) => (
						<Button
							key={tab.id}
							type="button"
							variant={reportTab === tab.id ? 'secondary' : 'outline'}
							disabled={report ? tab.getDisabled(report) : true}
							onClick={() => onReportTabChange(tab.id)}
							role="tab"
							aria-selected={reportTab === tab.id}
						>
							{tab.label}
						</Button>
					))}
				</div>
			</CardHeader>
			<CardContent
				className={`${CARD_CONTENT_CLASS} flex-1 min-h-0 overflow-y-auto`}
			>
				{reportLoadState === 'loading' && (
					<p className="text-muted-foreground">Loading report…</p>
				)}
				{reportLoadState === 'error' && (
					<p className="text-muted-foreground">
						Report not available for this run.
					</p>
				)}
				{reportLoadState === 'success' && report && (
					<ReportContent report={report} reportTab={reportTab} />
				)}
				{!selectedRunId && (
					<p className="text-muted-foreground text-sm">
						Select a run from the list to view its report. Each run includes a
						health dashboard, token inventory, and component inventory. Runs
						with a completed scan will show the full report here.
					</p>
				)}
			</CardContent>
			{reportLoadState === 'success' && report && reportTab === 'health' && (
				<CardFooter className="shrink-0 flex items-center justify-end gap-2 py-4 px-6">
					<Button
						type="button"
						variant="outline"
						disabled={!canExport}
						onClick={onExportCsv}
					>
						Export CSV
					</Button>
					<Button
						type="button"
						variant="outline"
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
