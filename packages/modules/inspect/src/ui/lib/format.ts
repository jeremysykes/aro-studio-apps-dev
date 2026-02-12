import type { RunItem } from '../types';

/** Relative time string (e.g. "2 min ago", "Just now"). */
function formatRelativeTime(ms: number): string {
	const now = Date.now();
	const diff = now - ms;
	const sec = Math.floor(diff / 1000);
	const min = Math.floor(sec / 60);
	const hr = Math.floor(min / 60);
	if (sec < 60) return 'Just now';
	if (min < 60) return `${min} min ago`;
	if (hr < 24) return `${hr} hr ago`;
	return new Date(ms).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});
}

/** Format run for listbox label. Optionally include status (e.g. for Logs view). */
export function formatRunLabel(
	run: RunItem,
	options?: { includeStatus?: boolean },
): string {
	const relative = formatRelativeTime(run.startedAt);
	const shortId = run.id.slice(0, 8);
	if (options?.includeStatus) {
		return `${relative} — ${run.status} — ${shortId}`;
	}
	return `${relative} — ${shortId}`;
}

/** Full run label for tooltip (includes full ID and datetime). */
export function formatRunLabelFull(run: RunItem): string {
	const date = new Date(run.startedAt).toLocaleString();
	return `${run.id} — ${run.status} — ${date}`;
}
