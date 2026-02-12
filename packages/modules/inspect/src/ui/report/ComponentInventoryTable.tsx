import React from 'react';
import type { InspectReport } from '../types';

export interface ComponentInventoryTableProps {
	components: InspectReport['components'];
}

export function ComponentInventoryTable({
	components,
}: ComponentInventoryTableProps) {
	return (
		<div className="overflow-x-auto">
			<p className="font-medium mb-2">Component inventory</p>
			<table className="w-full text-sm border-collapse">
				<thead>
					<tr>
						<th scope="col" className="text-left border p-2">
							Name
						</th>
						<th scope="col" className="text-left border p-2">
							Surfaces
						</th>
						<th scope="col" className="text-left border p-2">
							Coverage
						</th>
						<th scope="col" className="text-left border p-2">
							Orphan
						</th>
					</tr>
				</thead>
				<tbody>
					{components.map((c) => (
						<tr key={c.name}>
							<td className="border p-2">{c.name}</td>
							<td className="border p-2">
								{[
									c.surfaces.figma && 'Figma',
									c.surfaces.storybook && 'Storybook',
									c.surfaces.code && 'Code',
								]
									.filter(Boolean)
									.join(', ') || '—'}
							</td>
							<td className="border p-2">{c.coverage.join(', ')}</td>
							<td className="border p-2">{c.isOrphan ? 'Yes' : 'No'}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
