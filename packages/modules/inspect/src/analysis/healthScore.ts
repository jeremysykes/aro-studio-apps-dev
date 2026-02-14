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
 *
 * DETERMINISM GUARANTEE:
 *   computeHealthScore is a pure function with no external state, no async, no randomness,
 *   no Date.now(), and no reliance on object key iteration order.
 *   All floating-point sub-scores are rounded to integers BEFORE the composite calculation.
 *   The composite uses integer-scaled arithmetic (weights as basis points) with a single
 *   final division and round, eliminating floating-point accumulation drift.
 *   Same inputs → bit-for-bit identical output.
 */
import type { Token, Component, Finding } from '../types.js';
import type { HealthScore } from '../types.js';

// ── Deterministic input type for pure scoring function ──────────────────────
export interface HealthMetrics {
  totalTokens: number;
  totalComponents: number;
  duplicateCount: number;
  driftCount: number;
  componentsInTwoPlus: number;
  uniqueTokenNames: number;
  crossSourceNames: number;
  crossSourceMatching: number;
}

interface SubScore {
  key: keyof Omit<HealthScore, 'composite'>;
  /** Weight as basis points (30% = 3000, 20% = 2000). Integer arithmetic only. */
  weightBp: number;
  value: number | null; // null = not applicable
}

/**
 * Round a float to the nearest integer using banker's-safe Math.round.
 * Normalises -0 to 0 for strict equality.
 */
function safeRound(n: number): number {
  const r = Math.round(n);
  return r === 0 ? 0 : r; // normalise -0
}

/**
 * Pure deterministic scoring function.
 * No DB access. No async. No external state. No randomness. No Date.now().
 * No reliance on object key iteration order.
 *
 * Same input → bit-for-bit identical output.
 */
export function computeHealthScorePure(metrics: HealthMetrics): HealthScore {
  const {
    totalTokens,
    totalComponents,
    duplicateCount,
    driftCount,
    componentsInTwoPlus,
    uniqueTokenNames,
    crossSourceNames,
    crossSourceMatching,
  } = metrics;

  // ── Sub-score calculations ──
  // Each sub-score is computed as a float, then immediately rounded to an integer.
  // This eliminates floating-point precision drift in the composite calculation.

  const tokenConsistencyRaw: number | null =
    totalTokens === 0
      ? null
      : Math.max(0, 100 - ((duplicateCount + driftCount) / totalTokens) * 100);

  const componentCoverageRaw: number | null =
    totalComponents === 0
      ? null
      : (componentsInTwoPlus / totalComponents) * 100;

  const namingAlignmentRaw: number | null =
    crossSourceNames === 0
      ? null
      : (crossSourceNames / uniqueTokenNames) * 100;

  const valueParityRaw: number | null =
    crossSourceNames === 0
      ? null
      : (crossSourceMatching / crossSourceNames) * 100;

  // Round sub-scores to integers immediately — all downstream math uses these integers.
  const tokenConsistency = tokenConsistencyRaw !== null ? safeRound(tokenConsistencyRaw) : null;
  const componentCoverage = componentCoverageRaw !== null ? safeRound(componentCoverageRaw) : null;
  const namingAlignment = namingAlignmentRaw !== null ? safeRound(namingAlignmentRaw) : null;
  const valueParity = valueParityRaw !== null ? safeRound(valueParityRaw) : null;

  // ── Composite: weighted average using integer-scaled arithmetic ──
  // Weights are expressed as basis points (1/10000) to avoid floating-point division
  // during accumulation. Only one division happens at the end.
  //
  // Formula: composite = Σ(score_i × weight_i_bp) / Σ(weight_i_bp)
  // where score_i ∈ {0..100} (integer) and weight_i_bp ∈ {2000, 3000} (integer)
  //
  // This guarantees:
  //   - The numerator is an exact integer (int × int = int, within safe integer range)
  //   - The denominator is an exact integer
  //   - Only ONE floating-point division occurs
  //   - The result is immediately rounded, so the single division cannot cause drift
  const subScores: SubScore[] = [
    { key: 'tokenConsistency', weightBp: 3000, value: tokenConsistency },
    { key: 'componentCoverage', weightBp: 3000, value: componentCoverage },
    { key: 'namingAlignment', weightBp: 2000, value: namingAlignment },
    { key: 'valueParity', weightBp: 2000, value: valueParity },
  ];

  const applicable = subScores.filter((s) => s.value !== null);
  let composite: number;

  if (applicable.length === 0) {
    composite = 100; // nothing to measure → no issues
  } else {
    // Integer accumulation: no floating-point drift possible here
    let numerator = 0;
    let denominator = 0;
    for (const s of applicable) {
      numerator += s.value! * s.weightBp;  // int × int → int (max: 100 × 10000 = 1,000,000)
      denominator += s.weightBp;            // int sum (max: 10,000)
    }
    // Single floating-point division, immediately rounded
    composite = safeRound(numerator / denominator);
  }

  // -1 signals "not applicable" to the UI (display as N/A, hide progress bar)
  return {
    composite,
    tokenConsistency: tokenConsistency ?? -1,
    componentCoverage: componentCoverage ?? -1,
    namingAlignment: namingAlignment ?? -1,
    valueParity: valueParity ?? -1,
  };
}

/**
 * Extract deterministic metrics from scan data.
 * This is the bridge between the scan pipeline (which produces arrays) and
 * the pure scoring function (which takes pre-computed counts).
 * Sorting is applied where iteration order could theoretically vary.
 */
export function extractHealthMetrics(
  tokens: Token[],
  components: Component[],
  duplicateTokenNames: string[],
  driftCandidates: Array<{ name: string; values: string[] }>
): HealthMetrics {
  const totalTokens = tokens.length;
  const totalComponents = components.length;
  const duplicateCount = duplicateTokenNames.length;
  const driftCount = driftCandidates.length;

  const componentsInTwoPlus = components.filter((c) => c.coverage.length >= 2).length;

  // Group tokens by name; count those whose sources span ≥ 2 distinct origins.
  // Uses sorted iteration to guarantee determinism regardless of Map ordering.
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

  // Value parity: of cross-source tokens, how many have identical values
  let crossSourceMatching = 0;
  if (crossSourceNames > 0) {
    const byNameTokens = new Map<string, Token[]>();
    for (const t of tokens) {
      const list = byNameTokens.get(t.name) ?? [];
      list.push(t);
      byNameTokens.set(t.name, list);
    }
    for (const [name, sources] of byName) {
      if (sources.size < 2) continue;
      const list = byNameTokens.get(name) ?? [];
      const values = new Set(list.map((t) => t.value));
      if (values.size === 1) crossSourceMatching++;
    }
  }

  return {
    totalTokens,
    totalComponents,
    duplicateCount,
    driftCount,
    componentsInTwoPlus,
    uniqueTokenNames,
    crossSourceNames,
    crossSourceMatching,
  };
}

/**
 * Convenience wrapper: compute health score from raw scan data.
 * Extracts metrics, then passes to the pure scoring function.
 *
 * This is the function callers should use. It maintains the same signature
 * as the original computeHealthScore for backward compatibility.
 */
export function computeHealthScore(
  tokens: Token[],
  components: Component[],
  _findings: Finding[],
  duplicateTokenNames: string[],
  driftCandidates: Array<{ name: string; values: string[] }>
): HealthScore {
  const metrics = extractHealthMetrics(tokens, components, duplicateTokenNames, driftCandidates);
  return computeHealthScorePure(metrics);
}
