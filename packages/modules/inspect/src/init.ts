import type { AroCore, ModuleInit } from '@aro/types';
import { runScan } from './scan.js';
import { runExport } from './export.js';

const JOB_SCAN = 'inspect:scan';
const JOB_EXPORT = 'inspect:export';

export const init: ModuleInit = (core: AroCore): string[] => {
  core.jobs.register({
    key: JOB_SCAN,
    run: async (ctx, input) => {
      const report = await runScan(ctx, input);
      if (report) {
        ctx.artifactWriter({ path: 'report.json', content: JSON.stringify(report, null, 2) });
      }
    },
  });
  core.jobs.register({
    key: JOB_EXPORT,
    run: async (ctx, input) => {
      await runExport(ctx, input);
    },
  });
  return [JOB_SCAN, JOB_EXPORT];
};
