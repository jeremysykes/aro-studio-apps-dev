import { existsSync, statSync } from 'fs';
import path from 'path';
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

/**
 * Switch workspace at runtime: validate path, reinitialise Core, reload modules.
 * Throws on invalid path.
 */
/**
 * Switch workspace at runtime: validate path, reinitialise Core, reload modules.
 * Throws on invalid path.
 */
export function switchWorkspace(
  rawPath: string,
  createCore: (opts: { workspaceRoot: string }) => AroCore,
  onCoreReady: (core: AroCore) => void,
): string {
  const resolved = path.resolve(rawPath);
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    throw new Error('Path does not exist or is not a directory');
  }
  const c = initCore(resolved, createCore);
  onCoreReady(c);
  return resolved;
}
