import React, { type RefObject } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@aro/desktop/components';
import { RunsListbox } from '../components/RunsListbox';
import { TwoColumnLayout, CARD_CLASS, CARD_CONTENT_CLASS } from '../components/TwoColumnLayout';
import { formatRunLabel } from '../lib/format';
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
	const sidebar = (
		<div className="space-y-4 min-[900px]:flex min-[900px]:flex-col min-[900px]:min-h-0 min-[900px]:space-y-0">
			<Card className={CARD_CLASS}>
				<CardHeader>
					<CardTitle>Runs</CardTitle>
				</CardHeader>
				<CardContent className={CARD_CONTENT_CLASS}>
					<RunsListbox<RunItem>
						items={runs}
						selectedId={selectedRunId}
						focusedId={focusedRunId}
						onSelect={onSelectRun}
						onFocusChange={onFocusChange}
						optionIdPrefix="runs-log-option-"
						getOptionLabel={(run) => formatRunLabel(run, { includeStatus: true })}
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
	);

	const main = selectedRunId ? (
		<Card className={CARD_CLASS}>
			<CardHeader>
				<CardTitle>Logs</CardTitle>
			</CardHeader>
			<CardContent className={CARD_CONTENT_CLASS}>
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
	) : null;

	return (
		<section aria-labelledby="run-heading">
			<h2 id="run-heading" className="sr-only">
				Run and logs
			</h2>
			<TwoColumnLayout sidebar={sidebar} main={main} />
		</section>
	);
}
