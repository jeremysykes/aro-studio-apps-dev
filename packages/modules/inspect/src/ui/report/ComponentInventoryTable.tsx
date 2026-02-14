import React from 'react';
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@aro/ui/components';
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
			.join(', ') || '\u2014'
	);
}

function storybookStoryUrl(baseUrl: string, storyId: string): string {
	return `${baseUrl}?path=/story/${storyId}`;
}

/* ── Coverage dots: filled (present) / unfilled (absent) zinc circles ── */
const SURFACES: { key: keyof Component['surfaces']; label: string }[] = [
	{ key: 'figma', label: 'Figma' },
	{ key: 'storybook', label: 'Storybook' },
	{ key: 'code', label: 'Code' },
];

function CoverageDots({ surfaces }: { surfaces: Component['surfaces'] }) {
	return (
		<span className='inline-flex items-center gap-1'>
			{SURFACES.map(({ key, label }) => {
				const present = !!surfaces[key];
				return (
					<Tooltip key={key}>
						<TooltipTrigger asChild>
							<span
								className={`inline-block w-2.5 h-2.5 rounded-full ${present ? 'bg-zinc-900' : 'bg-zinc-200'}`}
								aria-label={`${label}: ${present ? 'present' : 'absent'}`}
							/>
						</TooltipTrigger>
						<TooltipContent>
							{label}: {present ? 'Present' : 'Absent'}
						</TooltipContent>
					</Tooltip>
				);
			})}
		</span>
	);
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
					c.coverage.includes('figma') && c.layerName && c.layerName !== c.name
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
							className='text-[11px] text-zinc-900 hover:underline font-medium cursor-pointer'
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
			render: (c) => <CoverageDots surfaces={c.surfaces} />,
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
			render: (c) =>
				c.isOrphan ? (
					<Badge variant='default'>Orphan</Badge>
				) : (
					<Badge variant='secondary'>No</Badge>
				),
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
