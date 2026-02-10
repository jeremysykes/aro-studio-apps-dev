import type { AroCore } from '@aro/core';

export type ModuleInit = (core: AroCore) => string[];

/**
 * Registry of module keys to init functions (main process only).
 * Add a new module: add package to package.json, then register here.
 */
const inits = new Map<string, ModuleInit>();

function register(key: string, init: ModuleInit): void {
  inits.set(key, init);
}

// Register built-in modules
import { init as helloWorldInit } from '@aro/module-hello-world';
import { init as inspectInit } from '@aro/module-inspect';

register('hello-world', helloWorldInit);
register('inspect', inspectInit);

export function getActiveModuleKey(): string {
  return process.env.ARO_ACTIVE_MODULE ?? 'hello-world';
}

export function getInit(key: string): ModuleInit | undefined {
  return inits.get(key);
}

export function getRegisteredModuleKeys(): string[] {
  return Array.from(inits.keys());
}
