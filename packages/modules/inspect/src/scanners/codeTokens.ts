/**
 * Code token scanner: DTCG v1 and Style Dictionary.
 * All reads via workspace.readText. Output normalized Token[].
 */
import type { Token } from '../types.js';
import type { WorkspaceFacet } from '../types.js';

const CANONICAL_TYPES = new Set([
  'color',
  'spacing',
  'typography',
  'borderRadius',
  'shadow',
  'motion',
  'opacity',
  'other',
]);

function mapToCanonicalType(t: string): string {
  const lower = t.toLowerCase();
  if (CANONICAL_TYPES.has(lower)) return lower;
  if (lower.includes('color')) return 'color';
  if (lower.includes('space') || lower.includes('dimension')) return 'spacing';
  if (lower.includes('font') || lower.includes('typography')) return 'typography';
  if (lower.includes('radius') || lower.includes('border')) return 'borderRadius';
  if (lower.includes('shadow')) return 'shadow';
  if (lower.includes('motion') || lower.includes('duration')) return 'motion';
  if (lower.includes('opacity')) return 'opacity';
  return 'other';
}

function normalizeName(parts: string[]): string {
  return parts.filter(Boolean).join('.');
}

/** DTCG v1: $type, $value, group hierarchy → canonical name */
function walkDtcg(obj: unknown, path: string[], out: Token[], filePath: string): void {
  if (obj === null || typeof obj !== 'object') return;
  const o = obj as Record<string, unknown>;
  if ('$value' in o && o.$value !== undefined) {
    const name = normalizeName(path);
    const type = typeof o.$type === 'string' ? mapToCanonicalType(o.$type) : 'other';
    const value = typeof o.$value === 'string' ? o.$value : JSON.stringify(o.$value);
    out.push({
      name,
      type,
      value,
      source: 'code-dtcg',
      filePath,
      description: typeof o.$description === 'string' ? o.$description : undefined,
    });
    return;
  }
  for (const [k, v] of Object.entries(o)) {
    if (k.startsWith('$')) continue;
    walkDtcg(v, [...path, k], out, filePath);
  }
}

function parseDtcg(content: string, filePath: string): Token[] {
  const out: Token[] = [];
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return out;
  }
  if (data !== null && typeof data === 'object' && '$type' in (data as object)) {
    walkDtcg(data, [], out, filePath);
  } else if (data !== null && typeof data === 'object') {
    walkDtcg(data, [], out, filePath);
  }
  return out;
}

/** Style Dictionary–style: nested objects, leaf values */
function walkStyleDictionary(obj: unknown, path: string[], out: Token[], filePath: string): void {
  if (obj === null || typeof obj !== 'object') return;
  const o = obj as Record<string, unknown>;
  const keys = Object.keys(o).filter((k) => !k.startsWith('$'));
  const hasValue = 'value' in o || 'value' in (o as { value?: unknown });
  const value = (o as { value?: unknown }).value;
  if (hasValue && value !== undefined && typeof value === 'string') {
    const name = normalizeName(path);
    const type = 'type' in o && typeof o.type === 'string' ? mapToCanonicalType(o.type) : 'other';
    out.push({
      name,
      type,
      value,
      source: 'code-style-dictionary',
      filePath,
    });
    return;
  }
  for (const k of keys) {
    walkStyleDictionary(o[k], [...path, k], out, filePath);
  }
}

function parseStyleDictionary(content: string, filePath: string): Token[] {
  const out: Token[] = [];
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return out;
  }
  walkStyleDictionary(data, [], out, filePath);
  return out;
}

/** Recursively check if any nested object has DTCG $value or $type. */
function hasDtcgStructure(obj: unknown): boolean {
  if (obj === null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if ('$value' in o && o.$value !== undefined) return true;
  if ('$type' in o && typeof o.$type === 'string') return true;
  for (const v of Object.values(o)) {
    if (hasDtcgStructure(v)) return true;
  }
  return false;
}

function isDtcg(content: string): boolean {
  try {
    const data = JSON.parse(content);
    return hasDtcgStructure(data);
  } catch {
    return false;
  }
}

export function scanCodeTokens(
  workspace: WorkspaceFacet,
  paths: string[],
  format?: 'dtcg' | 'style-dictionary' | 'tokens-studio'
): Token[] {
  const all: Token[] = [];
  for (const relPath of paths) {
    if (!workspace.exists(relPath)) continue;
    let content: string;
    try {
      content = workspace.readText(relPath);
    } catch {
      continue;
    }
    const resolved = workspace.resolve(relPath);
    const filePath = relPath;
    if (format === 'style-dictionary') {
      all.push(...parseStyleDictionary(content, filePath));
    } else if (format === 'tokens-studio') {
      // P0: treat as style-dictionary-like; P1 has full Tokens Studio parser
      all.push(...parseStyleDictionary(content, filePath));
    } else {
      if (isDtcg(content)) {
        all.push(...parseDtcg(content, filePath));
      } else {
        all.push(...parseStyleDictionary(content, filePath));
      }
    }
  }
  return all;
}

const INLINE_FILE_PATH = '(inline)';

/** Parse token content from a string (DTCG or Style Dictionary). Use for inline pasted JSON. */
export function parseTokensFromContent(
  content: string,
  format?: 'dtcg' | 'style-dictionary' | 'tokens-studio'
): Token[] {
  const filePath = INLINE_FILE_PATH;
  if (format === 'style-dictionary') {
    return parseStyleDictionary(content, filePath);
  }
  if (format === 'tokens-studio') {
    return parseStyleDictionary(content, filePath);
  }
  if (isDtcg(content)) {
    return parseDtcg(content, filePath);
  }
  return parseStyleDictionary(content, filePath);
}
