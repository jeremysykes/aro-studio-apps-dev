import type { AroCore } from '@aro/core';
import { loadTenantConfig, type TenantConfig } from '@aro/config';

export type ModuleInit = (core: AroCore) => string[];

const inits = new Map<string, ModuleInit>();

function register(key: string, init: ModuleInit): void {
  inits.set(key, init);
}

import { init as helloWorldInit } from '@aro/module-hello-world';
import { init as inspectInit } from '@aro/module-inspect';

register('hello-world', helloWorldInit);
register('inspect', inspectInit);

// ─── Config state ────────────────────────────────────────────────────────────

let resolvedConfig: TenantConfig | null = null;

/**
 * Load and validate tenant config from config file + env vars.
 * Must be called once at startup, after dotenv is loaded.
 */
export function resolveConfig(configDir: string): TenantConfig {
  resolvedConfig = loadTenantConfig({ configDir });
  return resolvedConfig;
}

export function getResolvedConfig(): TenantConfig {
  if (!resolvedConfig) throw new Error('Config not resolved. Call resolveConfig() first.');
  return resolvedConfig;
}

// ─── Derived accessors (backward compat) ─────────────────────────────────────

import type { UIModel } from '@aro/types';
export type { UIModel };

export function getUIModel(): UIModel {
  return getResolvedConfig().uiModel;
}

export function getEnabledModuleKeys(): string[] {
  const config = getResolvedConfig();
  const registered = getRegisteredModuleKeys();
  const valid: string[] = [];
  for (const key of config.enabledModules) {
    if (inits.has(key)) {
      valid.push(key);
    } else {
      console.warn('enabledModules: unknown module key:', key, '- valid:', registered.join(', '));
    }
  }
  if (valid.length === 0) {
    console.warn('No enabled modules found — no modules will be loaded');
  }
  return valid;
}

export function getInit(key: string): ModuleInit | undefined {
  return inits.get(key);
}

export function getRegisteredModuleKeys(): string[] {
  return Array.from(inits.keys());
}
