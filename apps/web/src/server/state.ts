import type { AroCore } from '@aro/core';

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

export function initCore(
  workspaceRoot: string,
  createCore: (opts: { workspaceRoot: string }) => AroCore
): AroCore {
  shutdownCore();
  core = createCore({ workspaceRoot });
  currentWorkspacePath = workspaceRoot;
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
