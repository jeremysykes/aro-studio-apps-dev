import React, { createContext, useContext, useMemo } from 'react';
import type { TenantConfig } from '@aro/types';

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_TENANT: TenantConfig = {
  appName: 'Aro Studio',
};

// ─── Context ─────────────────────────────────────────────────────────────────

const TenantContext = createContext<TenantConfig>(DEFAULT_TENANT);

// ─── Provider ────────────────────────────────────────────────────────────────

export interface TenantProviderProps {
  config?: Partial<TenantConfig>;
  children: React.ReactNode;
}

/**
 * Provides tenant brand configuration to the component tree.
 * Merges the supplied partial config over sensible defaults so
 * every consumer always sees a complete TenantConfig.
 */
export function TenantProvider({ config, children }: TenantProviderProps) {
  const merged = useMemo<TenantConfig>(
    () => ({ ...DEFAULT_TENANT, ...config }),
    [config],
  );

  return <TenantContext.Provider value={merged}>{children}</TenantContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/** Returns the active tenant brand configuration. */
export function useTenant(): TenantConfig {
  return useContext(TenantContext);
}
