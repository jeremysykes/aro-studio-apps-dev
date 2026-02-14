import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('aro', {
  getTenantConfig: () => ipcRenderer.invoke('app:getTenantConfig'),
  getUIModel: () => ipcRenderer.invoke('app:getUIModel'),
  getEnabledModules: () => ipcRenderer.invoke('app:getEnabledModules'),
  workspace: {
    select: () => ipcRenderer.invoke('workspace:select'),
    getCurrent: () => ipcRenderer.invoke('workspace:getCurrent'),
    onChanged: (callback: (data: { path: string } | null) => void) => {
      const handler = (_: unknown, data: { path: string } | null) => callback(data);
      ipcRenderer.on('workspace:changed', handler);
      return () => ipcRenderer.removeListener('workspace:changed', handler);
    },
  },
  job: {
    run: (jobKey: string, input?: unknown, opts?: { traceId?: string }) => ipcRenderer.invoke('job:run', jobKey, input, opts),
    cancel: (runId: string) => ipcRenderer.invoke('job:cancel', runId),
    listRegistered: () => ipcRenderer.invoke('job:listRegistered'),
  },
  runs: {
    list: () => ipcRenderer.invoke('runs:list'),
    get: (runId: string) => ipcRenderer.invoke('runs:get', runId),
  },
  logs: {
    list: (runId: string) => ipcRenderer.invoke('logs:list', runId),
    subscribe: (runId: string, callback: (entry: { id: string; runId: string; level: string; message: string; createdAt: number }) => void) => {
      const handler = (_: unknown, data: { runId: string; entry: { id: string; runId: string; level: string; message: string; createdAt: number } }) => {
        if (data.runId === runId) {
          callback(data.entry);
        }
      };
      ipcRenderer.on('logs:entry', handler);
      return ipcRenderer.invoke('logs:subscribe', runId).then((subscriptionId: string) => {
        return () => {
          ipcRenderer.removeListener('logs:entry', handler);
          ipcRenderer.invoke('logs:unsubscribe', subscriptionId).catch(() => {});
        };
      });
    },
  },
  artifacts: {
    list: (runId: string) => ipcRenderer.invoke('artifacts:list', runId),
    read: (runId: string, path: string) => ipcRenderer.invoke('artifacts:read', runId, path),
  },
});
