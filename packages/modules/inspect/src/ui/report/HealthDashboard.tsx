import React from 'react';
import { Button } from '@aro/desktop/components';
import type { InspectReport } from '../types';

const EXPORT_OPTIONS = [
	{ label: 'Export CSV', onClickKey: 'csv' as const },
	{ label: 'Export Markdown', onClickKey: 'markdown' as const },
] as const;

export interface HealthDashboardProps {
	report: InspectReport;
	onExportCsv: () => void;
	onExportMarkdown: () => void;
	canExport: boolean;
}

export function HealthDashboard({
	report,
	onExportCsv,
	onExportMarkdown,
	canExport,
}: HealthDashboardProps) {
	const exportHandlers = { csv: onExportCsv, markdown: onExportMarkdown };
	return (
		<div>
			<p className="text-lg font-medium">Health score</p>
			<p className="mt-2">
				Composite: <strong>{report.healthScore.composite}</strong> out of 100
			</p>
			<ul className="list-disc pl-6 mt-2 space-y-1">
				<li>Token consistency: {report.healthScore.tokenConsistency}</li>
				<li>Component coverage: {report.healthScore.componentCoverage}</li>
				<li>Naming alignment: {report.healthScore.namingAlignment}</li>
				<li>Value parity: {report.healthScore.valueParity}</li>
			</ul>
			<p className="mt-4 font-medium">Findings by severity</p>
			<ul className="list-disc pl-6">
				<li>
					Critical: {report.summary.findingsBySeverity?.critical ?? 0}
				</li>
				<li>Warning: {report.summary.findingsBySeverity?.warning ?? 0}</li>
				<li>Info: {report.summary.findingsBySeverity?.info ?? 0}</li>
			</ul>
			<div className="mt-4 flex gap-2">
				{EXPORT_OPTIONS.map((opt) => (
					<Button
						key={opt.onClickKey}
						type="button"
						variant="outline"
						disabled={!canExport}
						onClick={exportHandlers[opt.onClickKey]}
					>
						{opt.label}
					</Button>
				))}
			</div>
		</div>
	);
}
