import React from 'react';
import type { InspectReport } from '../types';

export interface TokenInventoryTableProps {
	tokens: InspectReport['tokens'];
}

export function TokenInventoryTable({ tokens }: TokenInventoryTableProps) {
	return (
		<div className="overflow-x-auto">
			<p className="font-medium mb-2">Token inventory</p>
			<table className="w-full text-sm border-collapse">
				<thead>
					<tr>
						<th scope="col" className="text-left border p-2">
							Name
						</th>
						<th scope="col" className="text-left border p-2">
							Value
						</th>
						<th scope="col" className="text-left border p-2">
							Type
						</th>
						<th scope="col" className="text-left border p-2">
							Source
						</th>
					</tr>
				</thead>
				<tbody>
					{tokens.map((t) => (
						<tr key={t.name}>
							<td className="border p-2">{t.name}</td>
							<td className="border p-2">{t.value}</td>
							<td className="border p-2">{t.type}</td>
							<td className="border p-2">{t.source}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
