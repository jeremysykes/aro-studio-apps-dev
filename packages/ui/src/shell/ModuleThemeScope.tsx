import React from 'react';
import { cn } from '../lib/utils';

interface ModuleThemeScopeProps {
  theme?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
}

/**
 * Scoped theme wrapper for module content areas.
 *
 * When a module provides a `theme` map of `--aro-*` CSS custom properties,
 * this component renders a `<div>` with those properties as inline styles
 * and paints `bg-background` so the themed canvas colour is visible.
 * Descendants using Tailwind utilities (e.g. `bg-primary`) resolve through
 * the `@theme inline` bridge and pick up the overridden values.
 *
 * When no theme is provided, children are rendered directly with zero DOM
 * overhead.
 */
export function ModuleThemeScope({ theme, className, children }: ModuleThemeScopeProps) {
  if (!theme || Object.keys(theme).length === 0) {
    return <>{children}</>;
  }

  return (
    <div style={theme as React.CSSProperties} className={cn('bg-background', className)}>
      {children}
    </div>
  );
}
