import type { AroCore } from '@aro/core';

let store: { get: (key: string) => unknown; set: (key: string, value: unknown) => void; delete: (key: string) => void } | null = null;

async function getStore() {
  if (!store) {
    const Store = (await import('electron-store')).default;
    store = new Store<{ lastWorkspacePath?: string }>();
  }
  return store;
}

let core: AroCore | null = null;
let currentWorkspacePath: string | null = null;
let registeredJobKeys: string[] = [];

const logSubscriptions = new Map<string, () => void>();

export function getRegisteredJobKeys(): string[] {
  return registeredJobKeys;
}

export function setRegisteredJobKeys(keys: string[]): void {
  registeredJobKeys = keys;
}

export function getCore(): AroCore | null {
  return core;
}

export function getCurrentWorkspacePath(): string | null {
  return currentWorkspacePath;
}

export async function getLastWorkspacePath(): Promise<string | null> {
  const s = await getStore();
  const path = s.get('lastWorkspacePath');
  return typeof path === 'string' ? path : null;
}

export async function setLastWorkspacePath(path: string | null): Promise<void> {
  const s = await getStore();
  if (path) {
    s.set('lastWorkspacePath', path);
  } else {
    s.delete('lastWorkspacePath');
  }
}

export function initCore(workspaceRoot: string, createCore: (opts: { workspaceRoot: string }) => AroCore): AroCore {
  shutdownCore();
  core = createCore({ workspaceRoot });
  currentWorkspacePath = workspaceRoot;
  void setLastWorkspacePath(workspaceRoot);
  return core;
}

export function shutdownCore(): void {
  for (const unsub of logSubscriptions.values()) {
    unsub();
  }
  logSubscriptions.clear();
  if (core) {
    core.shutdown();
    core = null;
  }
  currentWorkspacePath = null;
  registeredJobKeys = [];
}

export function addLogSubscription(subscriptionId: string, unsubscribe: () => void): void {
  logSubscriptions.set(subscriptionId, unsubscribe);
}

export function removeLogSubscription(subscriptionId: string): void {
  const unsub = logSubscriptions.get(subscriptionId);
  if (unsub) {
    unsub();
    logSubscriptions.delete(subscriptionId);
  }
}
