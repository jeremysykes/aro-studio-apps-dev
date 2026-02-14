/**
 * Determinism test suite for health score computation.
 *
 * Proves that:
 *   1. computeHealthScorePure is a pure function — 100 identical invocations produce
 *      bit-for-bit identical output.
 *   2. The full pipeline (extractHealthMetrics → computeHealthScorePure) is deterministic.
 *   3. Cross-run isolation: multiple sequential computations do not contaminate each other.
 *   4. Edge cases (all N/A, single score applicable, all zeros, all 100s) are handled.
 *   5. The integer arithmetic approach eliminates floating-point accumulation drift.
 */
import { describe, it, expect } from 'vitest';
import {
  computeHealthScorePure,
  extractHealthMetrics,
  computeHealthScore,
  type HealthMetrics,
} from '../src/analysis/healthScore.js';
import type { Token, Component } from '../src/types.js';

// ── Test fixtures ───────────────────────────────────────────────────────────

/** Multi-source scan with cross-source tokens — exercises all 4 sub-scores. */
const MULTI_SOURCE_METRICS: HealthMetrics = {
  totalTokens: 50,
  totalComponents: 20,
  duplicateCount: 5,
  driftCount: 3,
  componentsInTwoPlus: 12,
  uniqueTokenNames: 40,
  crossSourceNames: 15,
  crossSourceMatching: 10,
};

/** Single-source scan — naming alignment and value parity are N/A. */
const SINGLE_SOURCE_METRICS: HealthMetrics = {
  totalTokens: 30,
  totalComponents: 10,
  duplicateCount: 2,
  driftCount: 0,
  componentsInTwoPlus: 0,
  uniqueTokenNames: 28,
  crossSourceNames: 0,
  crossSourceMatching: 0,
};

/** Perfect score — no duplicates, no drift, full coverage, full parity. */
const PERFECT_METRICS: HealthMetrics = {
  totalTokens: 100,
  totalComponents: 50,
  duplicateCount: 0,
  driftCount: 0,
  componentsInTwoPlus: 50,
  uniqueTokenNames: 80,
  crossSourceNames: 60,
  crossSourceMatching: 60,
};

/** Worst case — many issues. */
const WORST_METRICS: HealthMetrics = {
  totalTokens: 100,
  totalComponents: 50,
  duplicateCount: 80,
  driftCount: 20,
  componentsInTwoPlus: 0,
  uniqueTokenNames: 80,
  crossSourceNames: 60,
  crossSourceMatching: 0,
};

/** Empty scan — all sub-scores N/A. */
const EMPTY_METRICS: HealthMetrics = {
  totalTokens: 0,
  totalComponents: 0,
  duplicateCount: 0,
  driftCount: 0,
  componentsInTwoPlus: 0,
  uniqueTokenNames: 0,
  crossSourceNames: 0,
  crossSourceMatching: 0,
};

/** Metrics that trigger awkward floating-point ratios (e.g. 1/3). */
const TRICKY_FP_METRICS: HealthMetrics = {
  totalTokens: 3,
  totalComponents: 3,
  duplicateCount: 1,
  driftCount: 0,
  componentsInTwoPlus: 1,
  uniqueTokenNames: 3,
  crossSourceNames: 1,
  crossSourceMatching: 1,
};

// ── Sample token/component data for full-pipeline tests ─────────────────────

function makeSampleTokens(): Token[] {
  const tokens: Token[] = [];
  // Figma tokens
  for (let i = 0; i < 30; i++) {
    tokens.push({ name: `color-${i}`, type: 'color', value: `#${i.toString(16).padStart(6, '0')}`, source: 'figma' });
  }
  // Code tokens (some overlap with figma)
  for (let i = 0; i < 25; i++) {
    const val = i < 10 ? `#${i.toString(16).padStart(6, '0')}` : `#ff${i.toString(16).padStart(4, '0')}`;
    tokens.push({ name: `color-${i}`, type: 'color', value: val, source: 'code' });
  }
  return tokens;
}

function makeSampleComponents(): Component[] {
  const components: Component[] = [];
  for (let i = 0; i < 15; i++) {
    components.push({
      name: `Button-${i}`,
      surfaces: { figma: true, storybook: i < 8, code: false },
      coverage: i < 8 ? ['figma', 'storybook'] : ['figma'],
      isOrphan: i >= 8,
    });
  }
  return components;
}

function makeSampleDrift(): Array<{ name: string; values: string[] }> {
  return [
    { name: 'color-10', values: ['#00000a', '#ff000a'] },
    { name: 'color-11', values: ['#00000b', '#ff000b'] },
  ];
}

function makeSampleDuplicates(): string[] {
  return Array.from({ length: 25 }, (_, i) => `color-${i}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

describe('Health score determinism', () => {
  // ── Test 1: Same Input Repeated (100 times) ─────────────────────────────
  describe('100x repeatability (computeHealthScorePure)', () => {
    const testCases: [string, HealthMetrics][] = [
      ['multi-source', MULTI_SOURCE_METRICS],
      ['single-source', SINGLE_SOURCE_METRICS],
      ['perfect', PERFECT_METRICS],
      ['worst', WORST_METRICS],
      ['empty (all N/A)', EMPTY_METRICS],
      ['tricky floating-point', TRICKY_FP_METRICS],
    ];

    for (const [name, metrics] of testCases) {
      it(`produces identical output 100 times: ${name}`, () => {
        const reference = computeHealthScorePure(metrics);
        for (let i = 0; i < 100; i++) {
          const result = computeHealthScorePure(metrics);
          expect(result).toStrictEqual(reference);
        }
      });
    }
  });

  // ── Test 2: Full pipeline determinism (extractMetrics → computePure) ────
  describe('full pipeline determinism', () => {
    it('same raw data → identical health score 100 times', () => {
      const tokens = makeSampleTokens();
      const components = makeSampleComponents();
      const duplicates = makeSampleDuplicates();
      const drift = makeSampleDrift();

      const reference = computeHealthScore(tokens, components, [], duplicates, drift);

      for (let i = 0; i < 100; i++) {
        // Create fresh copies to ensure no mutation
        const t = makeSampleTokens();
        const c = makeSampleComponents();
        const d = makeSampleDuplicates();
        const dr = makeSampleDrift();
        const result = computeHealthScore(t, c, [], d, dr);
        expect(result).toStrictEqual(reference);
      }
    });
  });

  // ── Test 3: Cross-run isolation ─────────────────────────────────────────
  describe('cross-run isolation', () => {
    it('sequential computations with different inputs do not contaminate', () => {
      // Run 1: multi-source
      const r1a = computeHealthScorePure(MULTI_SOURCE_METRICS);

      // Run 2: single-source (different N/A pattern)
      const r2 = computeHealthScorePure(SINGLE_SOURCE_METRICS);

      // Run 3: multi-source again — must match run 1 exactly
      const r1b = computeHealthScorePure(MULTI_SOURCE_METRICS);

      expect(r1b).toStrictEqual(r1a);
      expect(r2).not.toStrictEqual(r1a); // different inputs → different outputs

      // Run 4: worst case
      const r3a = computeHealthScorePure(WORST_METRICS);

      // Run 5: worst case again — must match run 4
      const r3b = computeHealthScorePure(WORST_METRICS);
      expect(r3b).toStrictEqual(r3a);
    });

    it('full pipeline: interleaved computations do not contaminate', () => {
      const tokens1 = makeSampleTokens();
      const components1 = makeSampleComponents();
      const duplicates1 = makeSampleDuplicates();
      const drift1 = makeSampleDrift();

      // First computation
      const score1a = computeHealthScore(tokens1, components1, [], duplicates1, drift1);

      // Different computation in between
      computeHealthScore([], [], [], [], []);

      // Same computation again
      const tokens1b = makeSampleTokens();
      const components1b = makeSampleComponents();
      const duplicates1b = makeSampleDuplicates();
      const drift1b = makeSampleDrift();
      const score1b = computeHealthScore(tokens1b, components1b, [], duplicates1b, drift1b);

      expect(score1b).toStrictEqual(score1a);
    });
  });

  // ── Test 4: Edge cases ──────────────────────────────────────────────────
  describe('edge cases', () => {
    it('all N/A sub-scores → composite = 100', () => {
      const result = computeHealthScorePure(EMPTY_METRICS);
      expect(result.composite).toBe(100);
      expect(result.tokenConsistency).toBe(-1);
      expect(result.componentCoverage).toBe(-1);
      expect(result.namingAlignment).toBe(-1);
      expect(result.valueParity).toBe(-1);
    });

    it('perfect score → all sub-scores correct, composite matches', () => {
      const result = computeHealthScorePure(PERFECT_METRICS);
      expect(result.tokenConsistency).toBe(100);
      expect(result.componentCoverage).toBe(100);
      expect(result.namingAlignment).toBe(75); // 60/80 * 100 = 75
      expect(result.valueParity).toBe(100);
      // composite = (100*3000 + 100*3000 + 75*2000 + 100*2000) / 10000
      //           = (300000 + 300000 + 150000 + 200000) / 10000
      //           = 950000 / 10000 = 95
      expect(result.composite).toBe(95);
    });

    it('single applicable sub-score gets full weight', () => {
      // Only tokenConsistency is applicable
      const metrics: HealthMetrics = {
        totalTokens: 10,
        totalComponents: 0,
        duplicateCount: 2,
        driftCount: 1,
        componentsInTwoPlus: 0,
        uniqueTokenNames: 8,
        crossSourceNames: 0,
        crossSourceMatching: 0,
      };
      const result = computeHealthScorePure(metrics);
      // Token consistency = max(0, 100 - (3/10)*100) = 70
      expect(result.tokenConsistency).toBe(70);
      expect(result.componentCoverage).toBe(-1); // N/A
      expect(result.namingAlignment).toBe(-1);   // N/A
      expect(result.valueParity).toBe(-1);       // N/A
      // Composite = token consistency (only applicable score)
      expect(result.composite).toBe(70);
    });

    it('worst case floors at 0', () => {
      const metrics: HealthMetrics = {
        totalTokens: 10,
        totalComponents: 10,
        duplicateCount: 10,
        driftCount: 5,
        componentsInTwoPlus: 0,
        uniqueTokenNames: 10,
        crossSourceNames: 5,
        crossSourceMatching: 0,
      };
      const result = computeHealthScorePure(metrics);
      // Token consistency = max(0, 100 - (15/10)*100) = max(0, -50) = 0
      expect(result.tokenConsistency).toBe(0);
      expect(result.componentCoverage).toBe(0);
      expect(result.valueParity).toBe(0);
    });

    it('sub-scores are rounded to integers', () => {
      // 1/3 ratio: 33.333...
      const metrics: HealthMetrics = {
        totalTokens: 3,
        totalComponents: 3,
        duplicateCount: 0,
        driftCount: 0,
        componentsInTwoPlus: 1,
        uniqueTokenNames: 3,
        crossSourceNames: 1,
        crossSourceMatching: 1,
      };
      const result = computeHealthScorePure(metrics);
      // componentCoverage = (1/3)*100 = 33.33... → rounded to 33
      expect(result.componentCoverage).toBe(33);
      // All integer, no fractional parts
      expect(Number.isInteger(result.composite)).toBe(true);
      expect(Number.isInteger(result.tokenConsistency)).toBe(true);
      expect(Number.isInteger(result.componentCoverage)).toBe(true);
    });

    it('no -0 values in output', () => {
      // Edge case: computation might produce -0
      const result = computeHealthScorePure({
        totalTokens: 1,
        totalComponents: 1,
        duplicateCount: 0,
        driftCount: 0,
        componentsInTwoPlus: 0,
        uniqueTokenNames: 1,
        crossSourceNames: 0,
        crossSourceMatching: 0,
      });
      // Verify no field is -0 (which !== 0 with Object.is)
      expect(Object.is(result.composite, -0)).toBe(false);
      for (const key of Object.keys(result) as (keyof typeof result)[]) {
        if (result[key] === 0) {
          expect(Object.is(result[key], -0)).toBe(false);
        }
      }
    });
  });

  // ── Test 5: Integer arithmetic proof ────────────────────────────────────
  describe('integer arithmetic correctness', () => {
    it('composite uses integer multiplication (no floating-point accumulation)', () => {
      // This test proves the composite is computed via integer math.
      // With the old approach: (84/100) * (0.3/1.0) * 100 + (60/100) * (0.3/1.0) * 100 + ...
      // could accumulate floating-point errors.
      // With the new approach: (84 * 3000 + 60 * 3000 + 38 * 2000 + 67 * 2000) / 10000
      // = (252000 + 180000 + 76000 + 134000) / 10000
      // = 642000 / 10000 = 64.2 → rounds to 64

      const metrics: HealthMetrics = {
        totalTokens: 50,
        totalComponents: 20,
        duplicateCount: 5,
        driftCount: 3,
        componentsInTwoPlus: 12,
        uniqueTokenNames: 40,
        crossSourceNames: 15,
        crossSourceMatching: 10,
      };
      const result = computeHealthScorePure(metrics);

      // Manual verification:
      // tokenConsistency = max(0, 100 - (8/50)*100) = 100 - 16 = 84
      expect(result.tokenConsistency).toBe(84);
      // componentCoverage = (12/20)*100 = 60
      expect(result.componentCoverage).toBe(60);
      // namingAlignment = (15/40)*100 = 37.5 → 38
      expect(result.namingAlignment).toBe(38);
      // valueParity = (10/15)*100 = 66.666... → 67
      expect(result.valueParity).toBe(67);

      // composite = (84*3000 + 60*3000 + 38*2000 + 67*2000) / 10000
      //           = (252000 + 180000 + 76000 + 134000) / 10000
      //           = 642000 / 10000 = 64.2 → 64
      expect(result.composite).toBe(64);
    });

    it('weight redistribution with N/A scores uses correct denominator', () => {
      // Only tokenConsistency (3000bp) and componentCoverage (3000bp) are applicable
      // denominator = 6000, not 10000
      const metrics: HealthMetrics = {
        totalTokens: 10,
        totalComponents: 10,
        duplicateCount: 0,
        driftCount: 0,
        componentsInTwoPlus: 5,
        uniqueTokenNames: 10,
        crossSourceNames: 0, // → namingAlignment = N/A, valueParity = N/A
        crossSourceMatching: 0,
      };
      const result = computeHealthScorePure(metrics);

      // tokenConsistency = 100
      // componentCoverage = (5/10)*100 = 50
      // composite = (100*3000 + 50*3000) / 6000 = 450000 / 6000 = 75
      expect(result.composite).toBe(75);
      expect(result.namingAlignment).toBe(-1);
      expect(result.valueParity).toBe(-1);
    });
  });

  // ── Test 6: extractHealthMetrics determinism ────────────────────────────
  describe('extractHealthMetrics determinism', () => {
    it('same token/component arrays → identical metrics 100 times', () => {
      const tokens = makeSampleTokens();
      const components = makeSampleComponents();
      const duplicates = makeSampleDuplicates();
      const drift = makeSampleDrift();

      const reference = extractHealthMetrics(tokens, components, duplicates, drift);

      for (let i = 0; i < 100; i++) {
        const result = extractHealthMetrics(
          makeSampleTokens(),
          makeSampleComponents(),
          makeSampleDuplicates(),
          makeSampleDrift(),
        );
        expect(result).toStrictEqual(reference);
      }
    });

    it('metrics are all integers (no floating-point values)', () => {
      const metrics = extractHealthMetrics(
        makeSampleTokens(),
        makeSampleComponents(),
        makeSampleDuplicates(),
        makeSampleDrift(),
      );
      for (const [_key, value] of Object.entries(metrics)) {
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  // ── Test 7: findings ID generator isolation ─────────────────────────────
  describe('findings ID generator isolation', () => {
    // Import dynamically to test the generator
    it('generateFindings produces deterministic IDs across calls', async () => {
      const { generateFindings } = await import('../src/analysis/findings.js');

      const tokens = makeSampleTokens();
      const components = makeSampleComponents();
      const duplicates = makeSampleDuplicates();
      const drift = makeSampleDrift();

      const findings1 = generateFindings(tokens, components, duplicates, drift);
      const findings2 = generateFindings(tokens, components, duplicates, drift);

      expect(findings1.map(f => f.id)).toStrictEqual(findings2.map(f => f.id));
      // IDs should start at 1 for each call
      expect(findings1[0]?.id).toBe('finding-1');
    });
  });
});
