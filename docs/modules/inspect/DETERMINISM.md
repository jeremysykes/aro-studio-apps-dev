# Health Score Determinism Guarantee

This document explains why the health score computation is guaranteed to be deterministic, what the original root cause of non-determinism was, and how the architecture prevents drift.

## Statement

**Given identical input data and a clean database, the health score is mathematically guaranteed to be identical across runs.**

---

## Original Root Cause

The health score composite was computed via floating-point accumulation in a `reduce()`:

```typescript
// BEFORE (non-deterministic)
composite = applicable.reduce(
  (sum, s) => sum + (s.value! / 100) * (s.weight / totalWeight) * 100,
  0
);
```

Each iteration performed 3 floating-point operations per term:
1. `s.value! / 100` — division
2. `(result) * (s.weight / totalWeight)` — multiplication with normalized weight
3. `(result) * 100` — scale back

The `s.weight / totalWeight` normalization was the critical failure point. When N/A scores triggered weight redistribution, `totalWeight` changed (e.g., from `1.0` to `0.6`), producing ratios like `0.3 / 0.6 = 0.49999999999999994` instead of `0.5`. Combined with the accumulation in `reduce()`, this could shift the final value across the `Math.round` boundary — e.g., `72.4999...` rounding to 72 in one run and `72.5000...` rounding to 73 in another.

The root cause was **floating-point precision loss amplified by weight redistribution and accumulation**.

---

## New Architecture

### 1. Pure Scoring Function

`computeHealthScorePure(metrics: HealthMetrics): HealthScore`

Guarantees:
- **No DB access** — takes pre-computed integer counts, not database rows
- **No async** — synchronous, single-threaded execution
- **No external state** — no globals, no closures over mutable state
- **No randomness** — no `Math.random()`, no `Date.now()`
- **No object key iteration** — input is a flat struct with named fields

### 2. Integer-Scaled Arithmetic

Sub-scores are rounded to integers **before** the composite calculation:

```typescript
// Sub-scores: float → immediate round to integer
const tokenConsistency = safeRound(rawFloat);  // e.g., 84
```

The composite uses **basis-point weights** (integers):

```typescript
// Weights as basis points: 30% = 3000, 20% = 2000
// Numerator and denominator are exact integers
let numerator = 0;
let denominator = 0;
for (const s of applicable) {
  numerator += s.value! * s.weightBp;  // int × int = int
  denominator += s.weightBp;            // int + int = int
}
composite = safeRound(numerator / denominator);  // ONE division, ONE round
```

This eliminates floating-point accumulation entirely:
- `numerator` is an exact integer (max: 100 × 10000 = 1,000,000 — well within safe integer range)
- `denominator` is an exact integer (max: 10,000)
- Only **one** floating-point division occurs (the final `numerator / denominator`)
- The result is immediately rounded, so a single division cannot cause drift

### 3. Weight Redistribution

When sub-scores are N/A, the denominator naturally excludes their weights:

| Scenario | Applicable weights | Denominator |
|----------|--------------------|-------------|
| All 4 scores | 3000 + 3000 + 2000 + 2000 | 10000 |
| 3 scores (1 N/A) | e.g., 3000 + 2000 + 2000 | 7000 |
| 2 scores | e.g., 3000 + 3000 | 6000 |
| 1 score | e.g., 3000 | 3000 |
| 0 scores | (default to 100) | N/A |

No normalization division is needed — the integer sum in the denominator handles redistribution exactly.

### 4. Rounding Strategy

- **Sub-scores**: Each raw float is immediately rounded to the nearest integer via `Math.round()`.
  A `safeRound()` wrapper normalizes `-0` to `0` for strict equality.
- **Composite**: Single `safeRound(numerator / denominator)` — only one floating-point operation.

### 5. Database Reset

`pnpm reset-db` provides a clean baseline:
- Deletes all rows from `runs`, `logs`, `artifacts`
- Resets SQLite auto-increment counters
- Removes artifact files from disk
- Idempotent, scripted, dev-only

### 6. Run Isolation

Each scan creates a fresh run with a UUID. All data is scoped:
- Artifacts: `WHERE run_id = ?`
- Logs: `WHERE run_id = ?`
- Report: stored as `report.json` artifact under the run's ID
- No global aggregation, no cross-run joins, no cached results

---

## Determinism Checklist

| Concern | Status | Evidence |
|---------|--------|----------|
| No cross-run contamination | ✅ | All queries filter by `run_id`; no global aggregation |
| No floating-point precision drift | ✅ | Integer-scaled composite; sub-scores rounded before aggregation |
| No async race conditions | ✅ | `computeHealthScorePure` is synchronous with no external state |
| No mutation of historical data | ✅ | Each scan produces a fresh report; old runs are never modified |
| No implicit aggregation | ✅ | Health score computed from single-run data only |
| No reliance on iteration order | ✅ | Input is a flat integer struct; no Map/Set iteration in scoring |
| No randomness in computation | ✅ | No `Math.random()`, no `Date.now()` in scoring function |
| No -0 / NaN in output | ✅ | `safeRound()` normalizes; null → -1 conversion prevents NaN |

---

## Test Coverage

The determinism test suite (`packages/modules/inspect/tests/determinism.test.ts`) covers:

1. **100x repeatability** — Each metric fixture run 100 times; strict equality asserted
2. **Full pipeline determinism** — Raw tokens/components → extractMetrics → computePure, 100 iterations
3. **Cross-run isolation** — Interleaved computations with different inputs don't contaminate
4. **Edge cases** — All N/A, single applicable score, perfect score, worst case, -0 normalization
5. **Integer arithmetic proof** — Manual verification of numerator/denominator math
6. **Weight redistribution** — N/A scores correctly excluded from denominator
7. **Finding ID isolation** — `generateFindings` produces deterministic IDs across calls
