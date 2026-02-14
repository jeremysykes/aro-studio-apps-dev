import type { AroCore, ModuleInit } from '@aro/types';

const JOB_KEY = 'hello-world:greet';

export const init: ModuleInit = (core: AroCore): string[] => {
  core.jobs.register({
    key: JOB_KEY,
    run: async (ctx) => {
      ctx.logger('info', 'Hello from module');
      ctx.artifactWriter({ path: 'greeting.txt', content: 'Hello, World!' });
    },
  });
  return [JOB_KEY];
};
