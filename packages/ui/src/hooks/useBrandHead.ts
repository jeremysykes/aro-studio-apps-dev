import { useEffect } from 'react';
import type { TenantConfig } from '@aro/types';

/**
 * Keeps document <title> and favicon in sync with the tenant brand config.
 * Runs once on mount and re-runs when the config values change.
 */
export function useBrandHead(config: TenantConfig): void {
  // ── Document title ────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = config.appName;
  }, [config.appName]);

  // ── Favicon ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!config.faviconUrl) return;

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = config.faviconUrl;
  }, [config.faviconUrl]);
}
