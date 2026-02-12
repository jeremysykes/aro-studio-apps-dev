/**
 * Inspect module types per Implementation-spec §7 and §2.
 */

export interface Token {
  name: string;
  type: string;
  value: string;
  rawValue?: string;
  source: string;
  collection?: string;
  modes?: Record<string, string>;
  description?: string;
  filePath?: string;
}

export interface Component {
  name: string;
  category?: string;
  surfaces: { figma?: boolean; storybook?: boolean; code?: boolean };
  coverage: string[];
  isOrphan: boolean;
  /** Storybook story IDs (e.g. atoms-button--default) when surfaces.storybook */
  storyIds?: string[];
}

export type FindingSeverity = 'critical' | 'warning' | 'info';

export interface Finding {
  id: string;
  severity: FindingSeverity;
  category: string;
  title: string;
  details?: string;
  affectedTokens?: string[];
  affectedComponents?: string[];
  sources?: string[];
}

export interface HealthScore {
  composite: number;
  tokenConsistency: number;
  componentCoverage: number;
  namingAlignment: number;
  valueParity: number;
}

export interface InspectReport {
  version: number;
  timestamp: number;
  sourcesScanned: string[];
  tokens: Token[];
  components: Component[];
  findings: Finding[];
  healthScore: HealthScore;
  summary: {
    totalTokens: number;
    totalComponents: number;
    findingsBySeverity: Record<FindingSeverity, number>;
  };
  incomplete?: boolean;
  /** Base URL for Storybook (e.g. https://site-aro-studio.vercel.app/) when scanned via indexUrl */
  storybookBaseUrl?: string;
}

export interface ScanInput {
  figma?: { fileKeys: string[]; pat?: string };
  codeTokens?: {
    paths?: string[];
    inline?: string;
    format?: 'dtcg' | 'style-dictionary' | 'tokens-studio';
  };
  storybook?: { indexUrl?: string; indexPath?: string };
  options?: {
    namingStrategy?: 'exact' | 'fuzzy' | 'prefix-strip';
    colorDistanceTolerance?: number;
    fuzzyThreshold?: number;
  };
}

export interface ExportInput {
  runId: string;
  format: 'csv' | 'markdown' | 'pdf';
}

export type WorkspaceFacet = {
  resolve: (path: string) => string;
  readText: (path: string) => string;
  writeText: (path: string, content: string) => void;
  exists: (path: string) => boolean;
  mkdirp: (path: string) => void;
};

export type ArtifactWriter = (params: { path: string; content: string }) => unknown;
export type RunLogger = (level: string, message: string) => void;
