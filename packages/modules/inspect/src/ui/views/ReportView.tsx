import React, { type RefObject } from 'react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Skeleton,
} from '@aro/desktop/components';
import { RunsListbox } from '../components/RunsListbox';
import { ReportContent } from '../report/ReportContent';
import type { RunItem, InspectReport, ReportTab } from '../types';

export interface ReportViewProps {
	runs: RunItem[];
	runsWithReport: string[];
	runsWithReportLoading: boolean;
	selectedRunId: string | null;
	focusedRunId: string | null;
	report: InspectReport | null;
	reportLoadState: 'idle' | 'loading' | 'success' | 'error';
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

	return (
		<section aria-labelledby="report-heading">
			<h2 id="report-heading" className="sr-only">
				Report
			</h2>
			<div className="grid grid-cols-1 min-[900px]:grid-cols-[20rem_1fr] min-[900px]:grid-rows-[minmax(0,1fr)] min-[900px]:max-h-[calc(100vh-12rem)] min-[900px]:min-h-0 gap-4">
				<aside
					aria-label="Run selection"
					className="min-[900px]:flex min-[900px]:flex-col min-[900px]:min-h-0"
				>
					<Card className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:flex min-[900px]:flex-col min-[900px]:overflow-hidden">
						<CardHeader>
							<CardTitle>Runs</CardTitle>
						</CardHeader>
						<CardContent className="min-[900px]:overflow-y-auto min-[900px]:min-h-0 min-w-0">
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
									getOptionLabel={(run) =>
										`${run.id} — ${new Date(run.startedAt).toLocaleString()}`
									}
									listboxRef={listboxRef}
									ariaLabel="Runs"
								/>
							)}
						</CardContent>
					</Card>
				</aside>
				<div className="min-[900px]:flex min-[900px]:flex-col min-[900px]:min-h-0 min-[900px]:min-w-0">
					<Card className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:flex min-[900px]:flex-col min-[900px]:overflow-hidden">
						<CardHeader>
							<CardTitle>Reports</CardTitle>
						</CardHeader>
						<CardContent className="min-[900px]:overflow-y-auto min-[900px]:min-h-0 min-w-0">
							{reportLoadState === 'loading' && (
								<p className="text-muted-foreground">Loading report…</p>
							)}
							{reportLoadState === 'error' && (
								<p className="text-muted-foreground">
									Report not available for this run.
								</p>
							)}
							{reportLoadState === 'success' && report && (
								<ReportContent
									report={report}
									reportTab={reportTab}
									onReportTabChange={onReportTabChange}
									onExportCsv={onExportCsv}
									onExportMarkdown={onExportMarkdown}
									canExport={canExport}
								/>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
