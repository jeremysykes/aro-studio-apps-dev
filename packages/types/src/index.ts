// ─── Domain types ────────────────────────────────────────────────────────────

export interface Run {
  id: string;
  traceId: string;
  status: string;
  startedAt: number;
  finishedAt: number | null;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  runId: string;
  traceId: string;
  level: string;
  message: string;
  createdAt: number;
}

export interface Artifact {
  id: string;
  runId: string;
  traceId: string;
  path: string;
  jobKey: string;
  inputHash: string;
  createdAt: number;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues?: ValidationIssue[];
}

export interface TokenDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

// ─── Job execution context ───────────────────────────────────────────────────

export interface RunLogger {
  (level: string, message: string): void;
}

export interface WorkspaceFacet {
  resolve(relPath: string): string;
  readText(relPath: string): string;
  writeText(relPath: string, content: string): void;
  exists(relPath: string): boolean;
  mkdirp(relDir: string): void;
}

export interface ArtifactWriter {
  (params: { path: string; content: string }): Artifact;
}

export interface JobDefinition {
  key: string;
  run: (ctx: JobContext, input: unknown) => void | Promise<void>;
}

export interface JobContext {
  readonly logger: RunLogger;
  readonly workspace: WorkspaceFacet;
  readonly artifactWriter: ArtifactWriter;
  readonly abort: AbortSignal;
  progress?: (value: number | { current: number; total: number }) => void;
}

// ─── Core factory ────────────────────────────────────────────────────────────

export interface AroCoreOptions {
  workspaceRoot: string;
  dbPath?: string;
  tokensPath?: string;
}

export interface AroCore {
  workspace: {
    initWorkspace(): void;
    resolve(relPath: string): string;
    readText(relPath: string): string;
    writeText(relPath: string, content: string): void;
    exists(relPath: string): boolean;
    mkdirp(relDir: string): void;
  };
  runs: {
    startRun(params?: { traceId?: string }): { runId: string };
    finishRun(params: { runId: string; status: 'success' | 'error' | 'cancelled' }): void;
    getRun(runId: string): Run | null;
    listRuns(filter?: unknown): Run[];
  };
  logs: {
    appendLog(entry: { runId: string; traceId: string; level: string; message: string }): void;
    listLogs(runId: string): LogEntry[];
    subscribe(runId: string, handler: (entry: LogEntry) => void): () => void;
  };
  artifacts: {
    writeArtifact(params: { runId: string; traceId: string; path: string; content: string }): Artifact;
    listArtifacts(runId: string): Artifact[];
  };
  jobs: {
    register(jobDef: JobDefinition): void;
    run(jobKey: string, input: unknown, opts?: { traceId?: string }): { runId: string };
    cancel(runId: string): void;
  };
  tokens: {
    loadTokens(): unknown;
    saveTokens(tokens: unknown): void;
    diffTokens(a: unknown, b: unknown): TokenDiff;
  };
  validation: {
    validateTokens(tokens: unknown): ValidationResult;
  };
  shutdown(): void;
}

// ─── Shell / UI model ────────────────────────────────────────────────────────

export type UIModel = 'standalone' | 'sidebar' | 'dashboard' | 'tabs' | 'carousel';

// ─── Preload API (window.aro contract) ───────────────────────────────────────

export interface AroPreloadAPI {
  getUIModel(): Promise<UIModel>;
  getEnabledModules(): Promise<string[]>;
  workspace: {
    select(): Promise<{ path: string } | null>;
    getCurrent(): Promise<{ path: string } | null>;
    onChanged(callback: (data: { path: string } | null) => void): () => void;
  };
  job: {
    run(jobKey: string, input?: unknown, opts?: { traceId?: string }): Promise<{ runId: string }>;
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
