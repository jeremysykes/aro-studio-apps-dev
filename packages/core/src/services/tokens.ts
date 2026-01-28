import type { TokenDiff } from '../types.js';

export function createTokensService(
  readText: (relPath: string) => string,
  writeText: (relPath: string, content: string) => void,
  tokensPath: string
) {
  return {
    loadTokens(): unknown {
      try {
        const raw = readText(tokensPath);
        return JSON.parse(raw) as unknown;
      } catch {
        return {};
      }
    },

    saveTokens(tokens: unknown): void {
      const json = JSON.stringify(tokens, null, 2);
      writeText(tokensPath, json);
    },

    diffTokens(a: unknown, b: unknown): TokenDiff {
      const added: string[] = [];
      const removed: string[] = [];
      const changed: string[] = [];

      const aKeys = objectKeys(a);
      const bKeys = objectKeys(b);

      for (const k of bKeys) {
        if (!(k in (a as object))) added.push(k);
        else if (!shallowEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
          changed.push(k);
      }
      for (const k of aKeys) {
        if (!(k in (b as object))) removed.push(k);
      }

      return { added, removed, changed };
    },
  };
}

function objectKeys(obj: unknown): string[] {
  if (obj === null || typeof obj !== 'object') return [];
  return Object.keys(obj);
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!(k in (b as object))) return false;
    if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]) return false;
  }
  return true;
}

export type TokensService = ReturnType<typeof createTokensService>;
