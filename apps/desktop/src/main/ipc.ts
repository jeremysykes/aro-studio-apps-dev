import { ipcMain, dialog, BrowserWindow } from 'electron';
import { createCore } from '@aro/core';
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
import { getUIModel, getEnabledModuleKeys, getResolvedConfig } from './moduleRegistry.js';

const NO_WORKSPACE = 'No workspace selected';

function requireCore(): NonNullable<ReturnType<typeof getCore>> {
  const c = getCore();
  if (!c) throw new Error(NO_WORKSPACE);
  return c;
}

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
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

  ipcMain.handle('app:getTenantConfig', async () => {
    return getResolvedConfig();
  });

  ipcMain.handle('app:getUIModel', async () => {
    return getUIModel();
  });

  ipcMain.handle('app:getEnabledModules', async () => {
    const keys = getEnabledModuleKeys();
    // Standalone mode only exposes the first module
    return getUIModel() === 'standalone' ? keys.slice(0, 1) : keys;
  });

  ipcMain.handle('job:run', async (_, jobKey: string, input?: unknown, opts?: { traceId?: string }) => {
    const payload = JobRunPayload.parse({ jobKey, input, traceId: opts?.traceId });
    const c = requireCore();
    const { runId } = c.jobs.run(payload.jobKey, payload.input ?? undefined, payload.traceId ? { traceId: payload.traceId } : undefined);
    return { runId };
  });

  ipcMain.handle('job:cancel', async (_, runId: string) => {
    const validated = RunIdParam.parse(runId);
    const c = requireCore();
    c.jobs.cancel(validated);
  });

  ipcMain.handle('job:listRegistered', async () => {
    requireCore();
    return getRegisteredJobKeys();
  });

  ipcMain.handle('runs:list', async () => {
    const c = requireCore();
    return c.runs.listRuns();
  });

  ipcMain.handle('runs:get', async (_, runId: string) => {
    const validated = RunIdParam.parse(runId);
    const c = requireCore();
    return c.runs.getRun(validated);
  });

  ipcMain.handle('logs:list', async (_, runId: string) => {
    const validated = RunIdParam.parse(runId);
    const c = requireCore();
    return c.logs.listLogs(validated);
  });

  ipcMain.handle('logs:subscribe', async (_, runId: string) => {
    const validated = RunIdParam.parse(runId);
    const c = requireCore();
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
    const c = requireCore();
    return c.artifacts.listArtifacts(validated);
  });

  ipcMain.handle('artifacts:read', async (_, runId: string, path: string) => {
    const params = ArtifactReadParams.parse({ runId, path });
    const c = requireCore();
    const relPath = `.aro/artifacts/${params.runId}/${params.path}`;
    return c.workspace.readText(relPath);
  });
}
