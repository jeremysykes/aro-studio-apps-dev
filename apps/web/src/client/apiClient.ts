import type { Run, LogEntry, Artifact } from '@aro/types';

const API_BASE = '';

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

function getWsUrl(path: string): string {
  if (typeof location === 'undefined') return `ws://localhost:5173${path}`;
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${location.host}${path}`;
}

export function createAroApiClient() {
  return {
    getUIModel: () =>
      fetchJson<{ model: 'standalone' | 'sidebar' | 'dashboard' | 'tabs' | 'carousel' }>('/api/app/ui-model').then(
        (r) => r.model,
      ),
    getEnabledModules: () => fetchJson<string[]>('/api/app/enabled-modules'),
    workspace: {
      select: () => Promise.resolve(null as { path: string } | null),
      getCurrent: () => fetchJson<{ path: string } | null>('/api/workspace/current'),
      onChanged: (callback: (data: { path: string } | null) => void) => {
        return () => {};
      },
    },
    job: {
      run: (jobKey: string, input?: unknown) =>
        fetchJson<{ runId: string }>('/api/job/run', {
          method: 'POST',
          body: JSON.stringify({ jobKey, input }),
        }).then((r) => r),
      cancel: (runId: string) =>
        fetch('/api/job/cancel', {
          method: 'POST',
          body: JSON.stringify({ runId }),
        }).then(() => {}),
      listRegistered: () => fetchJson<string[]>('/api/job/registered'),
    },
    runs: {
      list: () => fetchJson<Run[]>('/api/runs'),
      get: (runId: string) => fetchJson<Run | null>(`/api/runs/${runId}`),
    },
    logs: {
      list: (runId: string) => fetchJson<LogEntry[]>(`/api/logs/${runId}`),
      subscribe: (runId: string, callback: (entry: LogEntry) => void) => {
        const wsUrl = getWsUrl(`/ws/logs?runId=${encodeURIComponent(runId)}`);
        const ws = new WebSocket(wsUrl);
        let subscriptionId: string | null = null;
        ws.onmessage = (e) => {
          const data = JSON.parse(e.data as string);
          if (data.type === 'subscribed') {
            subscriptionId = data.subscriptionId;
          } else if (data.runId && data.entry) {
            callback(data.entry);
          }
        };
        return Promise.resolve(() => {
          if (subscriptionId && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'unsubscribe', subscriptionId }));
          }
          ws.close();
        });
      },
    },
    artifacts: {
      list: (runId: string) => fetchJson<Artifact[]>(`/api/artifacts/${runId}`),
      read: (runId: string, path: string) =>
        fetch(`${API_BASE}/api/artifacts/${runId}?path=${encodeURIComponent(path)}`).then((r) =>
          r.ok ? r.text() : Promise.reject(new Error(r.statusText))
        ),
    },
  };
}
