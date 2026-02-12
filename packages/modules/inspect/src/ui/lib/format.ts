import type { RunItem } from '../types';

/** Format run for listbox label. Optionally include status (e.g. for Logs view). */
export function formatRunLabel(
	run: RunItem,
	options?: { includeStatus?: boolean },
): string {
	const date = new Date(run.startedAt).toLocaleString();
	if (options?.includeStatus) {
		return `${run.id} — ${run.status} — ${date}`;
	}
	return `${run.id} — ${date}`;
}
