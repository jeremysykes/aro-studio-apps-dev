/**
 * Storybook scanner: index.json (SB 7+) or stories.json (v6).
 * Input: indexUrl (fetch) or indexPath (workspace.readText).
 * Output: Component[] with storybook surface (storyIds, argTypes).
 */
import type { Component } from '../types.js';
import type { WorkspaceFacet } from '../types.js';

function stripHierarchy(title: string): string {
  const parts = title.split('/');
  return parts[parts.length - 1]?.trim() ?? title;
}

export async function scanStorybookFromUrl(indexUrl: string): Promise<Component[]> {
  const res = await fetch(indexUrl);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    entries?: Record<string, { type?: string; id: string; title?: string; name?: string; importPath?: string; argTypes?: unknown }>;
    stories?: Record<string, { id: string; title?: string; name?: string; argTypes?: unknown }>;
  };
  const byComponent = new Map<string, { storyIds: string[]; argTypes: unknown }>();
  const entries = data.entries ?? data.stories ?? {};
  for (const [id, entry] of Object.entries(entries)) {
    const title = entry.title ?? entry.name ?? id;
    const componentName = stripHierarchy(title);
    const existing = byComponent.get(componentName) ?? { storyIds: [], argTypes: entry.argTypes ?? {} };
    existing.storyIds.push(entry.id ?? id);
    byComponent.set(componentName, existing);
  }
  return Array.from(byComponent.entries()).map(([name, { storyIds }]) => ({
    name,
    surfaces: { figma: false, storybook: true, code: false },
    coverage: ['storybook'],
    isOrphan: false,
  }));
}

export function scanStorybookFromPath(workspace: WorkspaceFacet, indexPath: string): Component[] {
  if (!workspace.exists(indexPath)) return [];
  let content: string;
  try {
    content = workspace.readText(indexPath);
  } catch {
    return [];
  }
  let data: { entries?: Record<string, { id: string; title?: string; name?: string }>; stories?: Record<string, { id: string; title?: string; name?: string }> };
  try {
    data = JSON.parse(content);
  } catch {
    return [];
  }
  const byComponent = new Map<string, string[]>();
  const entries = data.entries ?? data.stories ?? {};
  for (const entry of Object.values(entries)) {
    const title = entry.title ?? entry.name ?? entry.id;
    const componentName = stripHierarchy(title);
    const list = byComponent.get(componentName) ?? [];
    list.push(entry.id);
    byComponent.set(componentName, list);
  }
  return Array.from(byComponent.keys()).map((name) => ({
    name,
    surfaces: { figma: false, storybook: true, code: false },
    coverage: ['storybook'],
    isOrphan: false,
  }));
}
