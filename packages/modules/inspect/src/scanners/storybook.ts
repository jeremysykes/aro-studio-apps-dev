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

function extractCategory(title: string, id?: string): string | undefined {
  const parts = title.split('/');
  if (parts.length > 1) return parts[0]?.trim();
  // Fallback: derive from id (e.g. "atoms-button--default" -> "Atoms")
  if (id) {
    const prefix = id.split('--')[0];
    const first = prefix?.split('-')[0];
    if (first) return first.charAt(0).toUpperCase() + first.slice(1);
  }
  return undefined;
}

type StorybookIndexEntry = {
  type?: string;
  id: string;
  title?: string;
  name?: string;
  importPath?: string;
  argTypes?: unknown;
};
type StorybookIndexData = {
  entries?: Record<string, StorybookIndexEntry>;
  stories?: Record<string, StorybookIndexEntry>;
};

function componentsFromIndexData(data: StorybookIndexData): Component[] {
  const byComponent = new Map<string, { storyIds: string[]; argTypes: unknown; category?: string }>();
  const entries = data.entries ?? data.stories ?? {};
  for (const [id, entry] of Object.entries(entries)) {
    const title = entry.title ?? entry.name ?? id;
    const componentName = stripHierarchy(title);
    const category = extractCategory(title, entry.id ?? id);
    const existing = byComponent.get(componentName);
    if (existing) {
      existing.storyIds.push(entry.id ?? id);
      if (!existing.category && category) existing.category = category;
    } else {
      byComponent.set(componentName, { storyIds: [entry.id ?? id], argTypes: entry.argTypes ?? {}, category });
    }
  }
  return Array.from(byComponent.entries()).map(([name, { category }]) => ({
    name,
    category,
    surfaces: { figma: false, storybook: true, code: false },
    coverage: ['storybook'],
    isOrphan: false,
  }));
}

export async function scanStorybookFromUrl(indexUrl: string): Promise<Component[]> {
  const res = await fetch(indexUrl);
  if (!res.ok) return [];
  const text = await res.text();

  let data: StorybookIndexData | undefined;

  if (text.trimStart().startsWith('<')) {
    const u = new URL(indexUrl);
    const base = u.origin + (u.pathname.replace(/\/$/, '') || '') + '/';
    const candidates = ['index.json', 'stories.json'];
    for (const candidate of candidates) {
      const indexRes = await fetch(base + candidate);
      if (!indexRes.ok) continue;
      const indexText = await indexRes.text();
      try {
        const parsed = JSON.parse(indexText) as StorybookIndexData;
        if (parsed.entries != null || parsed.stories != null) {
          data = parsed;
          break;
        }
      } catch {
        continue;
      }
    }
    if (data === undefined) {
      throw new Error(
        `Storybook URL returned HTML but index not found. Use the index URL, e.g. ${base}index.json`
      );
    }
  } else {
    try {
      data = JSON.parse(text) as StorybookIndexData;
    } catch {
      throw new Error(
        'Response is not valid JSON; use the Storybook index URL (e.g. .../index.json)'
      );
    }
  }

  return componentsFromIndexData(data);
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
  const byComponent = new Map<string, { storyIds: string[]; category?: string }>();
  const entries = data.entries ?? data.stories ?? {};
  for (const entry of Object.values(entries)) {
    const title = entry.title ?? entry.name ?? entry.id;
    const componentName = stripHierarchy(title);
    const category = extractCategory(title, entry.id);
    const existing = byComponent.get(componentName);
    if (existing) {
      existing.storyIds.push(entry.id);
      if (!existing.category && category) existing.category = category;
    } else {
      byComponent.set(componentName, { storyIds: [entry.id], category });
    }
  }
  return Array.from(byComponent.entries()).map(([name, { category }]) => ({
    name,
    category,
    surfaces: { figma: false, storybook: true, code: false },
    coverage: ['storybook'],
    isOrphan: false,
  }));
}
