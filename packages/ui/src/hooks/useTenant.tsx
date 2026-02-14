import React, { createContext, useContext, useMemo } from 'react';
import type { TenantConfig } from '@aro/types';

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_TENANT: TenantConfig = {
  uiModel: 'standalone',
  enabledModules: [],
  brand: { appName: 'Aro Studio' },
  theme: {},
  features: {},
};

// ─── Context ─────────────────────────────────────────────────────────────────

const TenantContext = createContext<TenantConfig>(DEFAULT_TENANT);

// ─── Provider ────────────────────────────────────────────────────────────────

export interface TenantProviderProps {
  config?: Partial<TenantConfig>;
  children: React.ReactNode;
}

/**
 * Provides tenant configuration to the component tree.
 * Merges the supplied partial config over sensible defaults so
 * every consumer always sees a complete TenantConfig.
 */
export function TenantProvider({ config, children }: TenantProviderProps) {
  const merged = useMemo<TenantConfig>(
    () => ({
      ...DEFAULT_TENANT,
      ...config,
      brand: { ...DEFAULT_TENANT.brand, ...config?.brand },
    }),
    [config],
  );

  return <TenantContext.Provider value={merged}>{children}</TenantContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/** Returns the active tenant configuration. */
export function useTenant(): TenantConfig {
  return useContext(TenantContext);
}
