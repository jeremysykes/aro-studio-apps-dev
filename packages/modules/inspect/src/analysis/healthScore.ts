/**
 * Health score: sub-scores (0–100) and weighted composite.
 * Weights: Token consistency 30%, Component coverage 30%, Naming alignment 20%, Value parity 20%.
 */
import type { Token, Component, Finding } from '../types.js';
import type { HealthScore } from '../types.js';

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
  const tokenConsistency =
    totalTokens === 0 ? 100 : Math.max(0, 100 - ((duplicateCount + driftCount) / totalTokens) * 100);

  const componentsInTwoPlus = components.filter((c) => c.coverage.length >= 2).length;
  const componentCoverage =
    totalComponents === 0 ? 100 : (componentsInTwoPlus / totalComponents) * 100;

  // Naming alignment: proportion of unique token names that appear in 2+ sources.
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
  const namingAlignment = uniqueTokenNames === 0 ? 100 : (crossSourceNames / uniqueTokenNames) * 100;

  // Value parity: of the cross-source names, how many have identical values?
  let valueParity = 100;
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

  const composite =
    tokenConsistency * 0.3 +
    componentCoverage * 0.3 +
    namingAlignment * 0.2 +
    valueParity * 0.2;

  return {
    composite: Math.round(composite),
    tokenConsistency: Math.round(tokenConsistency),
    componentCoverage: Math.round(componentCoverage),
    namingAlignment: Math.round(namingAlignment),
    valueParity: Math.round(valueParity),
  };
}
