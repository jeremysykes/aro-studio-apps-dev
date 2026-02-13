/**
 * Health score: sub-scores (0–100) and weighted composite.
 * Base weights: Token consistency 30%, Component coverage 30%, Naming alignment 20%, Value parity 20%.
 *
 * Single-source scans: Only applicable sub-scores are computed; weights are
 * redistributed proportionally among applicable scores (per Implementation-spec §6).
 * A sub-score is "not applicable" (stored as -1) when no data exists to measure it:
 *   - Token consistency: N/A when no tokens exist
 *   - Component coverage: N/A when no components exist
 *   - Naming alignment: N/A when no token names appear in ≥ 2 sources
 *   - Value parity: N/A when no cross-source token names exist
 */
import type { Token, Component, Finding } from '../types.js';
import type { HealthScore } from '../types.js';

interface SubScore {
  key: keyof Omit<HealthScore, 'composite'>;
  weight: number;
  value: number | null; // null = not applicable
}

export function computeHealthScore(
  tokens: Token[],
  components: Component[],
  findings: Finding[],
  duplicateTokenNames: string[],
  driftCandidates: Array<{ name: string; values: string[] }>
): HealthScore {
  const totalTokens = tokens.length;
  const totalComponents = components.length;
  const duplicateCount = duplicateTokenNames.length;
  const driftCount = driftCandidates.length;

  // ── Token consistency ──
  const tokenConsistency: number | null =
    totalTokens === 0
      ? null
      : Math.max(0, 100 - ((duplicateCount + driftCount) / totalTokens) * 100);

  // ── Component coverage ──
  const componentsInTwoPlus = components.filter((c) => c.coverage.length >= 2).length;
  const componentCoverage: number | null =
    totalComponents === 0
      ? null
      : (componentsInTwoPlus / totalComponents) * 100;

  // ── Naming alignment ──
  // Group tokens by name; count those whose sources span ≥ 2 distinct origins.
  const byName = new Map<string, Set<string>>();
  for (const t of tokens) {
    const sources = byName.get(t.name) ?? new Set<string>();
    sources.add(t.source);
    byName.set(t.name, sources);
  }
  const uniqueTokenNames = byName.size;
  let crossSourceNames = 0;
  for (const [, sources] of byName) {
    if (sources.size >= 2) crossSourceNames++;
  }
  // N/A when no token names appear in 2+ sources (single-source scan)
  const namingAlignment: number | null =
    crossSourceNames === 0
      ? null
      : (crossSourceNames / uniqueTokenNames) * 100;

  // ── Value parity ──
  let valueParity: number | null = null;
  if (crossSourceNames > 0) {
    const byNameTokens = new Map<string, Token[]>();
    for (const t of tokens) {
      const list = byNameTokens.get(t.name) ?? [];
      list.push(t);
      byNameTokens.set(t.name, list);
    }
    let matching = 0;
    for (const [name, sources] of byName) {
      if (sources.size < 2) continue;
      const list = byNameTokens.get(name) ?? [];
      const values = new Set(list.map((t) => t.value));
      if (values.size === 1) matching++;
    }
    valueParity = (matching / crossSourceNames) * 100;
  }

  // ── Composite: weighted average of applicable sub-scores only ──
  const subScores: SubScore[] = [
    { key: 'tokenConsistency', weight: 0.3, value: tokenConsistency },
    { key: 'componentCoverage', weight: 0.3, value: componentCoverage },
    { key: 'namingAlignment', weight: 0.2, value: namingAlignment },
    { key: 'valueParity', weight: 0.2, value: valueParity },
  ];

  const applicable = subScores.filter((s) => s.value !== null);
  let composite: number;

  if (applicable.length === 0) {
    composite = 100; // nothing to measure → no issues
  } else {
    const totalWeight = applicable.reduce((sum, s) => sum + s.weight, 0);
    composite = applicable.reduce(
      (sum, s) => sum + (s.value! / 100) * (s.weight / totalWeight) * 100,
      0
    );
  }

  // -1 signals "not applicable" to the UI (display as N/A, hide progress bar)
  return {
    composite: Math.round(composite),
    tokenConsistency: tokenConsistency != null ? Math.round(tokenConsistency) : -1,
    componentCoverage: componentCoverage != null ? Math.round(componentCoverage) : -1,
    namingAlignment: namingAlignment != null ? Math.round(namingAlignment) : -1,
    valueParity: valueParity != null ? Math.round(valueParity) : -1,
  };
}
