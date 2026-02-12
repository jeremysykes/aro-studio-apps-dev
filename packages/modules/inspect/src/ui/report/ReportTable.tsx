import React, { useState, useMemo } from 'react';
import {
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@aro/desktop/components';

export interface ReportTableColumn<T> {
	key: string;
	header: string;
	render: (row: T) => React.ReactNode;
	sortable?: boolean;
	sortValue?: (row: T) => string | number;
}

export interface ReportTableProps<T> {
	title: string;
	columns: ReportTableColumn<T>[];
	rows: T[];
	getRowKey: (row: T) => string;
	getSearchableText?: (row: T) => string;
	filter?: string;
}

export function ReportTable<T>({
	title,
	columns,
	rows,
	getRowKey,
	getSearchableText,
	filter = '',
}: ReportTableProps<T>) {
	const [sortKey, setSortKey] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

	const handleSort = (key: string) => {
		const col = columns.find((c) => c.key === key);
		if (!col?.sortable || !col.sortValue) return;
		setSortKey(key);
		setSortDir((d) => (sortKey === key && d === 'asc' ? 'desc' : 'asc'));
	};

	const filteredRows = useMemo(() => {
		if (!getSearchableText || !filter.trim()) return rows;
		const q = filter.trim().toLowerCase();
		return rows.filter((row) =>
			getSearchableText(row).toLowerCase().includes(q),
		);
	}, [rows, filter, getSearchableText]);

	const sortedRows = useMemo(() => {
		if (!sortKey) return filteredRows;
		const col = columns.find((c) => c.key === sortKey);
		if (!col?.sortValue) return filteredRows;
		return [...filteredRows].sort((a, b) => {
			const va = col.sortValue!(a);
			const vb = col.sortValue!(b);
			const cmp =
				typeof va === 'number' && typeof vb === 'number'
					? va - vb
					: String(va).localeCompare(String(vb));
			return sortDir === 'asc' ? cmp : -cmp;
		});
	}, [filteredRows, sortKey, sortDir, columns]);

	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((col) => {
							const sortable = col.sortable && col.sortValue;
							const isSorted = sortKey === col.key;
							return (
								<TableHead key={col.key} scope="col">
									{sortable ? (
										<Button
											type="button"
											variant="ghost"
											size="xs"
											className="h-auto p-0 font-medium hover:underline"
											onClick={() => handleSort(col.key)}
											aria-label={`Sort by ${col.header}`}
											aria-sort={
												isSorted
													? sortDir === 'asc'
														? 'ascending'
														: 'descending'
													: undefined
											}
										>
											{col.header}
											{isSorted && (
												<span className="ml-1 text-muted-foreground">
													{sortDir === 'asc' ? '↑' : '↓'}
												</span>
											)}
										</Button>
									) : (
										col.header
									)}
								</TableHead>
							);
						})}
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedRows.map((row) => (
						<TableRow key={getRowKey(row)}>
							{columns.map((col) => (
							<TableCell key={col.key} className="py-3">
								{col.render(row)}
							</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
