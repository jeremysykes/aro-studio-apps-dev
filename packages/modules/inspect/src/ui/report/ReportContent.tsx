import React from 'react';
import type { InspectReport, ReportTab } from '../types';
import { HealthDashboard } from './HealthDashboard';
import { TokenInventoryTable } from './TokenInventoryTable';
import { ComponentInventoryTable } from './ComponentInventoryTable';

export const REPORT_TABS: Array<{
	id: ReportTab;
	label: string;
	getDisabled: (report: InspectReport) => boolean;
	getDisabledReason?: (report: InspectReport) => string;
}> = [
	{ id: 'health', label: 'Dashboard', getDisabled: () => false },
	{
		id: 'tokens',
		label: 'Tokens',
		getDisabled: (r) => !r.tokens?.length,
		getDisabledReason: () => 'No token data for this run',
	},
	{
		id: 'components',
		label: 'Components',
		getDisabled: (r) => !r.components?.length,
		getDisabledReason: () => 'No component data for this run',
	},
];

export interface ReportContentProps {
	report: InspectReport;
	reportTab: ReportTab;
}

export function ReportContent({ report, reportTab }: ReportContentProps) {
	return (
		<>
			{reportTab === 'health' && <HealthDashboard report={report} />}
			{reportTab === 'tokens' && (
				<TokenInventoryTable tokens={report.tokens ?? []} />
			)}
			{reportTab === 'components' && (
				<ComponentInventoryTable components={report.components ?? []} />
			)}
		</>
	);
}
