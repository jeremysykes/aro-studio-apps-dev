import React from 'react';
import type { InspectReport } from '../types';
import { ReportTable, type ReportTableColumn } from './ReportTable';

type Component = InspectReport['components'][number];

function surfacesText(c: Component): string {
	return (
		[
			c.surfaces.figma && 'Figma',
			c.surfaces.storybook && 'Storybook',
			c.surfaces.code && 'Code',
		]
			.filter(Boolean)
			.join(', ') || '—'
	);
}

const COLUMNS: ReportTableColumn<Component>[] = [
	{
		key: 'name',
		header: 'Name',
		render: (c) => c.name,
		sortable: true,
		sortValue: (c) => c.name,
	},
	{
		key: 'category',
		header: 'Category',
		render: (c) => c.category ?? 'Unknown',
		sortable: true,
		sortValue: (c) => c.category ?? '',
	},
	{
		key: 'surfaces',
		header: 'Surfaces',
		render: (c) => surfacesText(c),
		sortable: true,
		sortValue: (c) => surfacesText(c),
	},
	{
		key: 'coverage',
		header: 'Coverage',
		render: (c) => c.coverage.join(', '),
		sortable: true,
		sortValue: (c) => c.coverage.join(', '),
	},
	{
		key: 'orphan',
		header: 'Orphan',
		render: (c) => (c.isOrphan ? 'Yes' : 'No'),
		sortable: true,
		sortValue: (c) => (c.isOrphan ? 1 : 0),
	},
];

export interface ComponentInventoryTableProps {
	components: InspectReport['components'];
	filter?: string;
}

export function ComponentInventoryTable({
	components,
	filter,
}: ComponentInventoryTableProps) {
	return (
		<ReportTable
			title="Components"
			columns={COLUMNS}
			rows={components}
			getRowKey={(c) => c.name}
			getSearchableText={(c) =>
				[
					c.name,
					c.category ?? 'unknown',
					surfacesText(c),
					c.coverage.join(' '),
					c.isOrphan ? 'orphan' : '',
				].join(' ')
			}
			filter={filter}
		/>
	);
}
