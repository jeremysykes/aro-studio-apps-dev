import React, { useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { WidgetCard } from './WidgetCard';
import type { ModuleRegistryEntry } from './Sidebar';

interface DashboardLayoutProps {
  modules: ModuleRegistryEntry[];
}

/**
 * Dashboard shell layout. Renders all enabled modules as widget cards
 * in a responsive grid. Clicking "Open" on a card expands to the full
 * module view with a back button.
 */
export function DashboardLayout({ modules }: DashboardLayoutProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const handleExpand = useCallback((key: string) => {
    setExpandedKey(key);
  }, []);

  const handleCollapse = useCallback(() => {
    setExpandedKey(null);
  }, []);

  const expandedModule = expandedKey
    ? modules.find((m) => m.key === expandedKey)
    : null;

  // Expanded: render the full module component
  if (expandedModule) {
    const FullComponent = expandedModule.component;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <header className="flex items-center gap-3 h-14 px-6 border-b border-zinc-200 bg-white shrink-0">
          <Button variant="ghost" size="xs" onClick={handleCollapse}>
            &larr; Dashboard
          </Button>
          <span className="text-lg font-semibold">{expandedModule.label}</span>
        </header>
        <main className="flex-1 min-h-0 overflow-auto">
          <FullComponent />
        </main>
      </div>
    );
  }

  // Grid: render all widgets
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center h-14 px-6 border-b border-zinc-200 shrink-0">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
          {modules.map((mod) => (
            <WidgetCard key={mod.key} module={mod} onExpand={handleExpand} />
          ))}
        </div>
      </main>
    </div>
  );
}
