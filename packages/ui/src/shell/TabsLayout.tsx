import React, { useState } from 'react';
import { cn } from '../lib/utils';
import type { ModuleRegistryEntry } from './Sidebar';

interface TabsLayoutProps {
  modules: ModuleRegistryEntry[];
}

/**
 * Tabs shell layout. Horizontal tab bar at the top with one module
 * visible at a time. Lighter visual weight than the sidebar; best
 * suited for 2–4 modules.
 */
export function TabsLayout({ modules }: TabsLayoutProps) {
  const [activeKey, setActiveKey] = useState<string>(modules[0]?.key ?? '');

  const ActiveModule = modules.find((m) => m.key === activeKey)?.component;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <nav className="flex items-center gap-1 h-11 px-4 border-b border-zinc-200 bg-zinc-50 shrink-0">
        {modules.map((mod) => (
          <button
            key={mod.key}
            onClick={() => setActiveKey(mod.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeKey === mod.key
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100',
            )}
            aria-current={activeKey === mod.key ? 'page' : undefined}
          >
            <span className="w-4 h-4 shrink-0">{mod.icon}</span>
            {mod.label}
          </button>
        ))}
      </nav>
      <main className="flex-1 min-h-0 overflow-auto">
        {ActiveModule ? <ActiveModule /> : null}
      </main>
    </div>
  );
}
