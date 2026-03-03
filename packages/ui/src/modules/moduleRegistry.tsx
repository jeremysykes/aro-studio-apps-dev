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
 * Aro Inspect module theme — warm, zeroheight-inspired look.
 *
 * Overrides the default zinc palette with warm cream backgrounds,
 * slate foreground tones, and a deep indigo primary accent.
 * Tokens NOT overridden: destructive, sidebar, surface-overlay,
 * foreground-on-emphasis (those stay on tenant/default values).
 */
const inspectTheme: Record<string, string> = {
  // Backgrounds — warm cream that complements indigo primary
  '--aro-background': '#edeae3',
  '--aro-background-muted': '#F8F8F8',
  '--aro-background-subtle': '#e3e0d8',

  // Surfaces — pure white cards stand out from the warm canvas/main
  '--aro-surface': '#ffffff',
  '--aro-surface-muted': '#faf9f7',
  '--aro-surface-raised': '#f0eee9',

  // Foreground — slate tones instead of zinc
  '--aro-foreground': '#0f172a',
  '--aro-foreground-default': '#1e293b',
  '--aro-foreground-muted': '#475569',
  '--aro-foreground-subtle': '#64748b',

  // Borders — warm beige-ish instead of zinc-200
  '--aro-border-default': '#e2dfd9',
  '--aro-border-muted': '#e8e5df',
  '--aro-border-emphasis': '#334155',

  // Primary — deep indigo instead of zinc-900
  '--aro-primary': '#4338ca',
  '--aro-primary-hover': '#3730a3',
  '--aro-primary-foreground': '#ffffff',

  // Secondary — darker warm tint so TabsList stands out from main bg
  '--aro-secondary': '#e6e3db',
  '--aro-secondary-hover': '#dcd8ce',
  '--aro-secondary-foreground': '#1e293b',

  // Focus rings — match indigo primary
  '--aro-ring': '#4338ca',
  '--aro-ring-muted': '#818cf8',
  '--aro-ring-offset': '#f5f3ee',

  // Shadows — slightly more prominent card elevation
  '--aro-shadow-card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  '--aro-shadow-card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
  '--aro-shadow-raised': '0 2px 4px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',

  // Interactive states — warm tones
  '--aro-hover': '#f5f3ef',
  '--aro-active': '#ebe8e2',

  // Table
  '--aro-table-header-background': '#faf9f7',
};

/**
 * Full registry of module entries with metadata for sidebar rendering.
 * Must match the keys registered in server-side moduleRegistry.
 */
export const moduleRegistry: ModuleRegistryEntry[] = [
  { key: 'inspect', label: 'Inspect', description: 'Design system inventory & health', icon: <SearchIcon />, component: Inspect, theme: inspectTheme },
  { key: 'hello-world', label: 'Hello World', description: 'Default development module', icon: <WaveIcon />, component: HelloWorld },
];

/**
 * Flat lookup by key — used by standalone mode and sidebar component resolution.
 */
export const moduleComponents: Record<string, React.ComponentType> = Object.fromEntries(
  moduleRegistry.map((m) => [m.key, m.component]),
);
