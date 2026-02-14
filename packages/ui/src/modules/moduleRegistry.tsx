/**
 * Shared renderer-side module registry.
 * All module UI components, icons, and metadata live here.
 * Host renderer registries re-export from this file.
 */
import React from 'react';
import HelloWorld from '@aro/module-hello-world/ui';
import Inspect from '@aro/module-inspect/ui';
import type { ModuleRegistryEntry } from '../shell/Sidebar';

export type { ModuleRegistryEntry };

/**
 * Inline SVG icons — no icon library in the project.
 * Each is a 20x20 SVG matching the sidebar icon size.
 */
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const WaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17.259V6.741a1 1 0 0 1 1.504-.864l8.008 4.63a1 1 0 0 1 .399 1.354l-.399.61-8.008 4.629A1 1 0 0 1 7 17.259z" />
  </svg>
);

/**
 * Full registry of module entries with metadata for sidebar rendering.
 * Must match the keys registered in server-side moduleRegistry.
 */
export const moduleRegistry: ModuleRegistryEntry[] = [
  { key: 'inspect', label: 'Inspect', description: 'Design system inventory & health', icon: <SearchIcon />, component: Inspect },
  { key: 'hello-world', label: 'Hello World', description: 'Default development module', icon: <WaveIcon />, component: HelloWorld },
];

/**
 * Flat lookup by key — used by standalone mode and sidebar component resolution.
 */
export const moduleComponents: Record<string, React.ComponentType> = Object.fromEntries(
  moduleRegistry.map((m) => [m.key, m.component]),
);
