import React from 'react';
import { Badge } from '@aro/desktop/components';
import type { InspectReport } from '../types';

export interface HealthDashboardProps {
	report: InspectReport;
}

export function HealthDashboard({ report }: HealthDashboardProps) {
	const findings = report.summary.findingsBySeverity ?? {};
	const critical = findings.critical ?? 0;
	const warning = findings.warning ?? 0;
	const info = findings.info ?? 0;

	return (
		<div className='grid grid-cols-1 min-[900px]:grid-cols-2 gap-8 min-[900px]:items-stretch'>
			{/* Left: Health score — single focal point, centred in column */}
			<div className='min-[900px]:flex min-[900px]:flex-col min-[900px]:justify-center min-[900px]:items-center min-[900px]:text-center min-[900px]:min-h-0'>
				<p className='text-sm font-medium text-muted-foreground'>
					Health score
				</p>
				<p className='mt-0.5 tabular-nums'>
					<span className='text-5xl font-semibold'>
						{report.healthScore.composite}
					</span>
					<span className='text-lg font-normal text-muted-foreground'>
						{' '}
						/ 100
					</span>
				</p>
				<p className='sr-only'>
					Composite health score: {report.healthScore.composite} out of 100
				</p>
			</div>

			{/* Right: Score breakdown + severity, vertically centred */}
			<div className='space-y-6 min-[900px]:flex min-[900px]:flex-col min-[900px]:justify-center min-[900px]:min-h-0'>
				<section aria-labelledby='score-breakdown-heading'>
					<h2
						id='score-breakdown-heading'
						className='text-sm font-medium text-muted-foreground'
					>
						Score breakdown
					</h2>
					<ul className='text-xs mt-2 list-disc space-y-0.5 pl-6' role='list'>
						<li>Token consistency: {report.healthScore.tokenConsistency}</li>
						<li>Component coverage: {report.healthScore.componentCoverage}</li>
						<li>Naming alignment: {report.healthScore.namingAlignment}</li>
						<li>Value parity: {report.healthScore.valueParity}</li>
					</ul>
				</section>

				<section aria-labelledby='findings-heading'>
					<h2
						id='findings-heading'
						className='text-sm font-medium text-muted-foreground'
					>
						Findings by severity
					</h2>
					<div className='mt-2 flex flex-wrap gap-2'>
						<Badge
							className='rounded-full text-xs shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05)] border-transparent bg-red-50 text-red-300'
							aria-label={`Critical: ${critical}`}
						>
							{critical} Critical
						</Badge>
						<Badge
							className='rounded-full text-xs shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05)] border-transparent bg-yellow-50 text-yellow-300'
							aria-label={`Warning: ${warning}`}
						>
							{warning} Warning
						</Badge>
						<Badge
							className='rounded-full text-xs shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05)] border-transparent bg-blue-50 text-blue-300'
							aria-label={`Info: ${info}`}
						>
							{info} Info
						</Badge>
					</div>
				</section>
			</div>
		</div>
	);
}
