/**
 * Generate Finding[] from cross-reference results.
 * Severity: token-drift → critical; token-duplicate, token-dead, token-naming, component-orphan → warning; component-parity → info.
 */
import type { Finding, FindingSeverity, Token, Component } from '../types.js';

let findingId = 0;
function nextId(): string {
  return `finding-${++findingId}`;
}

export function generateFindings(
  tokens: Token[],
  components: Component[],
  duplicateTokenNames: string[],
  driftCandidates: Array<{ name: string; values: string[] }>
): Finding[] {
  const findings: Finding[] = [];

  for (const { name, values } of driftCandidates) {
    findings.push({
      id: nextId(),
      severity: 'critical',
      category: 'token-drift',
      title: `Token value drift: ${name}`,
      details: `Different values across sources: ${values.join(', ')}`,
      affectedTokens: [name],
      sources: [],
    });
  }

  for (const name of duplicateTokenNames) {
    if (!driftCandidates.some((d) => d.name === name)) {
      findings.push({
        id: nextId(),
        severity: 'warning',
        category: 'token-duplicate',
        title: `Duplicate token: ${name}`,
        details: 'Same token name in multiple sources.',
        affectedTokens: [name],
        sources: [],
      });
    }
  }

  for (const c of components) {
    if (c.isOrphan) {
      findings.push({
        id: nextId(),
        severity: 'warning',
        category: 'component-orphan',
        title: `Orphan component: ${c.name}`,
        details: `Present in only ${c.coverage.length} surface(s).`,
        affectedComponents: [c.name],
        sources: [],
      });
    }
  }

  return findings;
}

export function findingsBySeverity(findings: Finding[]): Record<FindingSeverity, number> {
  const out: Record<FindingSeverity, number> = { critical: 0, warning: 0, info: 0 };
  for (const f of findings) {
    out[f.severity]++;
  }
  return out;
}
