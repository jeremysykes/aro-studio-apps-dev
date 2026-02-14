import path from 'path';
import { config as loadDotenv } from 'dotenv';
const projectRoot = path.resolve(__dirname, '../../../../');
loadDotenv({ path: path.join(projectRoot, '.env') });

import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';
import { registerIpcHandlers } from './ipc.js';
import { initCore, shutdownCore, getLastWorkspacePath } from './state.js';
import { loadModules } from './moduleLoader.js';
import { resolveConfig } from './moduleRegistry.js';
import { createCore } from '@aro/core';

// Resolve tenant config (reads tenant.config.json + env var overrides).
// Fails fast with structured error if invalid.
try {
  resolveConfig(projectRoot);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

let mainWindow: BrowserWindow | null = null;

function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/preload.js'),
    },
  });

  mainWindow.loadFile(join(__dirname, '../renderer/index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.once('did-finish-load', async () => {
    const lastPath = await getLastWorkspacePath();
    if (lastPath && existsSync(lastPath)) {
      const c = initCore(lastPath, createCore);
      loadModules(c);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('workspace:changed', { path: lastPath });
      }
    }
  });
}

app.on('before-quit', () => {
  shutdownCore();
});

app.whenReady().then(() => {
  registerIpcHandlers(getMainWindow);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
