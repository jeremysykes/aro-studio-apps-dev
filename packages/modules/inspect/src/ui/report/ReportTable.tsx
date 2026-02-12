import React from 'react';

const TH_CLASS = 'text-left border p-2';
const TD_CLASS = 'border p-2';

export interface ReportTableColumn<T> {
	key: string;
	header: string;
	render: (row: T) => React.ReactNode;
}

export interface ReportTableProps<T> {
	title: string;
	columns: ReportTableColumn<T>[];
	rows: T[];
	getRowKey: (row: T) => string;
}

export function ReportTable<T>({
	title,
	columns,
	rows,
	getRowKey,
}: ReportTableProps<T>) {
	return (
		<div className="overflow-x-auto">
			<p className="font-medium mb-2">{title}</p>
			<table className="w-full text-sm border-collapse">
				<thead>
					<tr>
						{columns.map((col) => (
							<th key={col.key} scope="col" className={TH_CLASS}>
								{col.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={getRowKey(row)}>
							{columns.map((col) => (
								<td key={col.key} className={TD_CLASS}>
									{col.render(row)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
