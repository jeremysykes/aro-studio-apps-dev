import React, { useEffect, useState } from 'react';
import type { UIModel } from '@aro/types';
import { moduleRegistry, type ModuleRegistryEntry } from './moduleRegistry';
import { ShellLayout } from './ShellLayout';
import { DashboardLayout, TabsLayout, CarouselLayout } from '@aro/ui/shell';

function App() {
  const [uiModel, setUIModel] = useState<UIModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabledModules, setEnabledModules] = useState<ModuleRegistryEntry[]>([]);
  const [activeKey, setActiveKey] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([window.aro.getUIModel(), window.aro.getEnabledModules()]).then(
      ([model, enabledKeys]) => {
        if (cancelled) return;

        const entries = enabledKeys
          .map((key) => moduleRegistry.find((m) => m.key === key))
          .filter((entry): entry is ModuleRegistryEntry => !!entry);

        if (entries.length === 0) {
          setError('No enabled modules found. Set ARO_ENABLED_MODULES in .env.');
          return;
        }

        setUIModel(model);
        setEnabledModules(entries);
        setActiveKey(entries[0].key);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  // Loading
  if (!uiModel) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const ActiveModule = enabledModules.find((m) => m.key === activeKey)?.component;

  // Standalone mode — no shell, module owns the full screen
  if (uiModel === 'standalone') {
    return ActiveModule ? <ActiveModule /> : null;
  }

  // Dashboard mode — responsive grid of widget cards with expand
  if (uiModel === 'dashboard') {
    return <DashboardLayout modules={enabledModules} />;
  }

  // Tabs mode — horizontal tab bar, one module visible at a time
  if (uiModel === 'tabs') {
    return <TabsLayout modules={enabledModules} />;
  }

  // Carousel mode — swipe/arrow navigation with dot indicators
  // Wrapper constrains viewport so footer stays at bottom; only main content scrolls
  if (uiModel === 'carousel') {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        <CarouselLayout modules={enabledModules} />
      </div>
    );
  }

  // Sidebar mode — vertical nav, one module visible at a time
  return (
    <ShellLayout modules={enabledModules} activeKey={activeKey} onSelect={setActiveKey}>
      {ActiveModule ? <ActiveModule /> : null}
    </ShellLayout>
  );
}

export default App;
