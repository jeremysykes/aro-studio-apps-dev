import React from 'react';
import {
	Badge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
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

/* ── Status → Badge variant mapping (white-label: zinc + red-destructive only) ── */
function statusBadge(status: string): React.ReactNode {
	switch (status) {
		case 'success':
			return <Badge variant='default'>Success</Badge>;
		case 'error':
			return <Badge variant='destructive'>Error</Badge>;
		case 'running':
			return <Badge variant='secondary'>Running</Badge>;
		case 'cancelled':
			return <Badge variant='outline'>Cancelled</Badge>;
		default:
			return <Badge variant='outline'>{status}</Badge>;
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
							<TableCell className='text-[11px] font-mono text-zinc-500 py-3'>
								<Tooltip>
									<TooltipTrigger asChild>
										<span className='cursor-default'>{run.id.slice(0, 8)}</span>
									</TooltipTrigger>
									<TooltipContent>{run.id}</TooltipContent>
								</Tooltip>
							</TableCell>
							{showStatus && <TableCell>{statusBadge(run.status)}</TableCell>}
						</TableRow>
					);
				})}
				{runs.length === 0 && (
					<TableRow>
						<TableCell
							colSpan={showStatus ? 3 : 2}
							className='text-center text-zinc-500 text-[11px] py-4'
						>
							No runs yet
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
