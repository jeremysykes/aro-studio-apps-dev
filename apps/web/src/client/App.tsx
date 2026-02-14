import React, { useEffect, useState } from 'react';
import type { UIModel } from '@aro/types';
import { Alert, AlertDescription } from '@aro/ui/components';
import { TenantProvider, useTenant, useBrandHead } from '@aro/ui/hooks';
import { moduleRegistry, type ModuleRegistryEntry } from './moduleRegistry';
import { ShellRouter } from '@aro/ui/shell';

function AppShell() {
  const tenant = useTenant();
  useBrandHead(tenant);

  const [uiModel, setUIModel] = useState<UIModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabledModules, setEnabledModules] = useState<ModuleRegistryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    window.aro.getTenantConfig().then((config) => {
      if (cancelled) return;

      // Standalone mode loads only the first module
      const enabledKeys = config.uiModel === 'standalone'
        ? config.enabledModules.slice(0, 1)
        : config.enabledModules;

      const entries = enabledKeys
        .map((key) => moduleRegistry.find((m) => m.key === key))
        .filter((entry): entry is ModuleRegistryEntry => !!entry);

      if (entries.length === 0) {
        setError('No enabled modules found. Set ARO_ENABLED_MODULES in .env.');
        return;
      }

      setUIModel(config.uiModel);
      setEnabledModules(entries);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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

  return <ShellRouter uiModel={uiModel} modules={enabledModules} />;
}

function App() {
  return (
    <TenantProvider>
      <AppShell />
    </TenantProvider>
  );
}

export default App;
