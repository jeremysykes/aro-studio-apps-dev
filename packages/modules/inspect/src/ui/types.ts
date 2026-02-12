/** UI view: Setup, Run (logs), or Report. */
export type View = 'setup' | 'run' | 'report';

/** Scan source configuration (Figma, code tokens, Storybook). */
export interface ScanConfig {
	figmaFileKeys: string;
	figmaPat: string;
	codePaths: string;
	storybookUrl: string;
	storybookPath: string;
}

/** Run list item from runs.list(). */
export interface RunItem {
	id: string;
	status: string;
	startedAt: number;
}

/** Log entry from logs.list() / logs.subscribe(). */
export interface LogEntry {
	id: string;
	level: string;
	message: string;
}

/** Report tab: Health Dashboard, Token Inventory, or Component Inventory. */
export type ReportTab = 'health' | 'tokens' | 'components';

export interface InspectReport {
  version: number;
  timestamp: number;
  sourcesScanned: string[];
  tokens: Array<{
    name: string;
    type: string;
    value: string;
    source: string;
    collection?: string;
    filePath?: string;
  }>;
  components: Array<{
    name: string;
    surfaces: { figma?: boolean; storybook?: boolean; code?: boolean };
    coverage: string[];
    isOrphan: boolean;
  }>;
  findings: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    category: string;
    title: string;
    details?: string;
  }>;
  healthScore: {
    composite: number;
    tokenConsistency: number;
    componentCoverage: number;
    namingAlignment: number;
    valueParity: number;
  };
  summary: {
    totalTokens: number;
    totalComponents: number;
    findingsBySeverity: Record<string, number>;
  };
  incomplete?: boolean;
}
