import React from 'react';
import type { InspectReport } from '../types';

export interface HealthDashboardProps {
	report: InspectReport;
}

export function HealthDashboard({ report }: HealthDashboardProps) {
	return (
		<div className='min-h-full flex flex-col items-center justify-center'>
			<div className='grid grid-cols-1 min-[900px]:grid-cols-2 gap-8 min-[900px]:items-start w-full max-w-4xl'>
				{/* Left: Health score — single focal point, centred horizontally */}
				<div className='min-[900px]:flex min-[900px]:flex-col min-[900px]:items-center min-[900px]:text-center min-[900px]:min-h-0'>
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

			{/* Right: Score breakdown; block centred in column, text left-aligned */}
			<div className='min-[900px]:flex min-[900px]:flex-col min-[900px]:items-center min-[900px]:min-h-0'>
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
			</div>
			</div>
		</div>
	);
}
