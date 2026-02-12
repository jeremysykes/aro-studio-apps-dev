import React, { type RefObject } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@aro/desktop/components';
import { RunsListbox } from '../components/RunsListbox';
import type { RunItem, LogEntry } from '../types';

export interface RunViewProps {
	runs: RunItem[];
	selectedRunId: string | null;
	focusedRunId: string | null;
	logs: LogEntry[];
	runningRunId: string | null;
	listboxRef: RefObject<HTMLDivElement | null>;
	onSelectRun: (id: string) => void;
	onFocusChange: (id: string) => void;
	onCancelRun: (runId: string) => void;
}

export function RunView({
	runs,
	selectedRunId,
	focusedRunId,
	logs,
	runningRunId,
	listboxRef,
	onSelectRun,
	onFocusChange,
	onCancelRun,
}: RunViewProps) {
	return (
		<section aria-labelledby="run-heading">
			<h2 id="run-heading" className="sr-only">
				Run and logs
			</h2>
			<div className="grid grid-cols-1 min-[900px]:grid-cols-[20rem_1fr] min-[900px]:grid-rows-[minmax(0,1fr)] min-[900px]:max-h-[calc(100vh-12rem)] min-[900px]:min-h-0 gap-4">
				<div className="space-y-4 min-[900px]:flex min-[900px]:flex-col min-[900px]:min-h-0 min-[900px]:space-y-0">
					<Card className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:flex min-[900px]:flex-col min-[900px]:overflow-hidden">
						<CardHeader>
							<CardTitle>Runs</CardTitle>
						</CardHeader>
						<CardContent className="min-[900px]:overflow-y-auto min-[900px]:min-h-0 min-w-0">
							<RunsListbox<RunItem>
								items={runs}
								selectedId={selectedRunId}
								focusedId={focusedRunId}
								onSelect={onSelectRun}
								onFocusChange={onFocusChange}
								optionIdPrefix="runs-log-option-"
								getOptionLabel={(run) =>
									`${run.id} — ${run.status} — ${new Date(run.startedAt).toLocaleString()}`
								}
								listboxRef={listboxRef}
								ariaLabel="Runs"
							/>
						</CardContent>
					</Card>
					{runningRunId && (
						<Button
							type="button"
							variant="destructive"
							className="min-[900px]:mt-4"
							onClick={() => onCancelRun(runningRunId)}
						>
							Abort scan
						</Button>
					)}
				</div>
				{selectedRunId && (
					<Card className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:flex min-[900px]:flex-col min-[900px]:overflow-hidden">
						<CardHeader>
							<CardTitle>Logs</CardTitle>
						</CardHeader>
						<CardContent className="min-[900px]:overflow-y-auto min-[900px]:min-h-0 min-w-0">
							<ul
								className="list-none space-y-1 font-mono text-sm"
								role="log"
								aria-live="polite"
							>
								{logs.map((entry) => (
									<li key={entry.id}>
										[{entry.level}] {entry.message}
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				)}
			</div>
		</section>
	);
}
