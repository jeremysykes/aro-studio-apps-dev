/**
 * Cross-reference tokens and components across surfaces; merge into unified lists.
 */
import type { Token } from '../types.js';
import type { Component, FigmaComponent } from '../types.js';

// ── Component matching options ────────────────────────────────────────────────
export interface ComponentMatchOptions {
  namingStrategy?: 'exact' | 'fuzzy' | 'prefix-strip';
  fuzzyThreshold?: number;
}

/** Normalize a component name for fuzzy comparison: lowercase, strip whitespace/hyphens/underscores. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]/g, '');
}

/**
 * Levenshtein similarity: 1 - (editDistance / max(a.length, b.length)).
 * Returns 1.0 for identical strings, 0.0 for completely different.
 * Pure function, deterministic, no external state.
 */
function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (la === 0 || lb === 0) return 0;

  const prev = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    let corner = prev[0];
    prev[0] = i;
    for (let j = 1; j <= lb; j++) {
      const upper = prev[j];
      prev[j] = a[i - 1] === b[j - 1]
        ? corner
        : 1 + Math.min(corner, upper, prev[j - 1]);
      corner = upper;
    }
  }

  return 1 - prev[lb] / Math.max(la, lb);
}

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
  figmaComponents: FigmaComponent[],
  storybookComponents: Component[],
  options?: ComponentMatchOptions
): Component[] {
  const strategy = options?.namingStrategy ?? 'fuzzy';
  const threshold = options?.fuzzyThreshold ?? 0.8;

  const byName = new Map<string, Component>();

  // Strategy-aware key: exact uses layerName/name; prefix-strip and fuzzy use
  // layerName alone (collapses variants sharing the same parent into one entry).
  function figmaKey(fc: FigmaComponent): string {
    if (strategy === 'exact') {
      return fc.layerName ? `${fc.layerName}/${fc.name}` : fc.name;
    }
    return fc.layerName ?? fc.name;
  }

  // Step 1: Register Figma components (collapsing variants for prefix-strip/fuzzy)
  for (const fc of figmaComponents) {
    const key = figmaKey(fc);
    if (byName.has(key)) continue; // variant collapse: first wins
    byName.set(key, {
      name: strategy === 'exact' ? fc.name : (fc.layerName ?? fc.name),
      layerName: fc.layerName,
      surfaces: { figma: true, storybook: false, code: false },
      coverage: ['figma'],
      isOrphan: false,
    });
  }

  // Step 2: Match Storybook components by key lookup
  const unmatchedStorybook: Component[] = [];
  for (const c of storybookComponents) {
    const key = c.name; // Storybook components have no layerName
    const existing = byName.get(key);
    if (existing) {
      existing.surfaces.storybook = true;
      if (!existing.coverage.includes('storybook')) existing.coverage.push('storybook');
      if (c.category) existing.category = c.category;
      if (c.storyIds?.length) existing.storyIds = c.storyIds;
    } else if (strategy === 'fuzzy') {
      unmatchedStorybook.push(c);
    } else {
      byName.set(key, {
        ...c,
        surfaces: { ...c.surfaces, storybook: true },
      });
    }
  }

  // Step 3: Fuzzy matching pass (only when strategy === 'fuzzy')
  if (strategy === 'fuzzy' && unmatchedStorybook.length > 0) {
    const unmatchedFigmaKeys: string[] = [];
    for (const [key, comp] of byName) {
      if (!comp.surfaces.storybook) unmatchedFigmaKeys.push(key);
    }
    unmatchedFigmaKeys.sort(); // deterministic iteration order

    const matchedFigmaKeys = new Set<string>();
    const sortedUnmatched = [...unmatchedStorybook].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    for (const sbComp of sortedUnmatched) {
      const sbNorm = normalize(sbComp.name);
      let bestKey: string | null = null;
      let bestScore = 0;

      for (const fKey of unmatchedFigmaKeys) {
        if (matchedFigmaKeys.has(fKey)) continue;
        const figmaNorm = normalize(fKey);
        const score = levenshteinSimilarity(sbNorm, figmaNorm);
        if (score >= threshold && score > bestScore) {
          bestScore = score;
          bestKey = fKey;
        } else if (score >= threshold && score === bestScore && bestKey !== null) {
          if (fKey.localeCompare(bestKey) < 0) bestKey = fKey;
        }
      }

      if (bestKey !== null) {
        const existing = byName.get(bestKey)!;
        existing.surfaces.storybook = true;
        if (!existing.coverage.includes('storybook')) existing.coverage.push('storybook');
        if (sbComp.category) existing.category = sbComp.category;
        if (sbComp.storyIds?.length) existing.storyIds = sbComp.storyIds;
        matchedFigmaKeys.add(bestKey);
      } else {
        byName.set(sbComp.name, {
          ...sbComp,
          surfaces: { ...sbComp.surfaces, storybook: true },
        });
      }
    }
  }

  // Step 4: Mark orphans
  const components = Array.from(byName.values());
  const withCoverage = components.map((c) => ({
    ...c,
    isOrphan: c.coverage.length < 2,
  }));
  return withCoverage;
}
