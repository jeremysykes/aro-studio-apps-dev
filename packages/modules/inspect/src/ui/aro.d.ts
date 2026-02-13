/**
 * Type definitions for the window.aro preload API.
 *
 * These types mirror the AroPreloadAPI exposed by the desktop preload
 * (apps/desktop/src/renderer/preload.d.ts) and the web apiClient
 * (apps/web/src/client/apiClient.ts). They are duplicated here so the
 * inspect module can type-check independently without importing from
 * the desktop app.
 *
 * If the preload contract changes, update these types to match.
 */

interface AroRun {
	id: string;
	status: string;
	startedAt: number;
	finishedAt: number | null;
	createdAt: number;
}

interface AroLogEntry {
	id: string;
	runId: string;
	level: string;
	message: string;
	createdAt: number;
}

interface AroArtifact {
	id: string;
	runId: string;
	path: string;
	createdAt: number;
}

interface AroPreloadAPI {
	getUIModel(): Promise<'standalone' | 'sidebar' | 'dashboard' | 'tabs' | 'carousel'>;
	getEnabledModules(): Promise<string[]>;
	workspace: {
		select(): Promise<{ path: string } | null>;
		getCurrent(): Promise<{ path: string } | null>;
		onChanged(callback: (data: { path: string } | null) => void): () => void;
	};
	job: {
		run(jobKey: string, input?: unknown): Promise<{ runId: string }>;
		cancel(runId: string): Promise<void>;
		listRegistered(): Promise<string[]>;
	};
	runs: {
		list(): Promise<AroRun[]>;
		get(runId: string): Promise<AroRun | null>;
	};
	logs: {
		list(runId: string): Promise<AroLogEntry[]>;
		subscribe(
			runId: string,
			callback: (entry: AroLogEntry) => void,
		): Promise<() => void>;
	};
	artifacts: {
		list(runId: string): Promise<AroArtifact[]>;
		read(runId: string, path: string): Promise<string>;
	};
}

declare global {
	interface Window {
		aro: AroPreloadAPI;
	}
}

export {};
