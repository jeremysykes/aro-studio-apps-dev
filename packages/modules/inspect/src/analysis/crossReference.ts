/**
 * Cross-reference tokens and components across surfaces; merge into unified lists.
 */
import type { Token } from '../types.js';
import type { Component } from '../types.js';

function tokensByName(tokens: Token[]): Map<string, Token[]> {
  const m = new Map<string, Token[]>();
  for (const t of tokens) {
    const list = m.get(t.name) ?? [];
    list.push(t);
    m.set(t.name, list);
  }
  return m;
}

/** Merge tokens from multiple sources; detect duplicates (same name, different source). */
export function crossReferenceTokens(tokenLists: { source: string; tokens: Token[] }[]): {
  merged: Token[];
  duplicateNames: string[];
  driftCandidates: Array<{ name: string; values: string[] }>;
} {
  const all: Token[] = [];
  for (const { source, tokens } of tokenLists) {
    for (const t of tokens) {
      all.push({ ...t, source });
    }
  }
  const byName = tokensByName(all);
  const duplicateNames: string[] = [];
  const driftCandidates: Array<{ name: string; values: string[] }> = [];
  for (const [name, list] of byName) {
    const sources = new Set(list.map((t) => t.source));
    if (sources.size > 1) {
      const values = [...new Set(list.map((t) => t.value))];
      if (values.length > 1) driftCandidates.push({ name, values });
    }
    if (list.length > 1) {
      duplicateNames.push(name);
    }
  }
  const merged = all;
  return { merged, duplicateNames, driftCandidates };
}

/** Merge components: set surfaces and coverage from scan results; mark orphans. */
export function crossReferenceComponents(
  figmaNames: string[],
  storybookComponents: Component[]
): Component[] {
  const byName = new Map<string, Component>();
  for (const name of figmaNames) {
    byName.set(name, {
      name,
      surfaces: { figma: true, storybook: false, code: false },
      coverage: ['figma'],
      isOrphan: false,
    });
  }
  for (const c of storybookComponents) {
    const existing = byName.get(c.name);
    if (existing) {
      existing.surfaces.storybook = true;
      if (!existing.coverage.includes('storybook')) existing.coverage.push('storybook');
      if (c.category) existing.category = c.category;
      if (c.storyIds?.length) existing.storyIds = c.storyIds;
    } else {
      byName.set(c.name, {
        ...c,
        surfaces: { ...c.surfaces, storybook: true },
      });
    }
  }
  const components = Array.from(byName.values());
  const withCoverage = components.map((c) => ({
    ...c,
    isOrphan: c.coverage.length < 2,
  }));
  return withCoverage;
}
