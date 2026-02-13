/**
 * Zod schemas for runtime validation of external data.
 * Used at module boundaries: job input, API responses, parsed reports.
 */
import { z } from 'zod';

// -- ScanInput validation --

export const ScanInputSchema = z.object({
  figma: z.object({
    fileKeys: z.array(z.string().min(1)),
    pat: z.string().optional(),
  }).optional(),
  codeTokens: z.object({
    paths: z.array(z.string()).optional(),
    inline: z.string().optional(),
    format: z.enum(['dtcg', 'style-dictionary', 'tokens-studio']).optional(),
  }).optional(),
  storybook: z.object({
    indexUrl: z.string().url().optional(),
    indexPath: z.string().optional(),
  }).optional(),
  options: z.object({
    namingStrategy: z.enum(['exact', 'fuzzy', 'prefix-strip']).optional(),
    colorDistanceTolerance: z.number().min(0).optional(),
    fuzzyThreshold: z.number().min(0).max(1).optional(),
  }).optional(),
}).strict();

export const ExportInputSchema = z.object({
  runId: z.string().min(1),
  format: z.enum(['csv', 'markdown', 'pdf']),
});

// -- InspectReport validation (for reading back from artifacts) --

const TokenSchema = z.object({
  name: z.string(),
  type: z.string(),
  value: z.string(),
  rawValue: z.string().optional(),
  source: z.string(),
  collection: z.string().optional(),
  modes: z.record(z.string()).optional(),
  description: z.string().optional(),
  filePath: z.string().optional(),
});

const ComponentSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  surfaces: z.object({
    figma: z.boolean().optional(),
    storybook: z.boolean().optional(),
    code: z.boolean().optional(),
  }),
  coverage: z.array(z.string()),
  isOrphan: z.boolean(),
  storyIds: z.array(z.string()).optional(),
  layerName: z.string().optional(),
});

const FindingSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
  category: z.string(),
  title: z.string(),
  details: z.string().optional(),
  affectedTokens: z.array(z.string()).optional(),
  affectedComponents: z.array(z.string()).optional(),
  sources: z.array(z.string()).optional(),
});

const HealthScoreSchema = z.object({
  composite: z.number(),
  tokenConsistency: z.number(),
  componentCoverage: z.number(),
  namingAlignment: z.number(),
  valueParity: z.number(),
});

export const InspectReportSchema = z.object({
  version: z.number(),
  timestamp: z.number(),
  sourcesScanned: z.array(z.string()),
  tokens: z.array(TokenSchema),
  components: z.array(ComponentSchema),
  findings: z.array(FindingSchema),
  healthScore: HealthScoreSchema,
  summary: z.object({
    totalTokens: z.number(),
    totalComponents: z.number(),
    findingsBySeverity: z.record(z.enum(['critical', 'warning', 'info']), z.number()),
  }),
  incomplete: z.boolean().optional(),
  storybookBaseUrl: z.string().optional(),
});

// -- Figma API response validation (loose — only validate structure we rely on) --

export const FigmaVariablesResponseSchema = z.object({
  meta: z.object({
    variableCollections: z.record(z.object({ name: z.string(), key: z.string().optional() })).optional(),
    variables: z.record(z.object({
      name: z.string(),
      key: z.string(),
      resolvedType: z.string(),
      valuesByMode: z.record(z.unknown()),
      variableCollectionId: z.string().optional(),
    })).optional(),
  }).optional(),
  variableCollections: z.record(z.object({ name: z.string() })).optional(),
  variables: z.record(z.object({
    name: z.string(),
    key: z.string(),
    resolvedType: z.string(),
    valuesByMode: z.record(z.unknown()),
    variableCollectionId: z.string().optional(),
  })).optional(),
}).passthrough();

export const StorybookIndexSchema = z.object({
  entries: z.record(z.object({
    id: z.string(),
    title: z.string().optional(),
    name: z.string().optional(),
    importPath: z.string().optional(),
    argTypes: z.unknown().optional(),
  })).optional(),
  stories: z.record(z.object({
    id: z.string(),
    title: z.string().optional(),
    name: z.string().optional(),
  })).optional(),
}).passthrough();

// -- File path validation --

/** Validate that a file path is safe (no traversal, stays within workspace). */
export function isPathSafe(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/');
  if (normalized.startsWith('/')) return false;
  if (normalized.includes('..')) return false;
  if (normalized.includes('\0')) return false;
  return true;
}
