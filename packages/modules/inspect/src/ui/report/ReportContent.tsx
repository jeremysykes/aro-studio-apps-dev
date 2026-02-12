import React from 'react';
import { Button } from '@aro/desktop/components';
import type { InspectReport, ReportTab } from '../types';
import { HealthDashboard } from './HealthDashboard';
import { TokenInventoryTable } from './TokenInventoryTable';
import { ComponentInventoryTable } from './ComponentInventoryTable';

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
				<Button
					type="button"
					variant={reportTab === 'health' ? 'default' : 'outline'}
					onClick={() => onReportTabChange('health')}
					role="tab"
					aria-selected={reportTab === 'health'}
				>
					Health Dashboard
				</Button>
				<Button
					type="button"
					variant={reportTab === 'tokens' ? 'default' : 'outline'}
					disabled={!report.tokens?.length}
					onClick={() => onReportTabChange('tokens')}
					role="tab"
					aria-selected={reportTab === 'tokens'}
				>
					Token Inventory
				</Button>
				<Button
					type="button"
					variant={reportTab === 'components' ? 'default' : 'outline'}
					disabled={!report.components?.length}
					onClick={() => onReportTabChange('components')}
					role="tab"
					aria-selected={reportTab === 'components'}
				>
					Component Inventory
				</Button>
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
