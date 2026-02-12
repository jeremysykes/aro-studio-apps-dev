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
      headers: { 'X-Figma-Token': pat },
    });
    if (res.status !== 429) return res;
    if (i === retries) return res;
    await new Promise((r) => setTimeout(r, delay + Math.random() * 500));
    delay = Math.min(delay * 2, 30000);
  }
  return new Response();
}

export type FigmaLogger = (level: string, message: string) => void;

export interface FigmaScanResult {
  tokens: Token[];
  componentNames: string[];
}

export async function scanFigma(
  fileKeys: string[],
  pat: string,
  _abort?: AbortSignal,
  logger?: FigmaLogger
): Promise<FigmaScanResult> {
  const log = logger ?? (() => {});
  const tokens: Token[] = [];
  const componentNames = new Set<string>();

  for (const fileKey of fileKeys) {
    log('info', `Scanning Figma file: ${fileKey}`);

    // --- Variables (tokens) ---
    const varUrl = `${FIGMA_BASE}/files/${fileKey}/variables/local`;
    const varRes = await fetchWithBackoff(varUrl, pat);
    if (varRes.ok) {
      type VarRecord = Record<
        string,
        {
          name: string;
          key: string;
          resolvedType: string;
          valuesByMode: Record<string, unknown>;
          variableCollectionId?: string;
        }
      >;
      type CollRecord = Record<string, { name: string; key?: string }>;
      const data = (await varRes.json()) as {
        meta?: { variableCollections?: CollRecord; variables?: VarRecord };
        variableCollections?: CollRecord;
        variables?: VarRecord;
      };
      const collections = data.meta?.variableCollections ?? data.variableCollections ?? {};
      const vars = data.meta?.variables ?? data.variables ?? {};
      const varCount = Object.keys(vars).length;
      log('info', `Variables endpoint: ${varCount} variables found`);
      for (const [_id, v] of Object.entries(vars)) {
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
    } else {
      log('warning', `Variables endpoint returned ${varRes.status}: ${varRes.statusText}`);
    }

    // --- Published components (dedicated endpoint, not depth-limited) ---
    const pubCompUrl = `${FIGMA_BASE}/files/${fileKey}/components`;
    const pubCompRes = await fetchWithBackoff(pubCompUrl, pat);
    if (pubCompRes.ok) {
      const pubData = (await pubCompRes.json()) as {
        meta?: { components?: Array<{ name: string; key: string; containing_frame?: { name: string } }> };
      };
      const pubComps = pubData.meta?.components ?? [];
      log('info', `Published components endpoint: ${pubComps.length} components found`);
      for (const comp of pubComps) {
        if (comp.name) componentNames.add(comp.name);
      }
    } else {
      log('warning', `Published components endpoint returned ${pubCompRes.status}: ${pubCompRes.statusText}`);
    }

    // --- File document tree (components & component sets) ---
    // Use generous depth so deeply-nested components are captured by the tree walk.
    // Published components are already covered by the dedicated endpoint above.
    const fileUrl = `${FIGMA_BASE}/files/${fileKey}?depth=10`;
    const fileRes = await fetchWithBackoff(fileUrl, pat);
    if (fileRes.ok) {
      const fileData = (await fileRes.json()) as {
        document?: { children?: Array<{ type: string; name: string; children?: Array<{ type: string; name: string }> }> };
        components?: Record<string, { name: string; key: string }>;
        componentSets?: Record<string, { name: string; key: string }>;
      };
      const comps = fileData.components ?? {};
      const compsCount = Object.keys(comps).length;
      for (const comp of Object.values(comps)) {
        componentNames.add(comp.name);
      }
      const compSets = fileData.componentSets ?? {};
      const setsCount = Object.keys(compSets).length;
      for (const compSet of Object.values(compSets)) {
        componentNames.add(compSet.name);
      }
      log('info', `File endpoint: ${compsCount} components, ${setsCount} component sets in metadata`);
      function walkNodes(nodes: Array<{ type?: string; name?: string; children?: unknown[] }> | undefined): void {
        if (!nodes) return;
        for (const node of nodes) {
          if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
            if (node.name) componentNames.add(node.name);
          }
          if (Array.isArray(node.children)) {
            walkNodes(node.children as Array<{ type?: string; name?: string; children?: unknown[] }>);
          }
        }
      }
      walkNodes(fileData.document ? [fileData.document] : undefined);
      log('info', `Total unique component names after tree walk: ${componentNames.size}`);
    } else {
      log('warning', `File endpoint returned ${fileRes.status}: ${fileRes.statusText}`);
    }
  }

  log('info', `Figma scan complete: ${tokens.length} tokens, ${componentNames.size} components`);
  return {
    tokens,
    componentNames: Array.from(componentNames),
  };
}
