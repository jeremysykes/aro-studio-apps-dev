import { readdirSync, statSync } from 'fs';
import os from 'os';
import path from 'path';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import type { ZodType } from 'zod';
import { createCore, createCoreAdapter } from '@aro/core';
import type { AroPreloadAPI } from '@aro/types';
import {
  JobRunPayload,
  JobCancelPayload,
  RunIdParam,
  ArtifactReadParams,
  LogSubscribeQuery,
  WorkspaceSelectPayload,
} from '@aro/types';
import {
  getCore,
  getCurrentWorkspacePath,
  getRegisteredJobKeys,
  addLogSubscription,
  removeLogSubscription,
  switchWorkspace,
} from './state.js';
import { loadModules } from './moduleLoader.js';
import { getResolvedConfig } from './moduleRegistry.js';

const NO_WORKSPACE = 'No workspace selected';

/**
 * Build a CoreAdapter from current host state.
 * All Core operation logic is defined once in the adapter —
 * the API layer only handles transport (Express/WS) and host-specific
 * operations (WebSocket log subscription).
 */
function requireAdapter(): AroPreloadAPI {
  const c = getCore();
  if (!c) throw new Error(NO_WORKSPACE);
  const config = getResolvedConfig();
  return createCoreAdapter(c, {
    uiModel: config.uiModel,
    enabledModules: config.enabledModules,
    workspaceRoot: getCurrentWorkspacePath()!,
    tenantConfig: config,
    getRegisteredJobKeys,
  });
}

/** Express middleware: validate req.body with a Zod schema, respond 400 on failure. */
function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validation failed', issues: result.error.errors });
      return;
    }
    req.body = result.data;
    next();
  };
}

/** Validate a route param; returns 400 on failure. */
function parseParam(res: Response, schema: ZodType<string>, value: string): string | null {
  const result = schema.safeParse(value);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', issues: result.error.errors });
    return null;
  }
  return result.data;
}

export function createApiRouter(): Router {
  const router = Router();

  router.get('/workspace/current', (_req, res) => {
    const wsPath = getCurrentWorkspacePath();
    res.json(wsPath ? { path: wsPath } : null);
  });

  router.post('/workspace/select', validateBody(WorkspaceSelectPayload), (req, res) => {
    const { path: rawPath } = req.body as WorkspaceSelectPayload;
    try {
      const resolved = switchWorkspace(rawPath, createCore, loadModules);
      res.json({ path: resolved });
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to set workspace' });
    }
  });

  // ── Filesystem browsing (web-only) ────────────────────────────────────────
  router.get('/filesystem/browse', (req, res) => {
    const rawPath = typeof req.query.path === 'string' ? req.query.path : os.homedir();
    const resolved = path.resolve(rawPath);
    try {
      const stat = statSync(resolved);
      if (!stat.isDirectory()) {
        res.status(400).json({ error: 'Path is not a directory' });
        return;
      }
      const dirents = readdirSync(resolved, { withFileTypes: true });
      const entries = dirents
        .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({ name: d.name, path: path.join(resolved, d.name) }));
      const parent = path.dirname(resolved);
      res.json({
        current: resolved,
        parent: parent !== resolved ? parent : null,
        entries,
      });
    } catch {
      res.status(400).json({ error: 'Unable to read directory' });
    }
  });

  // ── Delegated through CoreAdapter ──────────────────────────────────────
  router.get('/app/tenant-config', async (_req, res) => {
    const api = requireAdapter();
    res.json(await api.getTenantConfig());
  });

  router.get('/app/ui-model', async (_req, res) => {
    const api = requireAdapter();
    res.json({ model: await api.getUIModel() });
  });

  router.get('/app/enabled-modules', async (_req, res) => {
    const api = requireAdapter();
    res.json(await api.getEnabledModules());
  });

  router.get('/job/registered', async (_req, res) => {
    const api = requireAdapter();
    res.json(await api.job.listRegistered());
  });

  router.post('/job/run', validateBody(JobRunPayload), async (req, res) => {
    const { jobKey, input, traceId } = req.body as JobRunPayload;
    const api = requireAdapter();
    const result = await api.job.run(jobKey, input, traceId ? { traceId } : undefined);
    res.json(result);
  });

  router.post('/job/cancel', validateBody(JobCancelPayload), async (req, res) => {
    const { runId } = req.body as JobCancelPayload;
    const api = requireAdapter();
    await api.job.cancel(runId);
    res.status(204).send();
  });

  router.get('/runs', async (_req, res) => {
    const api = requireAdapter();
    res.json(await api.runs.list());
  });

  router.get('/runs/:runId', async (req, res) => {
    const runId = parseParam(res, RunIdParam, req.params.runId);
    if (!runId) return;
    const api = requireAdapter();
    const run = await api.runs.get(runId);
    if (!run) {
      res.status(404).json(null);
      return;
    }
    res.json(run);
  });

  router.get('/logs/:runId', async (req, res) => {
    const runId = parseParam(res, RunIdParam, req.params.runId);
    if (!runId) return;
    const api = requireAdapter();
    res.json(await api.logs.list(runId));
  });

  router.get('/artifacts/:runId', async (req, res) => {
    const runId = parseParam(res, RunIdParam, req.params.runId);
    if (!runId) return;

    const pathParam = req.query.path;
    if (typeof pathParam === 'string') {
      // Validate path to prevent directory traversal
      const params = ArtifactReadParams.safeParse({ runId, path: pathParam });
      if (!params.success) {
        res.status(400).json({ error: 'Validation failed', issues: params.error.errors });
        return;
      }
      const api = requireAdapter();
      const content = await api.artifacts.read(params.data.runId, params.data.path);
      res.type('text/plain').send(content);
      return;
    }
    const api = requireAdapter();
    res.json(await api.artifacts.list(runId));
  });

  return router;
}

// ── Host-specific: WebSocket log subscription ──────────────────────────────

export function attachLogWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '', `http://${request.headers.host}`);
    if (url.pathname === '/ws/logs') {
      wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        wss.emit('connection', ws, request, url.searchParams);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, _request: Request, params: URLSearchParams) => {
    // Validate runId query parameter
    const rawRunId = params.get('runId');
    const parsed = LogSubscribeQuery.safeParse({ runId: rawRunId ?? '' });
    if (!parsed.success) {
      ws.close(4000, 'Invalid runId');
      return;
    }
    const { runId } = parsed.data;

    const c = getCore();
    if (!c) {
      ws.close(4001, 'No workspace');
      return;
    }
    const subscriptionId = `logs:${runId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const unsubscribe = c.logs.subscribe(runId, (entry) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ runId, entry }));
      }
    });
    addLogSubscription(subscriptionId, unsubscribe);
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'unsubscribe' && msg.subscriptionId === subscriptionId) {
          removeLogSubscription(subscriptionId);
        }
      } catch {
        // ignore malformed messages
      }
    });
    ws.on('close', () => {
      removeLogSubscription(subscriptionId);
    });
    ws.send(JSON.stringify({ type: 'subscribed', subscriptionId }));
  });
}
