import React from 'react';
import type { InspectReport } from '../types';
import { ReportTable, type ReportTableColumn } from './ReportTable';

type Token = InspectReport['tokens'][number];

const COLUMNS: ReportTableColumn<Token>[] = [
	{
		key: 'name',
		header: 'Name',
		render: (t) => t.name,
		sortable: true,
		sortValue: (t) => t.name,
	},
	{
		key: 'value',
		header: 'Value',
		render: (t) => t.value,
		sortable: true,
		sortValue: (t) => t.value,
	},
	{
		key: 'type',
		header: 'Type',
		render: (t) => t.type,
		sortable: true,
		sortValue: (t) => t.type,
	},
	{
		key: 'source',
		header: 'Source',
		render: (t) => t.source,
		sortable: true,
		sortValue: (t) => t.source,
	},
];

export interface TokenInventoryTableProps {
	tokens: InspectReport['tokens'];
	filter?: string;
}

export function TokenInventoryTable({ tokens, filter }: TokenInventoryTableProps) {
	return (
		<ReportTable
			title="Tokens"
			columns={COLUMNS}
			rows={tokens}
			getRowKey={(t) => t.name}
			getSearchableText={(t) =>
				[t.name, t.value, t.type, t.source].join(' ')
			}
			filter={filter}
		/>
	);
}
