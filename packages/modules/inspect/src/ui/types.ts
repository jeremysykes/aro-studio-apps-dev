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
