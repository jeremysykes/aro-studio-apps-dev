import { ipcMain, dialog, BrowserWindow } from 'electron';
import { createCore } from '@aro/core';
import {
  getCore,
  getCurrentWorkspacePath,
  getRegisteredJobKeys,
  initCore,
  addLogSubscription,
  removeLogSubscription,
} from './state.js';
import { loadModules } from './moduleLoader.js';
import { getUIModel, getEnabledModuleKeys } from './moduleRegistry.js';

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

  ipcMain.handle('app:getUIModel', async () => {
    return getUIModel();
  });

  ipcMain.handle('app:getEnabledModules', async () => {
    return getEnabledModuleKeys();
  });

  ipcMain.handle('job:run', async (_, jobKey: string, input?: unknown) => {
    const c = requireCore();
    const { runId } = c.jobs.run(jobKey, input ?? undefined);
    return { runId };
  });

  ipcMain.handle('job:cancel', async (_, runId: string) => {
    const c = requireCore();
    c.jobs.cancel(runId);
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
    const c = requireCore();
    return c.runs.getRun(runId);
  });

  ipcMain.handle('logs:list', async (_, runId: string) => {
    const c = requireCore();
    return c.logs.listLogs(runId);
  });

  ipcMain.handle('logs:subscribe', async (_, runId: string) => {
    const c = requireCore();
    const subscriptionId = `logs:${runId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const unsubscribe = c.logs.subscribe(runId, (entry) => {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send('logs:entry', { runId, entry });
      }
    });
    addLogSubscription(subscriptionId, unsubscribe);
    return subscriptionId;
  });

  ipcMain.handle('logs:unsubscribe', async (_, subscriptionId: string) => {
    removeLogSubscription(subscriptionId);
  });

  ipcMain.handle('artifacts:list', async (_, runId: string) => {
    const c = requireCore();
    return c.artifacts.listArtifacts(runId);
  });

  ipcMain.handle('artifacts:read', async (_, runId: string, path: string) => {
    const c = requireCore();
    const relPath = `.aro/artifacts/${runId}/${path}`;
    return c.workspace.readText(relPath);
  });
}
