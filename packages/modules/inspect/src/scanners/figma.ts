/**
 * Figma scanner: Variables and file/components (styles, component metadata).
 * Sequential requests; exponential backoff on 429. Output Token[] and component names.
 */
import type { Token } from '../types.js';

const FIGMA_BASE = 'https://api.figma.com/v1';

function rgbaToHex(r: number, g: number, b: number, a?: number): string {
  const rr = Math.round(Math.max(0, Math.min(255, r))).toString(16).padStart(2, '0');
  const gg = Math.round(Math.max(0, Math.min(255, g))).toString(16).padStart(2, '0');
  const bb = Math.round(Math.max(0, Math.min(255, b))).toString(16).padStart(2, '0');
  if (a !== undefined && a < 1) {
    const aa = Math.round(Math.max(0, Math.min(255, a * 255))).toString(16).padStart(2, '0');
    return `#${rr}${gg}${bb}${aa}`;
  }
  return `#${rr}${gg}${bb}`;
}

function resolveFigmaValue(val: unknown, resolvedType: string): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return String(val);
  if (val && typeof val === 'object' && 'r' in (val as Record<string, unknown>)) {
    const c = val as { r: number; g: number; b: number; a?: number };
    return rgbaToHex(c.r * 255, c.g * 255, c.b * 255, c.a);
  }
  return JSON.stringify(val);
}

const FIGMA_TYPE_MAP: Record<string, string> = {
  COLOR: 'color',
  FLOAT: 'spacing',
  STRING: 'other',
  BOOLEAN: 'other',
};

function mapFigmaType(resolvedType: string): string {
  return FIGMA_TYPE_MAP[resolvedType] ?? 'other';
}

async function fetchWithBackoff(
  url: string,
  pat: string,
  retries = 5
): Promise<Response> {
  let delay = 1000;
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${pat}` },
    });
    if (res.status !== 429) return res;
    if (i === retries) return res;
    await new Promise((r) => setTimeout(r, delay + Math.random() * 500));
    delay = Math.min(delay * 2, 30000);
  }
  return new Response();
}

export interface FigmaScanResult {
  tokens: Token[];
  componentNames: string[];
}

export async function scanFigma(
  fileKeys: string[],
  pat: string,
  _abort?: AbortSignal
): Promise<FigmaScanResult> {
  const tokens: Token[] = [];
  const componentNames = new Set<string>();

  for (const fileKey of fileKeys) {
    const varUrl = `${FIGMA_BASE}/files/${fileKey}/variables/local`;
    const varRes = await fetchWithBackoff(varUrl, pat);
    if (varRes.ok) {
      const data = (await varRes.json()) as {
        meta?: { variableCollections?: Record<string, { name: string }> };
        variableCollections?: Record<string, { name: string; key: string }>;
        variables?: Record<
          string,
          {
            name: string;
            key: string;
            resolvedType: string;
            valuesByMode: Record<string, unknown>;
            variableCollectionId?: string;
          }
        >;
      };
      const collections = data.meta?.variableCollections ?? data.variableCollections ?? {};
      const vars = data.variables ?? {};
      for (const [id, v] of Object.entries(vars)) {
        const collection = v.variableCollectionId ? collections[v.variableCollectionId] : null;
        const collectionName = collection?.name ?? 'default';
        const canonicalName = `${collectionName}.${v.name}`.replace(/\//g, '.');
        const modes = v.valuesByMode ?? {};
        const firstMode = Object.keys(modes)[0];
        const rawVal = firstMode ? modes[firstMode] : undefined;
        const value = resolveFigmaValue(rawVal, v.resolvedType);
        tokens.push({
          name: canonicalName,
          type: mapFigmaType(v.resolvedType),
          value,
          source: 'figma',
          collection: collectionName,
          modes: Object.fromEntries(
            Object.entries(modes).map(([k, val]) => [k, resolveFigmaValue(val, v.resolvedType)])
          ),
        });
      }
    }

    const fileUrl = `${FIGMA_BASE}/files/${fileKey}`;
    const fileRes = await fetchWithBackoff(fileUrl, pat);
    if (fileRes.ok) {
      const fileData = (await fileRes.json()) as {
        document?: { children?: Array<{ type: string; name: string; children?: Array<{ type: string; name: string }> }> };
        components?: Record<string, { name: string; key: string }>;
      };
      const comps = fileData.components ?? {};
      for (const comp of Object.values(comps)) {
        componentNames.add(comp.name);
      }
      function walkNodes(nodes: Array<{ type?: string; name?: string; children?: unknown[] }> | undefined): void {
        if (!nodes) return;
        for (const node of nodes) {
          if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
            if (node.name) componentNames.add(node.name);
          }
          walkNodes(node.children as Array<{ type?: string; name?: string; children?: unknown[] }> | undefined);
        }
      }
      walkNodes(fileData.document?.children);
    }
  }

  return {
    tokens,
    componentNames: Array.from(componentNames),
  };
}
