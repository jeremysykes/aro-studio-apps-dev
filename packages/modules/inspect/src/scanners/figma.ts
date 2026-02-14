/**
 * Figma scanner: Variables and file/components (styles, component metadata).
 * Sequential requests; exponential backoff on 429. Output Token[] and component names.
 */
import type { Token } from '../types.js';
import type { FigmaComponent } from '../types.js';

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

function resolveFigmaValue(val: unknown, _resolvedType: string): string {
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

/** Check abort signal and throw if aborted. */
function checkAbort(abort?: AbortSignal): void {
  if (abort?.aborted) {
    throw new DOMException('Figma scan aborted', 'AbortError');
  }
}

async function fetchWithBackoff(
  url: string,
  pat: string,
  retries = 5,
  abort?: AbortSignal
): Promise<Response> {
  let delay = 1000;
  for (let i = 0; i <= retries; i++) {
    checkAbort(abort);
    const res = await fetch(url, {
      headers: { 'X-Figma-Token': pat },
      signal: abort,
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
  componentNames: FigmaComponent[];
}

export async function scanFigma(
  fileKeys: string[],
  pat: string,
  abort?: AbortSignal,
  logger?: FigmaLogger
): Promise<FigmaScanResult> {
  const log = logger ?? (() => {});
  const tokens: Token[] = [];
  const componentMap = new Map<string, FigmaComponent>();

  /**
   * Register a component. For component-set children (variants) we record the
   * set name as `layerName` so the UI can display "Button, Primary" instead of
   * just "Primary". Standalone components (not inside a set) have no layerName.
   */
  function addComponent(name: string, layerName?: string): void {
    const key = layerName ? `${layerName}/${name}` : name;
    if (!componentMap.has(key)) {
      componentMap.set(key, { name, layerName });
    }
  }

  for (const fileKey of fileKeys) {
    checkAbort(abort);
    log('info', `Scanning Figma file: ${fileKey}`);

    // --- Variables (tokens) ---
    const varUrl = `${FIGMA_BASE}/files/${fileKey}/variables/local`;
    const varRes = await fetchWithBackoff(varUrl, pat, 5, abort);
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

    checkAbort(abort);

    // --- Published components (dedicated endpoint, not depth-limited) ---
    // Used as fallback; the tree walk below is the primary source since it
    // provides accurate parent–child (COMPONENT_SET → COMPONENT) relationships.
    const pubCompUrl = `${FIGMA_BASE}/files/${fileKey}/components`;
    const pubCompRes = await fetchWithBackoff(pubCompUrl, pat, 5, abort);
    let pubCompNames: Array<{ name: string; frame?: string }> = [];
    if (pubCompRes.ok) {
      const pubData = (await pubCompRes.json()) as {
        meta?: { components?: Array<{ name: string; key: string; containing_frame?: { name: string } }> };
      };
      const pubComps = pubData.meta?.components ?? [];
      log('info', `Published components endpoint: ${pubComps.length} components found`);
      // Stash published names for later — we add them only if the tree walk
      // doesn't cover them (e.g. when depth truncates the tree).
      pubCompNames = pubComps
        .filter((c) => c.name)
        .map((c) => ({ name: c.name, frame: c.containing_frame?.name }));
    } else {
      log('warning', `Published components endpoint returned ${pubCompRes.status}: ${pubCompRes.statusText}`);
    }

    checkAbort(abort);

    // --- File document tree (components & component sets) ---
    // The tree walk is the primary source for components because it correctly
    // associates COMPONENT nodes with their parent COMPONENT_SET, giving us
    // accurate layerName values for the display name prefix.
    const fileUrl = `${FIGMA_BASE}/files/${fileKey}?depth=10`;
    const fileRes = await fetchWithBackoff(fileUrl, pat, 5, abort);
    if (fileRes.ok) {
      const fileData = (await fileRes.json()) as {
        document?: { children?: Array<{ type: string; name: string; children?: Array<{ type: string; name: string }> }> };
        components?: Record<string, { name: string; key: string }>;
        componentSets?: Record<string, { name: string; key: string }>;
      };
      const comps = fileData.components ?? {};
      const compsCount = Object.keys(comps).length;
      const compSets = fileData.componentSets ?? {};
      const setsCount = Object.keys(compSets).length;
      log('info', `File endpoint: ${compsCount} components, ${setsCount} component sets in metadata`);

      /**
       * Walk the document tree to discover components.
       *
       * Figma structure (from this file):
       *   DOCUMENT
       *     └─ CANVAS "Button"   (page)
       *         └─ COMPONENT_SET "Primary"   (variant group)
       *             └─ COMPONENT "Type=Primary, State=Default"  (variant)
       *         └─ COMPONENT_SET "Secondary"
       *         ...
       *     └─ CANVAS "Card"     (page)
       *         └─ COMPONENT_SET "Card"
       *             └─ COMPONENT "Primary"
       *
       * We track the nearest ancestor FRAME / SECTION / CANVAS name as the
       * `layerName` context. When we hit a COMPONENT_SET, we register it with
       * that ancestor name as the prefix so the report shows
       * "Button, Primary" rather than just "Primary".
       *
       * Individual COMPONENT variants inside a set are NOT registered — the
       * COMPONENT_SET itself is the reportable unit.
       */
      function walkNodes(
        nodes: Array<{ type?: string; name?: string; children?: unknown[] }> | undefined,
        ancestorName?: string
      ): void {
        if (!nodes) return;
        for (const node of nodes) {
          if (node.type === 'COMPONENT_SET') {
            // Register the set as a component, using the nearest ancestor
            // (page / frame / section) name as the layerName prefix.
            if (node.name) {
              addComponent(node.name, ancestorName);
            }
            // Don't recurse — variants inside the set are states of this
            // component, not separate components.
          } else if (node.type === 'COMPONENT') {
            // Standalone component (not inside a COMPONENT_SET).
            // Use the ancestor name as the layerName prefix.
            if (node.name) {
              addComponent(node.name, ancestorName);
            }
          } else if (Array.isArray(node.children)) {
            // For CANVAS (pages), FRAME, SECTION, GROUP — propagate their
            // name as the new ancestor context for children.
            const nextAncestor =
              (node.type === 'CANVAS' || node.type === 'FRAME' || node.type === 'SECTION')
                ? (node.name ?? ancestorName)
                : ancestorName;
            walkNodes(
              node.children as Array<{ type?: string; name?: string; children?: unknown[] }>,
              nextAncestor
            );
          }
        }
      }
      walkNodes(fileData.document ? [fileData.document] : undefined);
      log('info', `Total unique components after tree walk: ${componentMap.size}`);
    } else {
      log('warning', `File endpoint returned ${fileRes.status}: ${fileRes.statusText}`);

      // File endpoint failed — fall back to published components endpoint data.
      for (const pc of pubCompNames) {
        addComponent(pc.name, pc.frame);
      }
    }
  }

  log('info', `Figma scan complete: ${tokens.length} tokens, ${componentMap.size} components`);
  return {
    tokens,
    componentNames: Array.from(componentMap.values()),
  };
}
