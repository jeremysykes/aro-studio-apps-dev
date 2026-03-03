import { useEffect } from 'react';
import type { TenantConfig } from '@aro/types';

/**
 * Applies tenant theme overrides as CSS custom properties on the
 * document root. Runs on mount and re-runs when theme values change.
 * On cleanup, removes the overridden properties so the CSS defaults
 * defined in tokens.css take effect again.
 */
export function useThemeTokens(config: TenantConfig): void {
  useEffect(() => {
    const style = document.documentElement.style;
    const keys = Object.keys(config.theme);

    for (const key of keys) {
      style.setProperty(key, config.theme[key]);
    }

    return () => {
      for (const key of keys) {
        style.removeProperty(key);
      }
    };
  }, [config.theme]);
}
