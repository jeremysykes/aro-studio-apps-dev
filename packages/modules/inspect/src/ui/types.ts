import type { Run, LogEntry as CanonicalLogEntry } from '@aro/types';

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

/** Run list item from runs.list() — subset of canonical Run. */
export type RunItem = Pick<Run, 'id' | 'status' | 'startedAt'>;

/** Log entry for UI display — subset of canonical LogEntry. */
export type LogEntry = Pick<CanonicalLogEntry, 'id' | 'level' | 'message'>;

/** Report tab: Health Dashboard, Token Inventory, or Component Inventory. */
export type ReportTab = 'health' | 'tokens' | 'components';

/** Report load state for artifact fetch. */
export type ReportLoadState = 'idle' | 'loading' | 'success' | 'error';

/** Re-export from module types (single source of truth). */
export type { InspectReport, Finding, FindingSeverity } from '../types';
