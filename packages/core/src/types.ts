export interface Run {
  id: string;
  status: string;
  startedAt: number;
  finishedAt: number | null;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  runId: string;
  level: string;
  message: string;
  createdAt: number;
}

export interface Artifact {
  id: string;
  runId: string;
  path: string;
  createdAt: number;
}

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
    startRun(params?: unknown): { runId: string };
    finishRun(params: { runId: string; status: 'success' | 'error' | 'cancelled' }): void;
    getRun(runId: string): Run | null;
    listRuns(filter?: unknown): Run[];
  };
  logs: {
    appendLog(entry: { runId: string; level: string; message: string }): void;
    listLogs(runId: string): LogEntry[];
    subscribe(runId: string, handler: (entry: LogEntry) => void): () => void;
  };
  artifacts: {
    writeArtifact(params: { runId: string; path: string; content: string }): Artifact;
    listArtifacts(runId: string): Artifact[];
  };
  jobs: {
    register(jobDef: JobDefinition): void;
    run(jobKey: string, input: unknown): { runId: string };
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
