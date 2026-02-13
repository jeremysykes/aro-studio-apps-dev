import React from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@aro/desktop/components';
import { useInspectStore } from '../store';
import type { RunItem } from '../types';

function formatRelativeTime(ms: number): string {
	const now = Date.now();
	const diff = now - ms;
	const sec = Math.floor(diff / 1000);
	const min = Math.floor(sec / 60);
	const hr = Math.floor(min / 60);
	if (sec < 60) return 'Just now';
	if (min < 60) return `${min}m ago`;
	if (hr < 24) return `${hr}h ago`;
	return new Date(ms).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});
}

function statusBadge(status: string): React.ReactNode {
	const base = 'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium';
	switch (status) {
		case 'success':
			return (
				<span className={`${base} bg-green-100 text-green-700`}>Success</span>
			);
		case 'error':
			return <span className={`${base} bg-red-100 text-red-700`}>Error</span>;
		case 'running':
			return (
				<span className={`${base} bg-blue-100 text-blue-700`}>Running</span>
			);
		case 'cancelled':
			return (
				<span className={`${base} bg-zinc-100 text-zinc-600`}>Cancelled</span>
			);
		default:
			return (
				<span className={`${base} bg-zinc-100 text-zinc-600`}>{status}</span>
			);
	}
}

export interface RunsTableProps {
	/** Override runs list (e.g. for filtered report runs). Falls back to store. */
	runs?: RunItem[];
	showStatus?: boolean;
}

export function RunsTable({
	runs: runsProp,
	showStatus = false,
}: RunsTableProps) {
	const storeRuns = useInspectStore((s) => s.runs);
	const selectedRunId = useInspectStore((s) => s.selectedRunId);
	const selectRun = useInspectStore((s) => s.selectRun);

	const runs = runsProp ?? storeRuns;

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Time</TableHead>
					<TableHead>ID</TableHead>
					{showStatus && <TableHead>Status</TableHead>}
				</TableRow>
			</TableHeader>
			<TableBody>
				{runs.map((run) => {
					const isSelected = selectedRunId === run.id;
					return (
						<TableRow
							key={run.id}
							data-state={isSelected ? 'selected' : undefined}
							className={`cursor-pointer ${isSelected ? 'bg-zinc-100' : ''}`}
							onClick={() => selectRun(run.id)}
						>
							<TableCell className='text-[11px] whitespace-nowrap'>
								{formatRelativeTime(run.startedAt)}
							</TableCell>
							<TableCell className='text-[11px] font-mono text-muted-foreground py-3'>
								{run.id.slice(0, 8)}
							</TableCell>
							{showStatus && <TableCell>{statusBadge(run.status)}</TableCell>}
						</TableRow>
					);
				})}
				{runs.length === 0 && (
					<TableRow>
						<TableCell
							colSpan={showStatus ? 3 : 2}
							className='text-center text-muted-foreground text-[11px] py-4'
						>
							No runs yet
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
