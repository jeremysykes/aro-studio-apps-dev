import type { ModuleInit, UIModel } from '@aro/types';
import { loadTenantConfig, type TenantConfig } from '@aro/config';

/**
 * Shared server-side module registry.
 * Both Desktop (main process) and Web (server) import from here and
 * call `registerModule()` to wire up their module init functions.
 */

const inits = new Map<string, ModuleInit>();

export function registerModule(key: string, init: ModuleInit): void {
  inits.set(key, init);
}

export function getInit(key: string): ModuleInit | undefined {
  return inits.get(key);
}

export function getRegisteredModuleKeys(): string[] {
  return Array.from(inits.keys());
}

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

// ─── Derived accessors ──────────────────────────────────────────────────────

export type { UIModel };

export function getUIModel(): UIModel {
  return getResolvedConfig().uiModel;
}

export function getEnabledModuleKeys(): string[] {
  const config = getResolvedConfig();
  const valid: string[] = [];
  for (const key of config.enabledModules) {
    if (inits.has(key)) {
      valid.push(key);
    } else {
      console.warn('enabledModules: unknown module key:', key, '- valid:', getRegisteredModuleKeys().join(', '));
    }
  }
  if (valid.length === 0) {
    console.warn('No enabled modules found — no modules will be loaded');
  }
  return valid;
}
