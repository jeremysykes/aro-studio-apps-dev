import React from 'react';
import { Skeleton } from '@aro/ui/components';
import { TableSkeleton } from '../components/TableSkeleton';
import type { ReportTab } from '../types';

export interface ReportContentSkeletonProps {
	reportTab: ReportTab;
}

/** Dashboard (health) tab: card-style skeleton mirroring HealthDashboard layout. */
function DashboardSkeleton() {
	return (
		<div
			className="min-h-full flex flex-col items-center justify-center p-6"
			aria-busy
			aria-label="Loading report"
		>
			<div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-8 min-[900px]:items-start w-full max-w-4xl">
				{/* Left: Health score */}
				<div className="min-[900px]:flex min-[900px]:flex-col min-[900px]:items-center min-[900px]:text-center min-[900px]:min-h-0">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="mt-2 h-12 w-20" />
					<Skeleton className="mt-2 h-4 w-32" />
					<Skeleton className="mt-3 h-2 w-full max-w-[200px] rounded-full" />
					<Skeleton className="mt-3 h-4 w-48" />
				</div>
				{/* Right: Score breakdown + findings */}
				<div className="min-[900px]:flex min-[900px]:flex-col min-[900px]:items-center min-[900px]:min-h-0">
					<div className="w-full max-w-sm">
						<Skeleton className="h-4 w-32" />
						<div className="mt-3 space-y-3">
							{Array.from({ length: 4 }, (_, i) => (
								<div key={i}>
									<div className="flex items-baseline justify-between mb-1 gap-2">
										<Skeleton className="h-3 flex-1 max-w-[180px]" />
										<Skeleton className="h-3 w-8 shrink-0" />
									</div>
									<Skeleton className="h-1.5 w-full rounded-full" />
								</div>
							))}
						</div>
						<Skeleton className="my-4 h-px w-full" />
						<Skeleton className="h-4 w-40" />
						<div className="mt-2 flex flex-wrap gap-2">
							<Skeleton className="h-6 w-20 rounded-md" />
							<Skeleton className="h-6 w-24 rounded-md" />
							<Skeleton className="h-6 w-16 rounded-md" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton for the report content area: dashboard layout for health tab,
 * generic table skeleton for Tokens and Components tabs.
 */
export function ReportContentSkeleton({ reportTab }: ReportContentSkeletonProps) {
	if (reportTab === 'health') {
		return <DashboardSkeleton />;
	}

	if (reportTab === 'tokens' || reportTab === 'components') {
		return (
			<TableSkeleton
				columns={5}
				rows={5}
				ariaLabel="Loading report"
			/>
		);
	}

	return null;
}
