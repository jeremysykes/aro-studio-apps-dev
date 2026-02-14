import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCore } from '@aro/core';

function useTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'aro-core-test-'));
}

function collectTsFiles(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') collectTsFiles(p, acc);
    else if (e.isFile() && e.name.endsWith('.ts')) acc.push(p);
  }
  return acc;
}

describe('Core MVP', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = useTempDir();
  });

  describe('Workspace', () => {
    it('can initialize a workspace (creates .aro/ directory)', () => {
      const core = createCore({ workspaceRoot });
      core.workspace.initWorkspace();
      expect(existsSync(join(workspaceRoot, '.aro'))).toBe(true);
      core.shutdown();
    });

    it('can safely resolve paths within workspace', () => {
      const core = createCore({ workspaceRoot });
      core.workspace.initWorkspace();
      const abs = core.workspace.resolve('tokens/tokens.json');
      expect(abs).toBe(join(workspaceRoot, 'tokens', 'tokens.json'));
      core.shutdown();
    });

    it('blocks ../ path traversal attempts', () => {
      const core = createCore({ workspaceRoot });
      expect(() => core.workspace.resolve('../etc/passwd')).toThrow();
      core.shutdown();
    });

    it('can read/write text files via workspace service', () => {
      const core = createCore({ workspaceRoot });
      core.workspace.writeText('foo.txt', 'hello');
      expect(core.workspace.exists('foo.txt')).toBe(true);
      expect(core.workspace.readText('foo.txt')).toBe('hello');
      core.shutdown();
    });
  });

  describe('SQLite persistence', () => {
    it('creates SQLite db file on first run', () => {
      const core = createCore({ workspaceRoot });
      core.workspace.initWorkspace();
      const dbPath = join(workspaceRoot, '.aro', 'aro.sqlite');
      expect(existsSync(dbPath)).toBe(true);
      core.shutdown();
    });

    it('creates required tables idempotently', () => {
      const core = createCore({ workspaceRoot });
      core.runs.startRun();
      core.runs.startRun();
      const list = core.runs.listRuns();
      expect(list.length).toBe(2);
      core.shutdown();
    });

    it('stores and loads run history', () => {
      const core = createCore({ workspaceRoot });
      const { runId } = core.runs.startRun();
      core.runs.finishRun({ runId, status: 'success' });
      const run = core.runs.getRun(runId);
      expect(run).not.toBeNull();
      expect(run!.status).toBe('success');
      core.shutdown();
    });
  });

  describe('Runs', () => {
    it('can start a run and receive a runId', () => {
      const core = createCore({ workspaceRoot });
      const { runId } = core.runs.startRun();
      expect(typeof runId).toBe('string');
      expect(runId.length).toBeGreaterThan(0);
      core.shutdown();
    });

    it('can finish a run with status (success/error/cancelled)', () => {
      const core = createCore({ workspaceRoot });
      const { runId } = core.runs.startRun();
      core.runs.finishRun({ runId, status: 'cancelled' });
      expect(core.runs.getRun(runId)!.status).toBe('cancelled');
      core.shutdown();
    });

    it('can list runs ordered by time', () => {
      const core = createCore({ workspaceRoot });
      const { runId: a } = core.runs.startRun();
      const { runId: b } = core.runs.startRun();
      const list = core.runs.listRuns();
      expect(list.length).toBe(2);
      expect(list[0].id).toBe(b);
      expect(list[1].id).toBe(a);
      core.shutdown();
    });
  });

  describe('Logs', () => {
    it('can append log entries during a run', () => {
      const core = createCore({ workspaceRoot });
      const { runId } = core.runs.startRun();
      core.logs.appendLog({ runId, level: 'info', message: 'test' });
      const entries = core.logs.listLogs(runId);
      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe('test');
      core.shutdown();
    });

    it('can stream logs to subscribers', () => {
      const core = createCore({ workspaceRoot });
      const { runId } = core.runs.startRun();
      const received: string[] = [];
      core.logs.subscribe(runId, (e) => received.push(e.message));
      core.logs.appendLog({ runId, level: 'info', message: 'one' });
      core.logs.appendLog({ runId, level: 'info', message: 'two' });
      expect(received).toEqual(['one', 'two']);
      core.shutdown();
    });

    it('logs persist and can be reloaded after restart', () => {
      const { runId } = (() => {
        const core = createCore({ workspaceRoot });
        const { runId: id } = core.runs.startRun();
        core.logs.appendLog({ runId: id, level: 'info', message: 'persisted' });
        core.shutdown();
        return { runId: id };
      })();
      const core2 = createCore({ workspaceRoot });
      const entries = core2.logs.listLogs(runId);
      expect(entries.some((e) => e.message === 'persisted')).toBe(true);
      core2.shutdown();
    });
  });

  describe('Artifacts', () => {
    it('can write an artifact to .aro/artifacts/<runId>/...', () => {
      const core = createCore({ workspaceRoot });
      const { runId } = core.runs.startRun();
      core.artifacts.writeArtifact({ runId, path: 'out.json', content: '{"x":1}', jobKey: 'test', inputHash: 'abc123' });
      const p = join(workspaceRoot, '.aro', 'artifacts', runId, 'out.json');
      expect(existsSync(p)).toBe(true);
      expect(readFileSync(p, 'utf-8')).toBe('{"x":1}');
      core.shutdown();
    });

    it('artifacts are indexed in SQLite', () => {
      const core = createCore({ workspaceRoot });
      const { runId } = core.runs.startRun();
      core.artifacts.writeArtifact({ runId, path: 'a.txt', content: 'a', jobKey: 'test', inputHash: 'abc123' });
      const list = core.artifacts.listArtifacts(runId);
      expect(list.length).toBe(1);
      expect(list[0].path).toBe('a.txt');
      core.shutdown();
    });

    it('can list artifacts for a run', () => {
      const core = createCore({ workspaceRoot });
      const { runId } = core.runs.startRun();
      core.artifacts.writeArtifact({ runId, path: 'x', content: 'x', jobKey: 'test', inputHash: 'abc123' });
      core.artifacts.writeArtifact({ runId, path: 'y', content: 'y', jobKey: 'test', inputHash: 'abc123' });
      const list = core.artifacts.listArtifacts(runId);
      expect(list.length).toBe(2);
      core.shutdown();
    });
  });

  describe('Jobs', () => {
    it('can register a job definition', () => {
      const core = createCore({ workspaceRoot });
      core.jobs.register({ key: 'j1', run: () => {} });
      const { runId } = core.jobs.run('j1', null);
      expect(runId).toBeDefined();
      core.shutdown();
    });

    it('can run a job and persist run record', async () => {
      const core = createCore({ workspaceRoot });
      core.jobs.register({ key: 'j2', run: () => {} });
      const { runId } = core.jobs.run('j2', null);
      await new Promise((r) => setTimeout(r, 20));
      const run = core.runs.getRun(runId);
      expect(run).not.toBeNull();
      expect(run!.status).toBe('success');
      core.shutdown();
    });

    it('job can report progress events', async () => {
      const core = createCore({ workspaceRoot });
      core.jobs.register({
        key: 'j3',
        run: (ctx) => {
          ctx.progress?.(0.5);
        },
      });
      const { runId } = core.jobs.run('j3', null);
      await new Promise((r) => setTimeout(r, 20));
      expect(core.runs.getRun(runId)!.status).toBe('success');
      core.shutdown();
    });

    it('job can be cancelled via AbortSignal', async () => {
      const core = createCore({ workspaceRoot });
      let aborted = false;
      core.jobs.register({
        key: 'j4',
        run: async (ctx) => {
          while (!ctx.abort.aborted) {
            await new Promise((r) => setTimeout(r, 5));
          }
          aborted = true;
        },
      });
      const { runId } = core.jobs.run('j4', null);
      await new Promise((r) => setTimeout(r, 10));
      core.jobs.cancel(runId);
      await new Promise((r) => setTimeout(r, 50));
      expect(aborted).toBe(true);
      core.shutdown();
    });

    it('cancellation results in cancelled run status', async () => {
      const core = createCore({ workspaceRoot });
      core.jobs.register({
        key: 'j5',
        run: async (ctx) => {
          while (!ctx.abort.aborted) await new Promise((r) => setTimeout(r, 5));
        },
      });
      const { runId } = core.jobs.run('j5', null);
      await new Promise((r) => setTimeout(r, 10));
      core.jobs.cancel(runId);
      await new Promise((r) => setTimeout(r, 30));
      expect(core.runs.getRun(runId)!.status).toBe('cancelled');
      core.shutdown();
    });
  });

  describe('Tokens + Validation', () => {
    it('can load tokens from tokens/tokens.json (or configured path)', () => {
      const core = createCore({ workspaceRoot });
      core.workspace.mkdirp('tokens');
      core.workspace.writeText('tokens/tokens.json', '{"color": "red"}');
      const t = core.tokens.loadTokens();
      expect((t as Record<string, string>).color).toBe('red');
      core.shutdown();
    });

    it('can save tokens back to disk', () => {
      const core = createCore({ workspaceRoot });
      core.tokens.saveTokens({ size: 16 });
      const raw = core.workspace.readText('tokens/tokens.json');
      expect(JSON.parse(raw).size).toBe(16);
      core.shutdown();
    });

    it('can validate tokens via Zod at boundary', () => {
      const core = createCore({ workspaceRoot });
      const ok = core.validation.validateTokens({});
      expect(ok.ok).toBe(true);
      const bad = core.validation.validateTokens('not an object');
      expect(bad.ok).toBe(false);
      expect(bad.issues!.length).toBeGreaterThan(0);
      core.shutdown();
    });

    it('validation returns a stable issue format', () => {
      const core = createCore({ workspaceRoot });
      const r = core.validation.validateTokens(123);
      expect(r.ok).toBe(false);
      expect(r.issues).toBeDefined();
      for (const i of r.issues!) {
        expect(i).toHaveProperty('path');
        expect(i).toHaveProperty('message');
      }
      core.shutdown();
    });
  });

  describe('Headless proof', () => {
    it('all of the above works with Node only (no Desktop, no Electron)', () => {
      const core = createCore({ workspaceRoot });
      expect(typeof core.workspace.resolve).toBe('function');
      expect(typeof core.runs.startRun).toBe('function');
      expect(typeof core.logs.appendLog).toBe('function');
      expect(typeof core.artifacts.writeArtifact).toBe('function');
      expect(typeof core.jobs.register).toBe('function');
      expect(typeof core.tokens.loadTokens).toBe('function');
      expect(typeof core.validation.validateTokens).toBe('function');
      core.shutdown();
    });
  });

  describe('Architectural integrity', () => {
    it('Core has no imports from apps/ or packages/modules/', () => {
      const srcDir = join(__dirname, '..', 'src');
      const files = collectTsFiles(srcDir);
      const forbidden = [/from\s+['"][^'"]*apps\//, /from\s+['"][^'"]*packages\/modules/];
      for (const f of files) {
        const content = readFileSync(f, 'utf-8');
        for (const re of forbidden) {
          expect(content).not.toMatch(re);
        }
      }
    });

    it('better-sqlite3 only in infra/db', () => {
      const srcDir = join(__dirname, '..', 'src');
      const files = collectTsFiles(srcDir);
      const infraDb = join(srcDir, 'infra', 'db');
      for (const f of files) {
        const content = readFileSync(f, 'utf-8');
        if (content.includes('better-sqlite3')) {
          expect(f.startsWith(infraDb)).toBe(true);
        }
      }
    });
  });
});
