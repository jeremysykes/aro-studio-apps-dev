import { Router } from 'express';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
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

  router.post('/job/run', (req, res) => {
    const { jobKey, input, traceId } = req.body as { jobKey: string; input?: unknown; traceId?: string };
    const c = requireCore();
    const { runId } = c.jobs.run(jobKey, input, traceId ? { traceId } : undefined);
    res.json({ runId });
  });

  router.post('/job/cancel', (req, res) => {
    const { runId } = req.body as { runId: string };
    requireCore().jobs.cancel(runId);
    res.status(204).send();
  });

  router.get('/runs', (_req, res) => {
    const runs = requireCore().runs.listRuns();
    res.json(runs);
  });

  router.get('/runs/:runId', (req, res) => {
    const run = requireCore().runs.getRun(req.params.runId);
    if (!run) {
      res.status(404).json(null);
      return;
    }
    res.json(run);
  });

  router.get('/logs/:runId', (req, res) => {
    const logs = requireCore().logs.listLogs(req.params.runId);
    res.json(logs);
  });

  router.get('/artifacts/:runId', (req, res) => {
    const pathParam = req.query.path;
    if (typeof pathParam === 'string') {
      const content = requireCore().workspace.readText(`.aro/artifacts/${req.params.runId}/${pathParam}`);
      res.type('text/plain').send(content);
      return;
    }
    const artifacts = requireCore().artifacts.listArtifacts(req.params.runId);
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
    const runId = params.get('runId');
    if (!runId) {
      ws.close(4000, 'runId required');
      return;
    }
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
        // ignore
      }
    });
    ws.on('close', () => {
      removeLogSubscription(subscriptionId);
    });
    ws.send(JSON.stringify({ type: 'subscribed', subscriptionId }));
  });
}
