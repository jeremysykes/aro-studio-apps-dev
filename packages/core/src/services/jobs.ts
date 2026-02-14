import type { JobDefinition } from '../types.js';
import type { RunsService } from './runs.js';
import type { LogsService } from './logs.js';
import type { ArtifactsService } from './artifacts.js';
import type { WorkspaceService } from './workspace.js';
import { createJobContext } from '../execution/JobContext.js';
import { stableInputHash } from '../kernel/hash.js';
import { createId } from '../kernel/ids.js';

export function createJobsService(
  runs: RunsService,
  logs: LogsService,
  artifacts: ArtifactsService,
  workspace: WorkspaceService,
  getIsShutdown?: () => boolean
) {
  const registry = new Map<string, JobDefinition>();
  const abortControllers = new Map<string, AbortController>();
  const timeoutTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function clearRunTimeout(runId: string): void {
    const timer = timeoutTimers.get(runId);
    if (timer) {
      clearTimeout(timer);
      timeoutTimers.delete(runId);
    }
  }

  return {
    register(jobDef: JobDefinition): void {
      registry.set(jobDef.key, jobDef);
    },

    run(jobKey: string, input: unknown, opts?: { traceId?: string }): { runId: string } {
      const jobDef = registry.get(jobKey);
      if (!jobDef) throw new Error(`Job not found: ${jobKey}`);

      const traceId = opts?.traceId ?? createId();
      const { runId } = runs.startRun({ traceId });
      const ac = new AbortController();
      abortControllers.set(runId, ac);

      const logger: (level: string, message: string) => void = (level, message) => {
        logs.appendLog({ runId, traceId, level, message });
      };

      const inputHash = stableInputHash(input);
      const artifactWriter = (params: { path: string; content: string }) => {
        return artifacts.writeArtifact({
          runId,
          traceId,
          path: params.path,
          content: params.content,
          jobKey,
          inputHash,
        });
      };

      const ctx = createJobContext(
        runId,
        logger,
        workspace,
        artifactWriter,
        ac.signal
      );

      // ── Timeout enforcement ───────────────────────────────────────────
      if (jobDef.maxRunDuration != null && jobDef.maxRunDuration > 0) {
        const timer = setTimeout(() => {
          timeoutTimers.delete(runId);
          if (getIsShutdown?.()) return;
          const run = runs.getRun(runId);
          if (run?.status !== 'running') return;

          // Log the timeout reason before transitioning
          logger('error', `Job timed out after ${jobDef.maxRunDuration}ms`);
          ac.abort();
          runs.finishRun({ runId, status: 'error' });
          abortControllers.delete(runId);
        }, jobDef.maxRunDuration);
        timeoutTimers.set(runId, timer);
      }

      void Promise.resolve(jobDef.run(ctx, input))
        .then(() => {
          clearRunTimeout(runId);
          if (getIsShutdown?.()) return;
          if (runs.getRun(runId)?.status === 'running') {
            runs.finishRun({ runId, status: 'success' });
          }
        })
        .catch(() => {
          clearRunTimeout(runId);
          if (getIsShutdown?.()) return;
          if (runs.getRun(runId)?.status === 'running') {
            runs.finishRun({ runId, status: 'error' });
          }
        })
        .finally(() => {
          abortControllers.delete(runId);
        });

      return { runId };
    },

    cancel(runId: string): void {
      clearRunTimeout(runId);
      const ac = abortControllers.get(runId);
      if (ac) {
        ac.abort();
        runs.finishRun({ runId, status: 'cancelled' });
        abortControllers.delete(runId);
      }
    },
  };
}

export type JobsService = ReturnType<typeof createJobsService>;
