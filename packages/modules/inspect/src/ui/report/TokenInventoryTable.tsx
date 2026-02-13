import React from 'react';
import type { InspectReport } from '../types';
import { ReportTable, type ReportTableColumn } from './ReportTable';

type Token = InspectReport['tokens'][number];

/* ── Color swatch: detect hex/rgb values and render a small square ── */
const COLOR_REGEX = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+[\s,]+\d+[\s,]+\d+[^)]*\))$/;

function ColorSwatch({ value }: { value: string }) {
	const trimmed = value.trim();
	if (!COLOR_REGEX.test(trimmed)) return null;
	return (
		<span
			className='inline-block w-3 h-3 rounded-sm border border-zinc-200 mr-1.5 align-middle shrink-0'
			style={{ backgroundColor: trimmed }}
			aria-hidden='true'
		/>
	);
}

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
		render: (t) => (
			<span className='inline-flex items-center'>
				<ColorSwatch value={t.value} />
				{t.value}
			</span>
		),
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
