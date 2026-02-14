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
  /** Maximum time in ms the job is allowed to run before Core force-transitions it to error. */
  maxRunDuration?: number;
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

// ─── AroCore versioning ─────────────────────────────────────────────────────

/**
 * Version alias for the current AroCore interface.
 * When AroCore gains breaking changes, bump to AroCore_v2 and keep v1 for
 * backward compatibility during migration. Hosts and modules can pin to a
 * specific version to detect incompatibility at compile time.
 *
 * Versioning policy: bump only for breaking changes (removed/renamed methods,
 * changed signatures). Additive changes (new optional methods) do not require
 * a new version.
 */
export type AroCore_v1 = AroCore;

// ─── Module init contract ───────────────────────────────────────────────────

/**
 * Module initialiser function.
 * Called by the host (Desktop main process or Web server) at startup.
 * Receives an AroCore instance, registers jobs, and returns the list of
 * registered job keys.
 */
export type ModuleInit = (core: AroCore) => string[];

// ─── Shell / UI model ────────────────────────────────────────────────────────

export type UIModel = 'standalone' | 'sidebar' | 'dashboard' | 'tabs' | 'carousel';

// ─── Tenant configuration ────────────────────────────────────────────────────

export interface TenantBrand {
  /** Application name displayed in title bar, headers, and meta tags. */
  appName: string;
  /** URL or data-URI for the brand logo. Used in sidebar headers and splash. */
  logoUrl?: string;
  /** URL or data-URI for the browser/app favicon. */
  faviconUrl?: string;
  /**
   * Key of a React component registered for the splash/loading screen.
   * When set, the shell renders this instead of the default "Loading…" text.
   */
  splashComponent?: string;
}

export interface TenantConfig {
  /** Which UI model to render. */
  uiModel: UIModel;
  /** Which module keys are enabled (order matters for sidebar/dashboard). */
  enabledModules: string[];
  /** Brand identity. */
  brand: TenantBrand;
  /** Theme token overrides (CSS custom property name → value). */
  theme: Record<string, string>;
  /** Feature flags (flag name → enabled). */
  features: Record<string, boolean>;
}

// ─── Preload API (window.aro contract) ───────────────────────────────────────

export interface AroPreloadAPI {
  getTenantConfig(): Promise<TenantConfig>;
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

// ─── API payload schemas ────────────────────────────────────────────────────

export {
  RunIdParam,
  SafeRelativePath,
  JobRunPayload,
  JobCancelPayload,
  ArtifactReadParams,
  LogSubscribeQuery,
  WorkspaceSelectPayload,
  FileSystemBrowseQuery,
} from './api-schemas.js';

// ─── Filesystem browsing ────────────────────────────────────────────────────

export interface DirectoryEntry {
  name: string;
  path: string;
}

export interface BrowseResult {
  current: string;
  parent: string | null;
  entries: DirectoryEntry[];
}
