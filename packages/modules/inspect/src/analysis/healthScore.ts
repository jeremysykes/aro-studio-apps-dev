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

  const crossSourceTokens = new Set<string>();
  const byName = new Map<string, Token[]>();
  for (const t of tokens) {
    const list = byName.get(t.name) ?? [];
    list.push(t);
    byName.set(t.name, list);
  }
  for (const [, list] of byName) {
    if (list.length >= 2 && new Set(list.map((t) => t.source)).size >= 2) {
      list.forEach((t) => crossSourceTokens.add(t.name));
    }
  }
  const matchedTokens = crossSourceTokens.size;
  const totalPairs = byName.size;
  const namingAlignment = totalPairs === 0 ? 100 : (matchedTokens / totalPairs) * 100;

  let valueParity = 100;
  if (crossSourceTokens.size > 0) {
    let matching = 0;
    for (const name of crossSourceTokens) {
      const list = byName.get(name) ?? [];
      const values = new Set(list.map((t) => t.value));
      if (values.size === 1) matching++;
    }
    valueParity = (matching / crossSourceTokens.size) * 100;
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
