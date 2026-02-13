import React, { useEffect, useState } from 'react';
import { moduleComponents, moduleRegistry, type ModuleRegistryEntry } from './moduleRegistry';
import { ShellLayout } from './ShellLayout';

type UIModel = 'standalone' | 'sidebar' | 'dashboard';

function App() {
  const [uiModel, setUIModel] = useState<UIModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Standalone state
  const [StandaloneComponent, setStandaloneComponent] = useState<React.ComponentType | null>(null);

  // Sidebar state
  const [enabledModules, setEnabledModules] = useState<ModuleRegistryEntry[]>([]);
  const [activeKey, setActiveKey] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    window.aro.getUIModel().then(async (model) => {
      if (cancelled) return;

      if (model === 'standalone') {
        setUIModel('standalone');
        const key = await window.aro.getActiveModuleKey();
        if (cancelled) return;
        const Component = moduleComponents[key];
        if (!Component) {
          setError(`Invalid ARO_ACTIVE_MODULE: '${key}'. Use one of: ${Object.keys(moduleComponents).join(', ')}.`);
          return;
        }
        setStandaloneComponent(() => Component);
      } else {
        // sidebar or dashboard — load enabled modules
        setUIModel(model);
        const enabledKeys = await window.aro.getEnabledModules();
        if (cancelled) return;
        const entries = enabledKeys
          .map((key) => moduleRegistry.find((m) => m.key === key))
          .filter((entry): entry is ModuleRegistryEntry => !!entry);

        if (entries.length === 0) {
          setError('No enabled modules found. Set ARO_ENABLED_MODULES in .env.');
          return;
        }
        setEnabledModules(entries);
        setActiveKey(entries[0].key);
      }
    });

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

  // Standalone mode — original behaviour
  if (uiModel === 'standalone') {
    if (!StandaloneComponent) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      );
    }
    return <StandaloneComponent />;
  }

  // Sidebar mode (and dashboard, which extends sidebar)
  const ActiveModule = enabledModules.find((m) => m.key === activeKey)?.component;

  return (
    <ShellLayout modules={enabledModules} activeKey={activeKey} onSelect={setActiveKey}>
      {ActiveModule ? <ActiveModule /> : null}
    </ShellLayout>
  );
}

export default App;
