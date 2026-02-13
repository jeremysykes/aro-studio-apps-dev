import type { Run, LogEntry, Artifact } from '../shared/types';

export interface AroPreloadAPI {
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
    list(): Promise<Run[]>;
    get(runId: string): Promise<Run | null>;
  };
  logs: {
    list(runId: string): Promise<LogEntry[]>;
    subscribe(runId: string, callback: (entry: LogEntry) => void): Promise<() => void>;
  };
  artifacts: {
    list(runId: string): Promise<Artifact[]>;
    read(runId: string, path: string): Promise<string>;
  };
}

declare global {
  interface Window {
    aro: AroPreloadAPI;
  }
}

export {};
