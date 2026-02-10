import 'dotenv/config';
import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';
import { registerIpcHandlers } from './ipc.js';
import { initCore, shutdownCore, getLastWorkspacePath } from './state.js';
import { loadActiveModule } from './moduleLoader.js';
import { createCore } from '@aro/core';

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

  mainWindow.webContents.once('did-finish-load', async () => {
    const lastPath = await getLastWorkspacePath();
    if (lastPath && existsSync(lastPath)) {
      const c = initCore(lastPath, createCore);
      loadActiveModule(c);
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
