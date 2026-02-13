import type { ScanConfig } from '../types';
import { defaultConfig } from '../constants';

function getEnv(key: string): string {
	if (typeof import.meta === 'undefined') return '';
	return (import.meta as { env?: Record<string, string | undefined> }).env?.[key] ?? '';
}

export function getInitialConfig(): ScanConfig {
	const envToken = getEnv('VITE_FIGMA_TOKEN');
	const storybookUrl = getEnv('VITE_STORYBOOK_INDEX_URL').trim();
	const storybookPath = getEnv('VITE_STORYBOOK_INDEX_PATH').trim();
	const codePaths = getEnv('VITE_CODE_TOKENS_PATH').trim();
	const figmaFileKeyOrUrl = (getEnv('VITE_FIGMA_FILE_KEY') || getEnv('VITE_FIGMA_FILE_URL')).trim();

	return {
		...defaultConfig,
		figmaPat: typeof envToken === 'string' ? envToken : '',
		storybookUrl,
		storybookPath,
		codePaths,
		figmaFileKeys: figmaFileKeyOrUrl ? figmaFileKeyOrUrl : '',
	};
}

/** Extract Figma file key from a URL or return trimmed string if already a raw key. */
export function extractFigmaFileKey(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) return '';
	const match = trimmed.match(/figma\.com\/(?:design|file)\/([A-Za-z0-9_-]+)/);
	return match ? match[1]! : trimmed;
}

export function hasAtLeastOneSource(config: ScanConfig): boolean {
	const hasFigma = config.figmaFileKeys.trim() && config.figmaPat.trim();
	const hasCode = config.codePaths.trim().length > 0;
	const hasStorybook =
		config.storybookUrl.trim().length > 0 ||
		config.storybookPath.trim().length > 0;
	return hasFigma || hasCode || hasStorybook;
}

export function buildScanInput(config: ScanConfig): unknown {
	const input: Record<string, unknown> = {};
	if (config.figmaFileKeys.trim() && config.figmaPat.trim()) {
		input.figma = {
			fileKeys: config.figmaFileKeys
				.split(/[\s,]+/)
				.filter(Boolean)
				.map((s) => extractFigmaFileKey(s.trim()))
				.filter(Boolean),
			pat: config.figmaPat.trim(),
		};
	}
	const codePathsTrimmed = config.codePaths.trim();
	if (codePathsTrimmed) {
		const firstChar = codePathsTrimmed[0];
		if (firstChar === '{' || firstChar === '[') {
			input.codeTokens = { inline: codePathsTrimmed };
		} else {
			input.codeTokens = {
				paths: codePathsTrimmed.split(/[\n\s,]+/).filter(Boolean),
			};
		}
	}
	if (config.storybookUrl.trim()) {
		input.storybook = { indexUrl: config.storybookUrl.trim() };
	} else if (config.storybookPath.trim()) {
		input.storybook = { indexPath: config.storybookPath.trim() };
	}
	return input;
}
