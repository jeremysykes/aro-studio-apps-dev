import type { AroCore, LogEntry } from '../types.js';
import type { AroPreloadAPI, TenantConfig, UIModel } from '@aro/types';

export interface CoreAdapterOptions {
  uiModel: UIModel;
  enabledModules: string[];
  workspaceRoot: string;
}

/**
 * Reference adapter: wraps AroCore to produce an AroPreloadAPI-compatible
 * object. Mirrors the exact mapping that both desktop (ipc.ts) and web
 * (api.ts) implement — without any transport layer.
 *
 * Use this for contract tests or as the canonical spec of how hosts
 * should translate AroPreloadAPI → AroCore calls.
 */
export function createCoreAdapter(
  core: AroCore,
  opts: CoreAdapterOptions,
): AroPreloadAPI {
  const registeredKeys = (): string[] => {
    // In both hosts this comes from state.getRegisteredJobKeys(), which is
    // populated by moduleLoader after core.jobs.register(). For the adapter
    // we derive it from the options since we don't have the module loader.
    return opts.enabledModules;
  };

  return {
    getTenantConfig: () => Promise.resolve<TenantConfig>({
      uiModel: opts.uiModel,
      enabledModules: opts.enabledModules,
      brand: { appName: 'Aro Studio' },
      theme: {},
      features: {},
    }),
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
      run: (jobKey: string, input?: unknown, opts?: { traceId?: string }) => {
        const { runId } = core.jobs.run(jobKey, input ?? undefined, opts);
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
