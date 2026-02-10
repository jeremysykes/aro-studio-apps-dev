import type { AroCore } from '@aro/core';

const JOB_KEY = 'hello-world:greet';

export function init(core: AroCore): string[] {
  core.jobs.register({
    key: JOB_KEY,
    run: async (ctx) => {
      ctx.logger('info', 'Hello from module');
      ctx.artifactWriter({ path: 'greeting.txt', content: 'Hello, World!' });
    },
  });
  return [JOB_KEY];
}
