import { ipcMain, dialog, BrowserWindow } from 'electron';
import { createCore, createCoreAdapter } from '@aro/core';
import type { AroPreloadAPI } from '@aro/types';
import {
  JobRunPayload,
  RunIdParam,
  ArtifactReadParams,
} from '@aro/types';
import {
  getCore,
  getCurrentWorkspacePath,
  getRegisteredJobKeys,
  initCore,
  addLogSubscription,
  removeLogSubscription,
} from './state.js';
import { loadModules } from './moduleLoader.js';
import { getResolvedConfig } from './moduleRegistry.js';

const NO_WORKSPACE = 'No workspace selected';

/**
 * Build a CoreAdapter from current host state.
 * All Core operation logic is defined once in the adapter —
 * the IPC layer only handles transport (Electron IPC) and host-specific
 * operations (workspace dialog, log push to renderer).
 */
function requireAdapter(): AroPreloadAPI {
  const c = getCore();
  if (!c) throw new Error(NO_WORKSPACE);
  const config = getResolvedConfig();
  return createCoreAdapter(c, {
    uiModel: config.uiModel,
    enabledModules: config.enabledModules,
    workspaceRoot: getCurrentWorkspacePath()!,
    tenantConfig: config,
    getRegisteredJobKeys,
  });
}

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  // ── Host-specific: workspace dialog ────────────────────────────────────
  ipcMain.handle('workspace:select', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select workspace',
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    const workspaceRoot = result.filePaths[0];
    const c = initCore(workspaceRoot, createCore);
    loadModules(c);

    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('workspace:changed', { path: workspaceRoot });
    }
    return { path: workspaceRoot };
  });

  ipcMain.handle('workspace:getCurrent', async () => {
    const path = getCurrentWorkspacePath();
    return path ? { path } : null;
  });

  // ── Delegated through CoreAdapter ──────────────────────────────────────
  ipcMain.handle('app:getTenantConfig', async () => {
    const api = requireAdapter();
    return api.getTenantConfig();
  });

  ipcMain.handle('app:getUIModel', async () => {
    const api = requireAdapter();
    return api.getUIModel();
  });

  ipcMain.handle('app:getEnabledModules', async () => {
    const api = requireAdapter();
    return api.getEnabledModules();
  });

  ipcMain.handle('job:run', async (_, jobKey: string, input?: unknown, opts?: { traceId?: string }) => {
    const payload = JobRunPayload.parse({ jobKey, input, traceId: opts?.traceId });
    const api = requireAdapter();
    return api.job.run(payload.jobKey, payload.input ?? undefined, payload.traceId ? { traceId: payload.traceId } : undefined);
  });

  ipcMain.handle('job:cancel', async (_, runId: string) => {
    const validated = RunIdParam.parse(runId);
    const api = requireAdapter();
    return api.job.cancel(validated);
  });

  ipcMain.handle('job:listRegistered', async () => {
    const api = requireAdapter();
    return api.job.listRegistered();
  });

  ipcMain.handle('runs:list', async () => {
    const api = requireAdapter();
    return api.runs.list();
  });

  ipcMain.handle('runs:get', async (_, runId: string) => {
    const validated = RunIdParam.parse(runId);
    const api = requireAdapter();
    return api.runs.get(validated);
  });

  ipcMain.handle('logs:list', async (_, runId: string) => {
    const validated = RunIdParam.parse(runId);
    const api = requireAdapter();
    return api.logs.list(validated);
  });

  // ── Host-specific: log subscription via IPC event push ─────────────────
  ipcMain.handle('logs:subscribe', async (_, runId: string) => {
    const validated = RunIdParam.parse(runId);
    const c = getCore();
    if (!c) throw new Error(NO_WORKSPACE);
    const subscriptionId = `logs:${validated}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const unsubscribe = c.logs.subscribe(validated, (entry) => {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send('logs:entry', { runId: validated, entry });
      }
    });
    addLogSubscription(subscriptionId, unsubscribe);
    return subscriptionId;
  });

  ipcMain.handle('logs:unsubscribe', async (_, subscriptionId: string) => {
    RunIdParam.parse(subscriptionId);
    removeLogSubscription(subscriptionId);
  });

  ipcMain.handle('artifacts:list', async (_, runId: string) => {
    const validated = RunIdParam.parse(runId);
    const api = requireAdapter();
    return api.artifacts.list(validated);
  });

  ipcMain.handle('artifacts:read', async (_, runId: string, path: string) => {
    const params = ArtifactReadParams.parse({ runId, path });
    const api = requireAdapter();
    return api.artifacts.read(params.runId, params.path);
  });
}
