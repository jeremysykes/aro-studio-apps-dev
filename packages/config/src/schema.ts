import { z } from 'zod';

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

/** All valid UI models for the application shell. */
export const UIModelSchema = z.enum([
  'standalone',
  'sidebar',
  'dashboard',
  'tabs',
  'carousel',
]);

/** Brand identity configuration. */
export const BrandSchema = z.object({
  /** Application name shown in title bar, headers, and meta tags. */
  appName: z.string().default('Aro Studio'),
  /** URL or data-URI for the brand logo. */
  logoUrl: z.string().optional(),
  /** URL or data-URI for the browser/app favicon. */
  faviconUrl: z.string().optional(),
  /** Key of a registered React component for the splash/loading screen. */
  splashComponent: z.string().optional(),
}).default({});

/**
 * Theme token overrides. Keys are CSS custom property names (without --aro- prefix),
 * values are CSS values. Applied as :root overrides.
 */
export const ThemeTokensSchema = z.record(z.string()).default({});

/** Feature flags. All default to false (opt-in). */
export const FeatureFlagsSchema = z.record(z.boolean()).default({});

// ─── Full tenant config ──────────────────────────────────────────────────────

/** The complete tenant configuration schema with Zod validation. */
export const TenantConfigSchema = z.object({
  /** Which UI model to render. */
  uiModel: UIModelSchema.default('standalone'),

  /** Which module keys are enabled (order matters for sidebar/dashboard). */
  enabledModules: z.array(z.string()).default([]),

  /** Brand identity. */
  brand: BrandSchema,

  /** Theme token overrides (CSS custom property values). */
  theme: ThemeTokensSchema,

  /** Feature flags. */
  features: FeatureFlagsSchema,
});

/** Fully resolved TenantConfig — every field present with defaults applied. */
export type TenantConfig = z.infer<typeof TenantConfigSchema>;

/** Input type — allows partial fields before Zod applies defaults. */
export type TenantConfigInput = z.input<typeof TenantConfigSchema>;
