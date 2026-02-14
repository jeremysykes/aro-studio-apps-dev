import React from 'react';
import {
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@aro/ui/components';

const DEFAULT_ROWS = 5;

export interface TableSkeletonProps {
	/** Number of columns (e.g. 2 for runs, 5 for report tables). */
	columns: number;
	/** Number of body rows. Default 5. */
	rows?: number;
	/** Announced to assistive technologies when present; wrapper gets aria-busy="true" and this label. */
	ariaLabel?: string;
}

/**
 * Reusable semantic table skeleton for loading states. Used by runs sidebar and report table tabs (Tokens/Components).
 */
export function TableSkeleton({
	columns,
	rows = DEFAULT_ROWS,
	ariaLabel,
}: TableSkeletonProps) {
	const rowCount = Math.max(1, rows);
	const colCount = Math.max(1, columns);

	const wrapperProps = ariaLabel
		? { 'aria-busy': true as const, 'aria-label': ariaLabel }
		: undefined;

	return (
		<div {...wrapperProps}>
			<Table>
				<TableHeader>
					<TableRow>
						{Array.from({ length: colCount }, (_, i) => (
							<TableHead key={i} scope="col">
								<Skeleton
									className={
										i === 0 ? 'h-4 w-16' : i === colCount - 1 ? 'h-4 w-12' : 'h-4 w-20'
									}
								/>
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: rowCount }, (_, rowIndex) => (
						<TableRow key={rowIndex}>
							{Array.from({ length: colCount }, (_, colIndex) => (
								<TableCell key={colIndex} className="py-3">
									<Skeleton
										className={
											colIndex === 0
												? 'h-4 flex-1 min-w-[60px]'
												: colIndex === colCount - 1
													? 'h-4 w-16'
													: 'h-4 w-24'
										}
									/>
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
