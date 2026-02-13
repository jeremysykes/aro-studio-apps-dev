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

/** Report load state for artifact fetch. */
export type ReportLoadState = 'idle' | 'loading' | 'success' | 'error';

/** Re-export from module types (single source of truth). */
export type { InspectReport, Finding, FindingSeverity } from '../types';
