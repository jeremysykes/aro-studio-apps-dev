import React from 'react';
import { Badge, Progress, Separator, Tooltip, TooltipContent, TooltipTrigger } from '@aro/ui/components';
import type { InspectReport, Finding, FindingSeverity } from '../types';

export interface HealthDashboardProps {
	report: InspectReport;
}

/* ── Score level label ── */
function scoreLabel(score: number): string {
	if (score >= 80) return 'Good';
	if (score >= 60) return 'Fair';
	return 'Needs attention';
}

/* ── Sub-score breakdown config ── */
const SUB_SCORES: {
	key: keyof InspectReport['healthScore'];
	label: string;
	weight: string;
	description: string;
}[] = [
	{ key: 'tokenConsistency', label: 'Token consistency', weight: '30%', description: 'Measures how free your tokens are from duplicates and value drift across sources.' },
	{ key: 'componentCoverage', label: 'Component coverage', weight: '30%', description: 'Percentage of components that exist in 2 or more surfaces (Figma, Storybook, Code).' },
	{ key: 'namingAlignment', label: 'Naming alignment', weight: '20%', description: 'How many token names are shared across multiple sources. Higher means more consistent naming.' },
	{ key: 'valueParity', label: 'Value parity', weight: '20%', description: 'Of tokens shared across sources, how many have identical values everywhere.' },
];

/* ── Info icon for tooltip trigger ── */
const InfoIcon = () => (
	<svg
		width='12'
		height='12'
		viewBox='0 0 16 16'
		fill='none'
		aria-hidden='true'
		className='inline-block ml-1 align-[-1px] text-zinc-400'
	>
		<circle cx='8' cy='8' r='6.5' stroke='currentColor' strokeWidth='1.5' />
		<path d='M8 7v4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
		<circle cx='8' cy='5' r='0.75' fill='currentColor' />
	</svg>
);

/* ── Group findings by category for tooltip summaries ── */
const CATEGORY_LABELS: Record<string, string> = {
	'token-drift': 'token drift',
	'token-duplicate': 'duplicate tokens',
	'token-dead': 'dead tokens',
	'token-naming': 'naming issues',
	'component-orphan': 'orphan components',
	'component-parity': 'parity issues',
};

function groupFindingsByCategory(findings: Finding[], severity: FindingSeverity): string[] {
	const counts = new Map<string, number>();
	for (const f of findings) {
		if (f.severity !== severity) continue;
		counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
	}
	return Array.from(counts.entries()).map(
		([cat, count]) => `${count} ${CATEGORY_LABELS[cat] ?? cat}`,
	);
}

/* ── Severity config — icon + Badge variant ── */
const SEVERITY_CONFIG: Record<
	FindingSeverity,
	{ label: string; variant: 'destructive' | 'outline' | 'secondary'; icon: React.ReactNode }
> = {
	critical: {
		label: 'Critical',
		variant: 'destructive',
		icon: (
			<svg
				width='14'
				height='14'
				viewBox='0 0 16 16'
				fill='none'
				aria-hidden='true'
				className='inline-block mr-1 align-[-2px]'
			>
				<path
					d='M5.27 1h5.46L15 5.27v5.46L10.73 15H5.27L1 10.73V5.27L5.27 1z'
					stroke='currentColor'
					strokeWidth='1.5'
					strokeLinejoin='round'
				/>
				<path d='M8 4.5v4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
				<circle cx='8' cy='11' r='0.75' fill='currentColor' />
			</svg>
		),
	},
	warning: {
		label: 'Warning',
		variant: 'secondary',
		icon: (
			<svg
				width='14'
				height='14'
				viewBox='0 0 16 16'
				fill='none'
				aria-hidden='true'
				className='inline-block mr-1 align-[-2px]'
			>
				<path
					d='M7.13 2.5a1 1 0 0 1 1.74 0l5.5 9.5A1 1 0 0 1 13.5 14h-11a1 1 0 0 1-.87-1.5l5.5-9.5z'
					stroke='currentColor'
					strokeWidth='1.5'
					strokeLinejoin='round'
				/>
				<path d='M8 6.5v3' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
				<circle cx='8' cy='11.5' r='0.75' fill='currentColor' />
			</svg>
		),
	},
	info: {
		label: 'Info',
		variant: 'secondary',
		icon: (
			<svg
				width='14'
				height='14'
				viewBox='0 0 16 16'
				fill='none'
				aria-hidden='true'
				className='inline-block mr-1 align-[-2px]'
			>
				<circle cx='8' cy='8' r='6.5' stroke='currentColor' strokeWidth='1.5' />
				<path d='M8 7v4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
				<circle cx='8' cy='5' r='0.75' fill='currentColor' />
			</svg>
		),
	},
};

export function HealthDashboard({ report }: HealthDashboardProps) {
	const { healthScore, summary } = report;

	const hasNAScores = SUB_SCORES.some(
		({ key }) => healthScore[key] === -1,
	);

	return (
		<div className='min-h-full flex flex-col items-center justify-center'>
			<div className='grid grid-cols-1 min-[900px]:grid-cols-2 gap-8 min-[900px]:items-start w-full max-w-4xl'>
				{/* ── Left: Health score — single focal point ── */}
				<div className='flex flex-col items-center text-center min-[900px]:min-h-0'>
					<p className='text-sm font-medium text-zinc-500'>Health score</p>

					{/* Score value */}
					<p className='mt-1 tabular-nums'>
						<span className='text-5xl font-semibold text-zinc-900'>
							{healthScore.composite}
						</span>
						<span className='text-lg font-normal text-zinc-400'> / 100</span>
					</p>

					{/* Level label */}
					<p className='mt-1 text-sm text-zinc-500'>
						{scoreLabel(healthScore.composite)}
					</p>
					<p className='sr-only'>
						Composite health score: {healthScore.composite} out of 100.{' '}
						{scoreLabel(healthScore.composite)}.
					</p>

					{/* Progress bar */}
					<div className='mt-3 w-full max-w-[200px]'>
						<Progress
							value={healthScore.composite}
							aria-label={`Health score: ${healthScore.composite} out of 100`}
						/>
					</div>

					{/* Summary stats */}
					<p className='mt-3 text-sm text-zinc-500'>
						{summary.totalTokens} token{summary.totalTokens !== 1 ? 's' : ''} &middot;{' '}
						{summary.totalComponents} component{summary.totalComponents !== 1 ? 's' : ''} &middot;{' '}
						{report.findings.length} finding{report.findings.length !== 1 ? 's' : ''}
					</p>
				</div>

				{/* ── Right: Breakdown + findings ── */}
				<div className='flex flex-col min-[900px]:items-center min-[900px]:min-h-0'>
					<div className='w-full max-w-md'>
						{/* Sub-score breakdown */}
						<section aria-labelledby='score-breakdown-heading'>
							<h2
								id='score-breakdown-heading'
								className='text-sm font-medium text-zinc-500'
							>
								Score breakdown
							</h2>
							<div className='mt-3 space-y-3'>
								{SUB_SCORES.map(({ key, label, weight, description }) => {
									const raw =
										key === 'composite'
											? healthScore.composite
											: healthScore[key];
									const isNA = raw === -1;
									return (
										<div key={key}>
											<div className='flex items-baseline justify-between mb-1'>
												<span className={`text-xs flex items-center gap-0 ${isNA ? 'text-zinc-400' : 'text-zinc-700'}`}>
													{label}{' '}
													<span className='text-zinc-400'>({weight})</span>
													<Tooltip>
														<TooltipTrigger asChild>
															<button type='button' className='cursor-help'>
																<InfoIcon />
															</button>
														</TooltipTrigger>
														<TooltipContent side='top' className='max-w-[220px]'>
															{description}
														</TooltipContent>
													</Tooltip>
												</span>
												{isNA ? (
													<span className='text-xs font-medium text-zinc-400'>
														N/A
													</span>
												) : (
													<span className='text-xs font-medium tabular-nums text-zinc-900'>
														{raw}
													</span>
												)}
											</div>
											{isNA ? (
												<div
													className='h-1.5 w-full rounded-full bg-zinc-100'
													aria-label={`${label}: not applicable`}
												/>
											) : (
												<Progress
													value={raw}
													className='h-1.5'
													aria-label={`${label}: ${raw} out of 100`}
												/>
											)}
										</div>
									);
								})}
							</div>
							{hasNAScores && (
								<p className='mt-2 text-[11px] text-zinc-400'>
									N/A scores require multiple sources to measure. Weights are
									redistributed among applicable scores.
								</p>
							)}
						</section>

						<Separator className='my-4' />

						{/* Findings by severity */}
						<section aria-labelledby='findings-severity-heading'>
							<h2
								id='findings-severity-heading'
								className='text-sm font-medium text-zinc-500'
							>
								Findings by severity
							</h2>
							<div className='mt-2 flex flex-wrap gap-2'>
								{(['critical', 'warning', 'info'] as FindingSeverity[]).map(
									(severity) => {
										const count =
											summary.findingsBySeverity[severity] ?? 0;
										const config = SEVERITY_CONFIG[severity];
										const categoryLines = groupFindingsByCategory(report.findings, severity);
										return (
											<Tooltip key={severity}>
												<TooltipTrigger asChild>
													<Badge
														variant={config.variant}
														aria-label={`${config.label}: ${count}`}
														className='cursor-default'
													>
														{config.icon}
														{count} {config.label}
													</Badge>
												</TooltipTrigger>
												{count > 0 && (
													<TooltipContent side='bottom' className='max-w-[240px]'>
														{categoryLines.map((line) => (
															<div key={line}>{line}</div>
														))}
													</TooltipContent>
												)}
											</Tooltip>
										);
									},
								)}
							</div>
							<p className='sr-only'>
								{(['critical', 'warning', 'info'] as FindingSeverity[])
									.map(
										(s) =>
											`${summary.findingsBySeverity[s] ?? 0} ${s}`,
									)
									.join(', ')}{' '}
								findings.
							</p>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
}
