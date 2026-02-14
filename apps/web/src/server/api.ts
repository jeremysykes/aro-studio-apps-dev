import { Router, type Request, type Response, type NextFunction } from 'express';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import type { ZodType } from 'zod';
import {
  JobRunPayload,
  JobCancelPayload,
  RunIdParam,
  ArtifactReadParams,
  LogSubscribeQuery,
} from '@aro/types';
import {
  getCore,
  getCurrentWorkspacePath,
  getRegisteredJobKeys,
  addLogSubscription,
  removeLogSubscription,
} from './state.js';
import { getUIModel, getEnabledModuleKeys, getResolvedConfig } from './moduleRegistry.js';

const NO_WORKSPACE = 'No workspace selected';

function requireCore() {
  const c = getCore();
  if (!c) throw new Error(NO_WORKSPACE);
  return c;
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
    const path = getCurrentWorkspacePath();
    res.json(path ? { path } : null);
  });

  router.get('/app/tenant-config', (_req, res) => {
    res.json(getResolvedConfig());
  });

  router.get('/app/ui-model', (_req, res) => {
    res.json({ model: getUIModel() });
  });

  router.get('/app/enabled-modules', (_req, res) => {
    const keys = getEnabledModuleKeys();
    // Standalone mode only exposes the first module
    res.json(getUIModel() === 'standalone' ? keys.slice(0, 1) : keys);
  });

  router.get('/job/registered', (_req, res) => {
    requireCore();
    res.json(getRegisteredJobKeys());
  });

  router.post('/job/run', validateBody(JobRunPayload), (req, res) => {
    const { jobKey, input, traceId } = req.body as JobRunPayload;
    const c = requireCore();
    const { runId } = c.jobs.run(jobKey, input, traceId ? { traceId } : undefined);
    res.json({ runId });
  });

  router.post('/job/cancel', validateBody(JobCancelPayload), (req, res) => {
    const { runId } = req.body as JobCancelPayload;
    requireCore().jobs.cancel(runId);
    res.status(204).send();
  });

  router.get('/runs', (_req, res) => {
    const runs = requireCore().runs.listRuns();
    res.json(runs);
  });

  router.get('/runs/:runId', (req, res) => {
    const runId = parseParam(res, RunIdParam, req.params.runId);
    if (!runId) return;
    const run = requireCore().runs.getRun(runId);
    if (!run) {
      res.status(404).json(null);
      return;
    }
    res.json(run);
  });

  router.get('/logs/:runId', (req, res) => {
    const runId = parseParam(res, RunIdParam, req.params.runId);
    if (!runId) return;
    const logs = requireCore().logs.listLogs(runId);
    res.json(logs);
  });

  router.get('/artifacts/:runId', (req, res) => {
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
      const content = requireCore().workspace.readText(`.aro/artifacts/${params.data.runId}/${params.data.path}`);
      res.type('text/plain').send(content);
      return;
    }
    const artifacts = requireCore().artifacts.listArtifacts(runId);
    res.json(artifacts);
  });

  return router;
}

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
