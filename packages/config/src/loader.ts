import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { TenantConfigSchema, type TenantConfig, type TenantConfigInput } from './schema.js';

// ─── Error type ──────────────────────────────────────────────────────────────

/** Structured error listing every validation violation. */
export class TenantConfigError extends Error {
  constructor(public readonly issues: Array<{ path: string; message: string }>) {
    const lines = issues.map((i) => `  - ${i.path}: ${i.message}`);
    super(`Invalid tenant configuration:\n${lines.join('\n')}`);
    this.name = 'TenantConfigError';
  }
}

// ─── Options ─────────────────────────────────────────────────────────────────

export interface LoadTenantConfigOptions {
  /** Directory to look for tenant.config.json. Defaults to process.cwd(). */
  configDir?: string;

  /** Explicit path to a config file. Overrides configDir lookup. */
  configPath?: string;

  /**
   * Environment variables to read from. Defaults to process.env.
   * Injectable for testing.
   */
  env?: Record<string, string | undefined>;
}

// ─── Loader ──────────────────────────────────────────────────────────────────

/**
 * Load and resolve tenant configuration.
 *
 * Resolution order (later overrides earlier):
 * 1. Zod schema defaults
 * 2. tenant.config.json file (if it exists)
 * 3. Environment variables (ARO_UI_MODEL, ARO_ENABLED_MODULES)
 * 4. Zod validation — fail fast on invalid
 *
 * The caller is responsible for loading dotenv before calling this function.
 */
export function loadTenantConfig(options: LoadTenantConfigOptions = {}): TenantConfig {
  const env = options.env ?? process.env;

  // Step 1: Load config file (if present)
  let fileConfig: TenantConfigInput = {};
  const configPath = options.configPath ?? findConfigFile(options.configDir);

  if (configPath && existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(raw) as TenantConfigInput;
    } catch (err) {
      throw new TenantConfigError([{
        path: '(file)',
        message: `Failed to parse ${configPath}: ${err instanceof Error ? err.message : String(err)}`,
      }]);
    }
  }

  // Step 2: Apply env var overrides
  const merged = applyEnvOverrides(fileConfig, env);

  // Step 3: Validate with Zod (applies defaults for missing fields)
  const result = TenantConfigSchema.safeParse(merged);

  if (!result.success) {
    const issues = result.error.errors.map((e) => ({
      path: e.path.join('.') || '(root)',
      message: e.message,
    }));
    throw new TenantConfigError(issues);
  }

  return result.data;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findConfigFile(dir?: string): string | null {
  const searchDir = dir ?? process.cwd();
  const candidate = resolve(searchDir, 'tenant.config.json');
  return existsSync(candidate) ? candidate : null;
}

/**
 * Apply environment variable overrides to the raw config input.
 *
 * - ARO_UI_MODEL      → overrides uiModel
 * - ARO_ENABLED_MODULES → overrides enabledModules (comma-separated)
 *
 * Only applies the override if the env var is set and non-empty.
 */
function applyEnvOverrides(
  config: TenantConfigInput,
  env: Record<string, string | undefined>,
): TenantConfigInput {
  const result = { ...config };

  const uiModel = env.ARO_UI_MODEL?.trim().toLowerCase();
  if (uiModel) {
    (result as Record<string, unknown>).uiModel = uiModel;
  }

  const enabledModules = env.ARO_ENABLED_MODULES?.trim();
  if (enabledModules) {
    (result as Record<string, unknown>).enabledModules = enabledModules
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  return result;
}
