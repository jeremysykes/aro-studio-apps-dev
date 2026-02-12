import React from 'react';
import type { InspectReport } from '../types';
import { ReportTable, type ReportTableColumn } from './ReportTable';

type Component = InspectReport['components'][number];

const COLUMNS: ReportTableColumn<Component>[] = [
	{ key: 'name', header: 'Name', render: (c) => c.name },
	{
		key: 'surfaces',
		header: 'Surfaces',
		render: (c) =>
			[
				c.surfaces.figma && 'Figma',
				c.surfaces.storybook && 'Storybook',
				c.surfaces.code && 'Code',
			]
				.filter(Boolean)
				.join(', ') || '—',
	},
	{ key: 'coverage', header: 'Coverage', render: (c) => c.coverage.join(', ') },
	{ key: 'orphan', header: 'Orphan', render: (c) => (c.isOrphan ? 'Yes' : 'No') },
];

export interface ComponentInventoryTableProps {
	components: InspectReport['components'];
}

export function ComponentInventoryTable({
	components,
}: ComponentInventoryTableProps) {
	return (
		<ReportTable
			title="Component inventory"
			columns={COLUMNS}
			rows={components}
			getRowKey={(c) => c.name}
		/>
	);
}
