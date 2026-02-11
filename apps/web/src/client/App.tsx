import React, { useEffect, useState } from 'react';
import { moduleComponents } from './moduleRegistry';

function App() {
  const [ActiveComponent, setActiveComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.aro.getActiveModuleKey().then((key) => {
      if (cancelled) return;
      const Component = moduleComponents[key];
      if (!Component) {
        setError(`Invalid ARO_ACTIVE_MODULE: '${key}'. Use one of: hello-world, inspect.`);
        return;
      }
      setActiveComponent(() => Component);
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

  if (!ActiveComponent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <ActiveComponent />;
}

export default App;
