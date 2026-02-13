import React from 'react';
import { Sidebar } from './Sidebar';
import type { ModuleRegistryEntry } from './moduleRegistry';

interface ShellLayoutProps {
  modules: ModuleRegistryEntry[];
  activeKey: string;
  onSelect: (key: string) => void;
  children: React.ReactNode;
}

export function ShellLayout({ modules, activeKey, onSelect, children }: ShellLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar modules={modules} activeKey={activeKey} onSelect={onSelect} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
