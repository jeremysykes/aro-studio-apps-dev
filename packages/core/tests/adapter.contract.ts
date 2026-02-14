/**
 * Transport-agnostic contract tests for AroPreloadAPI.
 *
 * Any host (desktop, web, or the reference CoreAdapter) can run this suite
 * by providing a factory that returns a fresh adapter + cleanup function.
 *
 * Usage:
 *   import { runContractSuite } from './adapter.contract.js';
 *   runContractSuite(() => ({ adapter, cleanup }));
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { AroPreloadAPI } from '@aro/types';

export interface ContractFactory {
  (): { adapter: AroPreloadAPI; cleanup: () => void };
}

export function runContractSuite(factory: ContractFactory): void {
  describe('AroPreloadAPI contract', () => {
    let api: AroPreloadAPI;
    let cleanup: () => void;

    beforeEach(() => {
      const ctx = factory();
      api = ctx.adapter;
      cleanup = ctx.cleanup;
    });

    afterEach(() => {
      cleanup();
    });

    // ── App config ────────────────────────────────────────────────────────

    describe('App config', () => {
      it('getUIModel() returns the configured model', async () => {
        const model = await api.getUIModel();
        expect(typeof model).toBe('string');
        expect(['standalone', 'sidebar', 'dashboard', 'tabs', 'carousel']).toContain(model);
      });

      it('getEnabledModules() returns an array of strings', async () => {
        const modules = await api.getEnabledModules();
        expect(Array.isArray(modules)).toBe(true);
        for (const m of modules) {
          expect(typeof m).toBe('string');
        }
      });
    });

    // ── Workspace ─────────────────────────────────────────────────────────

    describe('Workspace', () => {
      it('workspace.getCurrent() returns an object with path', async () => {
        const current = await api.workspace.getCurrent();
        expect(current).not.toBeNull();
        expect(typeof current!.path).toBe('string');
      });

      it('workspace.select() returns null (no interactive dialog)', async () => {
        const result = await api.workspace.select();
        expect(result).toBeNull();
      });

      it('workspace.onChanged() returns an unsubscribe function', () => {
        const unsub = api.workspace.onChanged(() => {});
        expect(typeof unsub).toBe('function');
        unsub(); // should not throw
      });
    });

    // ── Jobs & Runs ───────────────────────────────────────────────────────

    describe('Jobs & Runs', () => {
      it('job.run() returns { runId } with a string id', async () => {
        const { runId } = await api.job.run('test-job', { value: 1 });
        expect(typeof runId).toBe('string');
        expect(runId.length).toBeGreaterThan(0);
      });

      it('after sync job completes, runs.get() returns success', async () => {
        const { runId } = await api.job.run('test-job', { value: 2 });
        await sleep(30);
        const run = await api.runs.get(runId);
        expect(run).not.toBeNull();
        expect(run!.status).toBe('success');
      });

      it('after job error, runs.get() returns error status', async () => {
        const { runId } = await api.job.run('fail-job', null);
        await sleep(30);
        const run = await api.runs.get(runId);
        expect(run).not.toBeNull();
        expect(run!.status).toBe('error');
      });

      it('job.cancel() results in cancelled status', async () => {
        const { runId } = await api.job.run('slow-job', null);
        await sleep(15);
        await api.job.cancel(runId);
        await sleep(50);
        const run = await api.runs.get(runId);
        expect(run).not.toBeNull();
        expect(run!.status).toBe('cancelled');
      });

      it('runs.list() returns runs ordered newest first', async () => {
        await api.job.run('test-job', { i: 1 });
        await sleep(5);
        await api.job.run('test-job', { i: 2 });
        await sleep(30);
        const runs = await api.runs.list();
        expect(runs.length).toBeGreaterThanOrEqual(2);
        expect(runs[0].startedAt).toBeGreaterThanOrEqual(runs[1].startedAt);
      });

      it('runs.get() returns null for nonexistent runId', async () => {
        const run = await api.runs.get('nonexistent-id');
        expect(run).toBeNull();
      });

      it('job.listRegistered() returns registered job keys', async () => {
        const keys = await api.job.listRegistered();
        expect(Array.isArray(keys)).toBe(true);
        expect(keys.length).toBeGreaterThan(0);
      });
    });

    // ── Logs ──────────────────────────────────────────────────────────────

    describe('Logs', () => {
      it('logs.list() returns entries appended during a job', async () => {
        const { runId } = await api.job.run('test-job', { val: 'log-test' });
        await sleep(30);
        const entries = await api.logs.list(runId);
        expect(entries.length).toBeGreaterThan(0);
        expect(entries[0].level).toBe('info');
        expect(entries[0].message).toBe('running');
      });

      it('logs.subscribe() delivers entries via callback', async () => {
        const { runId } = await api.job.run('logging-job', null);
        const received: string[] = [];
        const unsub = await api.logs.subscribe(runId, (entry) => {
          received.push(entry.message);
        });
        // logging-job appends entries after a brief delay
        await sleep(80);
        unsub();
        expect(received.length).toBeGreaterThan(0);
      });

      it('unsubscribe stops delivery', async () => {
        const { runId } = await api.job.run('logging-job', null);
        const received: string[] = [];
        const unsub = await api.logs.subscribe(runId, (entry) => {
          received.push(entry.message);
        });
        await sleep(30);
        unsub();
        const countAfterUnsub = received.length;
        await sleep(60);
        // No new entries should arrive after unsubscribe
        expect(received.length).toBe(countAfterUnsub);
      });
    });

    // ── Artifacts ─────────────────────────────────────────────────────────

    describe('Artifacts', () => {
      it('artifacts.list() returns artifacts created by a job', async () => {
        const input = { data: 'artifact-test' };
        const { runId } = await api.job.run('test-job', input);
        await sleep(30);
        const list = await api.artifacts.list(runId);
        expect(list.length).toBe(1);
        expect(list[0].path).toBe('out.json');
      });

      it('artifact objects have full provenance fields', async () => {
        const input = { data: 'provenance' };
        const { runId } = await api.job.run('test-job', input);
        await sleep(30);
        const [artifact] = await api.artifacts.list(runId);
        expect(artifact).toBeDefined();
        expect(typeof artifact.id).toBe('string');
        expect(artifact.runId).toBe(runId);
        expect(typeof artifact.traceId).toBe('string');
        expect(artifact.traceId.length).toBeGreaterThan(0);
        expect(artifact.path).toBe('out.json');
        expect(artifact.jobKey).toBe('test-job');
        expect(typeof artifact.inputHash).toBe('string');
        expect(artifact.inputHash.length).toBe(16);
        expect(typeof artifact.createdAt).toBe('number');
      });

      it('artifacts.read() returns the content that was written', async () => {
        const input = { data: 'read-test' };
        const { runId } = await api.job.run('test-job', input);
        await sleep(30);
        const content = await api.artifacts.read(runId, 'out.json');
        expect(JSON.parse(content)).toEqual(input);
      });

      it('same input produces same inputHash', async () => {
        const input = { key: 'deterministic' };
        const { runId: r1 } = await api.job.run('test-job', input);
        await sleep(30);
        const { runId: r2 } = await api.job.run('test-job', input);
        await sleep(30);
        const [a1] = await api.artifacts.list(r1);
        const [a2] = await api.artifacts.list(r2);
        expect(a1.inputHash).toBe(a2.inputHash);
      });

      it('different inputs produce different inputHash', async () => {
        const { runId: r1 } = await api.job.run('test-job', { a: 1 });
        await sleep(30);
        const { runId: r2 } = await api.job.run('test-job', { b: 2 });
        await sleep(30);
        const [a1] = await api.artifacts.list(r1);
        const [a2] = await api.artifacts.list(r2);
        expect(a1.inputHash).not.toBe(a2.inputHash);
      });
    });

    // ── Trace ID ──────────────────────────────────────────────────────────

    describe('Trace ID', () => {
      it('run, logs, and artifacts share the same traceId', async () => {
        const { runId } = await api.job.run('test-job', { data: 'trace-test' });
        await sleep(30);
        const run = await api.runs.get(runId);
        expect(run).not.toBeNull();
        expect(typeof run!.traceId).toBe('string');
        expect(run!.traceId.length).toBeGreaterThan(0);

        const logs = await api.logs.list(runId);
        expect(logs.length).toBeGreaterThan(0);
        for (const log of logs) {
          expect(log.traceId).toBe(run!.traceId);
        }

        const artifacts = await api.artifacts.list(runId);
        expect(artifacts.length).toBe(1);
        expect(artifacts[0].traceId).toBe(run!.traceId);
      });

      it('UI-supplied traceId is used when provided', async () => {
        const myTraceId = 'ui-trace-' + Date.now();
        const { runId } = await api.job.run('test-job', { data: 'custom-trace' }, { traceId: myTraceId });
        await sleep(30);
        const run = await api.runs.get(runId);
        expect(run!.traceId).toBe(myTraceId);

        const logs = await api.logs.list(runId);
        for (const log of logs) {
          expect(log.traceId).toBe(myTraceId);
        }

        const [artifact] = await api.artifacts.list(runId);
        expect(artifact.traceId).toBe(myTraceId);
      });

      it('auto-generated traceId is a valid UUID when not supplied', async () => {
        const { runId } = await api.job.run('test-job', { data: 'auto-trace' });
        await sleep(30);
        const run = await api.runs.get(runId);
        expect(run!.traceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      });
    });

    // ── Timeout enforcement ───────────────────────────────────────────────

    describe('Timeout enforcement', () => {
      it('job exceeding maxRunDuration is marked error with timeout log', async () => {
        const { runId } = await api.job.run('timeout-job', null);
        // timeout-job has maxRunDuration: 50ms, so wait enough for it to fire
        await sleep(150);
        const run = await api.runs.get(runId);
        expect(run).not.toBeNull();
        expect(run!.status).toBe('error');

        const entries = await api.logs.list(runId);
        const timeoutLog = entries.find((e) => e.message.includes('timed out'));
        expect(timeoutLog).toBeDefined();
        expect(timeoutLog!.level).toBe('error');
        expect(timeoutLog!.message).toContain('50ms');
      });

      it('job that completes before timeout succeeds normally', async () => {
        // test-job is sync and has no maxRunDuration — should succeed as before
        const { runId } = await api.job.run('test-job', { data: 'fast' });
        await sleep(30);
        const run = await api.runs.get(runId);
        expect(run!.status).toBe('success');
      });
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
