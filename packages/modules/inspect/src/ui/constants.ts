import type { ScanConfig } from './types';

export const JOB_SCAN = 'inspect:scan';
export const JOB_EXPORT = 'inspect:export';

export const defaultConfig: ScanConfig = {
	figmaFileKeys: '',
	figmaPat: '',
	codePaths: '',
	storybookUrl: '',
	storybookPath: '',
};
