import React from 'react';
import { Button } from '@aro/desktop/components';
import type { InspectReport, ReportTab } from '../types';
import { HealthDashboard } from './HealthDashboard';
import { TokenInventoryTable } from './TokenInventoryTable';
import { ComponentInventoryTable } from './ComponentInventoryTable';

const REPORT_TABS: Array<{
	id: ReportTab;
	label: string;
	getDisabled: (report: InspectReport) => boolean;
}> = [
	{ id: 'health', label: 'Health Dashboard', getDisabled: () => false },
	{
		id: 'tokens',
		label: 'Token Inventory',
		getDisabled: (r) => !r.tokens?.length,
	},
	{
		id: 'components',
		label: 'Component Inventory',
		getDisabled: (r) => !r.components?.length,
	},
];

export interface ReportContentProps {
	report: InspectReport;
	reportTab: ReportTab;
	onReportTabChange: (tab: ReportTab) => void;
	onExportCsv: () => void;
	onExportMarkdown: () => void;
	canExport: boolean;
}

export function ReportContent({
	report,
	reportTab,
	onReportTabChange,
	onExportCsv,
	onExportMarkdown,
	canExport,
}: ReportContentProps) {
	return (
		<>
			<div
				className="flex gap-2 mb-4"
				role="tablist"
				aria-label="Report tabs"
			>
				{REPORT_TABS.map((tab) => (
					<Button
						key={tab.id}
						type="button"
						variant={reportTab === tab.id ? 'default' : 'outline'}
						disabled={tab.getDisabled(report)}
						onClick={() => onReportTabChange(tab.id)}
						role="tab"
						aria-selected={reportTab === tab.id}
					>
						{tab.label}
					</Button>
				))}
			</div>
			{reportTab === 'health' && (
				<HealthDashboard
					report={report}
					onExportCsv={onExportCsv}
					onExportMarkdown={onExportMarkdown}
					canExport={canExport}
				/>
			)}
			{reportTab === 'tokens' && (
				<TokenInventoryTable tokens={report.tokens ?? []} />
			)}
			{reportTab === 'components' && (
				<ComponentInventoryTable components={report.components ?? []} />
			)}
		</>
	);
}
