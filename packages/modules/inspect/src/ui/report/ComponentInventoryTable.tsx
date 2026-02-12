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

function storybookStoryUrl(baseUrl: string, storyId: string): string {
	return `${baseUrl}?path=/story/${storyId}`;
}

function getColumns(
	storybookBaseUrl: string | undefined,
): ReportTableColumn<Component>[] {
	return [
		{
			key: 'name',
			header: 'Name',
			render: (c) => {
				const displayName =
					c.coverage.includes('figma') && c.layerName
						? `${c.layerName}, ${c.name}`
						: c.name;
				const hasStorybook =
					c.surfaces.storybook ?? c.coverage.includes('storybook');
				const storyId = c.storyIds?.[0];
				if (storybookBaseUrl && hasStorybook && storyId) {
					return (
						<a
							href={storybookStoryUrl(storybookBaseUrl, storyId)}
							target='_blank'
							rel='noopener noreferrer'
							className='text-[11px] text-primary hover:underline font-medium cursor-pointer'
						>
							{displayName}
						</a>
					);
				}
				return displayName;
			},
			sortable: true,
			sortValue: (c) =>
				c.coverage.includes('figma') && c.layerName
					? `${c.layerName}, ${c.name}`
					: c.name,
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
}

export interface ComponentInventoryTableProps {
	components: InspectReport['components'];
	filter?: string;
	storybookBaseUrl?: string;
}

export function ComponentInventoryTable({
	components,
	filter,
	storybookBaseUrl,
}: ComponentInventoryTableProps) {
	return (
		<ReportTable
			title='Components'
			columns={getColumns(storybookBaseUrl)}
			rows={components}
			getRowKey={(c) =>
				c.layerName ? `${c.layerName}/${c.name}` : c.name
			}
			getSearchableText={(c) =>
				[
					c.name,
					c.layerName ?? '',
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
