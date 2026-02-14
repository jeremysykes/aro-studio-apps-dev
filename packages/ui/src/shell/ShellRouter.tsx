import React, { useState } from 'react';
import type { UIModel } from '@aro/types';
import { ShellLayout } from './ShellLayout';
import { DashboardLayout } from './DashboardLayout';
import { TabsLayout } from './TabsLayout';
import { CarouselLayout } from './CarouselLayout';
import { ModuleErrorBoundary } from './ModuleErrorBoundary';
import type { ModuleRegistryEntry } from './Sidebar';

export interface ShellRouterProps {
  uiModel: UIModel;
  modules: ModuleRegistryEntry[];
}

/**
 * Routes to the correct shell layout based on the active UI model.
 * Used by both Desktop and Web App.tsx to avoid duplicating the
 * model-selection render logic.
 */
export function ShellRouter({ uiModel, modules }: ShellRouterProps) {
  const [activeKey, setActiveKey] = useState<string>(modules[0]?.key ?? '');

  const activeEntry = modules.find((m) => m.key === activeKey);
  const ActiveModule = activeEntry?.component;

  // Standalone mode — no shell, module owns the full screen
  if (uiModel === 'standalone') {
    return activeEntry && ActiveModule ? (
      <ModuleErrorBoundary key={activeKey} moduleKey={activeKey} moduleLabel={activeEntry.label}>
        <ActiveModule />
      </ModuleErrorBoundary>
    ) : null;
  }

  // Dashboard mode — responsive grid of widget cards with expand
  if (uiModel === 'dashboard') {
    return <DashboardLayout modules={modules} />;
  }

  // Tabs mode — horizontal tab bar, one module visible at a time
  if (uiModel === 'tabs') {
    return <TabsLayout modules={modules} />;
  }

  // Carousel mode — swipe/arrow navigation with dot indicators
  // Wrapper constrains viewport so footer stays at bottom; only main content scrolls
  if (uiModel === 'carousel') {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        <CarouselLayout modules={modules} />
      </div>
    );
  }

  // Sidebar mode — vertical nav, one module visible at a time (default)
  return (
    <ShellLayout modules={modules} activeKey={activeKey} onSelect={setActiveKey}>
      {activeEntry && ActiveModule ? (
        <ModuleErrorBoundary key={activeKey} moduleKey={activeKey} moduleLabel={activeEntry.label}>
          <ActiveModule />
        </ModuleErrorBoundary>
      ) : null}
    </ShellLayout>
  );
}
