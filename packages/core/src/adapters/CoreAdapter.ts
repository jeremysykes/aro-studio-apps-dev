import type { AroCore, LogEntry } from '../types.js';
import type { AroPreloadAPI, TenantConfig, UIModel } from '@aro/types';

export interface CoreAdapterOptions {
  uiModel: UIModel;
  enabledModules: string[];
  workspaceRoot: string;
  /**
   * When provided, getTenantConfig() returns this full config object
   * instead of constructing a minimal one from uiModel/enabledModules.
   */
  tenantConfig?: TenantConfig;
  /**
   * When provided, job.listRegistered() calls this function to get
   * registered job keys. Without it, falls back to enabledModules
   * (suitable for contract tests where job keys === module keys).
   */
  getRegisteredJobKeys?: () => string[];
}

/**
 * Reference adapter: wraps AroCore to produce an AroPreloadAPI-compatible
 * object. Both desktop (ipc.ts) and web (api.ts) delegate their Core
 * operations through this adapter — the transport layer remains host-specific,
 * but the operation logic is defined once here.
 *
 * Also usable directly for contract tests (the canonical spec of how hosts
 * translate AroPreloadAPI → AroCore calls).
 */
export function createCoreAdapter(
  core: AroCore,
  opts: CoreAdapterOptions,
): AroPreloadAPI {
  const registeredKeys = (): string[] => {
    if (opts.getRegisteredJobKeys) return opts.getRegisteredJobKeys();
    // Fallback for contract tests where job keys match module keys
    return opts.enabledModules;
  };

  const tenantConfig = (): TenantConfig => {
    if (opts.tenantConfig) return opts.tenantConfig;
    // Minimal fallback for contract tests
    return {
      uiModel: opts.uiModel,
      enabledModules: opts.enabledModules,
      brand: { appName: 'Aro Studio' },
      theme: {},
      features: {},
    };
  };

  return {
    getTenantConfig: () => Promise.resolve(tenantConfig()),
    getUIModel: () => Promise.resolve(opts.uiModel),
    getEnabledModules: () =>
      Promise.resolve(
        opts.uiModel === 'standalone'
          ? opts.enabledModules.slice(0, 1)
          : opts.enabledModules,
      ),

    workspace: {
      select: () => Promise.resolve(null),
      getCurrent: () => Promise.resolve({ path: opts.workspaceRoot }),
      onChanged: () => () => {},
    },

    job: {
      run: (jobKey: string, input?: unknown, runOpts?: { traceId?: string }) => {
        const { runId } = core.jobs.run(jobKey, input ?? undefined, runOpts);
        return Promise.resolve({ runId });
      },
      cancel: (runId: string) => {
        core.jobs.cancel(runId);
        return Promise.resolve();
      },
      listRegistered: () => Promise.resolve(registeredKeys()),
    },

    runs: {
      list: () => Promise.resolve(core.runs.listRuns()),
      get: (runId: string) => Promise.resolve(core.runs.getRun(runId)),
    },

    logs: {
      list: (runId: string) => Promise.resolve(core.logs.listLogs(runId)),
      subscribe: (runId: string, callback: (entry: LogEntry) => void) => {
        const unsubscribe = core.logs.subscribe(runId, callback);
        return Promise.resolve(unsubscribe);
      },
    },

    artifacts: {
      list: (runId: string) => Promise.resolve(core.artifacts.listArtifacts(runId)),
      read: (runId: string, path: string) => {
        const relPath = `.aro/artifacts/${runId}/${path}`;
        return Promise.resolve(core.workspace.readText(relPath));
      },
    },
  };
}
