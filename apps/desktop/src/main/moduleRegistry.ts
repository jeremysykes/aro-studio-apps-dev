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

export type UIModel = 'standalone' | 'sidebar' | 'dashboard';

const VALID_UI_MODELS: UIModel[] = ['standalone', 'sidebar', 'dashboard'];

export function getUIModel(): UIModel {
  const raw = process.env.ARO_UI_MODEL?.trim().toLowerCase();
  if (raw && VALID_UI_MODELS.includes(raw as UIModel)) return raw as UIModel;
  if (raw) console.warn('Invalid ARO_UI_MODEL:', raw, '- valid:', VALID_UI_MODELS.join(', '), '- falling back to standalone');
  return 'standalone';
}

export function getActiveModuleKey(): string {
  return process.env.ARO_ACTIVE_MODULE ?? 'hello-world';
}

export function getEnabledModuleKeys(): string[] {
  const raw = process.env.ARO_ENABLED_MODULES ?? '';
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  const registered = getRegisteredModuleKeys();
  const valid: string[] = [];
  for (const key of keys) {
    if (inits.has(key)) {
      valid.push(key);
    } else {
      console.warn('ARO_ENABLED_MODULES: unknown module key:', key, '- valid:', registered.join(', '));
    }
  }
  return valid;
}

export function getInit(key: string): ModuleInit | undefined {
  return inits.get(key);
}

export function getRegisteredModuleKeys(): string[] {
  return Array.from(inits.keys());
}
