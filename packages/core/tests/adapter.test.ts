import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCore } from '@aro/core';
import { createCoreAdapter } from '../src/adapters/CoreAdapter.js';
import { runContractSuite } from './adapter.contract.js';

runContractSuite(() => {
  const workspaceRoot = mkdtempSync(join(tmpdir(), 'aro-contract-'));
  const core = createCore({ workspaceRoot });

  // ── Test jobs ─────────────────────────────────────────────────────────
  // Sync job that logs and writes an artifact
  core.jobs.register({
    key: 'test-job',
    run: (ctx, input) => {
      ctx.logger('info', 'running');
      ctx.artifactWriter({ path: 'out.json', content: JSON.stringify(input) });
    },
  });

  // Long-running job for cancel testing
  core.jobs.register({
    key: 'slow-job',
    run: async (ctx) => {
      while (!ctx.abort.aborted) {
        await new Promise((r) => setTimeout(r, 5));
      }
    },
  });

  // Job that rejects (error status)
  core.jobs.register({
    key: 'fail-job',
    run: async () => {
      throw new Error('boom');
    },
  });

  // Job that logs multiple entries over time (for subscription tests)
  core.jobs.register({
    key: 'logging-job',
    run: async (ctx) => {
      for (let i = 0; i < 3; i++) {
        ctx.logger('info', `step-${i}`);
        await new Promise((r) => setTimeout(r, 15));
      }
    },
  });

  // Job with a short timeout for timeout enforcement testing
  core.jobs.register({
    key: 'timeout-job',
    maxRunDuration: 50,
    run: async (ctx) => {
      // Runs forever unless aborted — will be killed by the timeout
      while (!ctx.abort.aborted) {
        await new Promise((r) => setTimeout(r, 5));
      }
    },
  });

  const adapter = createCoreAdapter(core, {
    uiModel: 'sidebar',
    enabledModules: ['test-job', 'slow-job', 'fail-job', 'logging-job', 'timeout-job'],
    workspaceRoot,
  });

  return { adapter, cleanup: () => core.shutdown() };
});
