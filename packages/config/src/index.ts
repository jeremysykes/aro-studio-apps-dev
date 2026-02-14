export {
  TenantConfigSchema,
  UIModelSchema,
  BrandSchema,
  ThemeTokensSchema,
  FeatureFlagsSchema,
} from './schema.js';
export type { TenantConfig, TenantConfigInput } from './schema.js';

export { loadTenantConfig, TenantConfigError } from './loader.js';
export type { LoadTenantConfigOptions } from './loader.js';
