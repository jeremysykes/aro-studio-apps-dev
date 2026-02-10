import { useState, useEffect, useCallback } from 'react';
import type { Run, LogEntry, Artifact } from '../shared/types';

function App() {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [artifactContent, setArtifactContent] = useState<string | null>(null);
  const [runningRunId, setRunningRunId] = useState<string | null>(null);
  const [jobKeys, setJobKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    try {
      const current = await window.aro.workspace.getCurrent();
      setWorkspacePath(current?.path ?? null);
    } catch {
      setWorkspacePath(null);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
    const unsub = window.aro.workspace.onChanged((data) => {
      setWorkspacePath(data?.path ?? null);
    });
    return unsub;
  }, [loadWorkspace]);

  const handleSelectWorkspace = async () => {
    setError(null);
    try {
      const result = await window.aro.workspace.select();
      if (result) {
        setWorkspacePath(result.path);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to select workspace');
    }
  };

  const loadRuns = useCallback(async () => {
    if (!workspacePath) return;
    try {
      const list = await window.aro.runs.list();
      setRuns(list);
    } catch {
      setRuns([]);
    }
  }, [workspacePath]);

  useEffect(() => {
    loadRuns();
    const id = setInterval(loadRuns, 2000);
    return () => clearInterval(id);
  }, [loadRuns]);

  useEffect(() => {
    if (!workspacePath) {
      setJobKeys([]);
      return;
    }
    window.aro.job.listRegistered().then(setJobKeys).catch(() => setJobKeys([]));
  }, [workspacePath]);

  const handleRunJob = async (jobKey: string) => {
    setError(null);
    try {
      const { runId } = await window.aro.job.run(jobKey);
      setRunningRunId(runId);
      setSelectedRunId(runId);
      loadRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run job');
    }
  };

  const handleCancelJob = async (runId: string) => {
    setError(null);
    try {
      await window.aro.job.cancel(runId);
      setRunningRunId(null);
      loadRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel job');
    }
  };

  useEffect(() => {
    if (!selectedRunId) {
      setLogs([]);
      setArtifacts([]);
      setArtifactContent(null);
      return;
    }

    let unsubLogs: (() => void) | null = null;

    const load = async () => {
      try {
        const [logList, artifactList] = await Promise.all([
          window.aro.logs.list(selectedRunId),
          window.aro.artifacts.list(selectedRunId),
        ]);
        setLogs(logList);
        setArtifacts(artifactList);

        unsubLogs = await window.aro.logs.subscribe(selectedRunId, (entry) => {
          setLogs((prev) => [...prev, entry]);
        });
      } catch {
        setLogs([]);
        setArtifacts([]);
      }
    };

    load();
    return () => {
      unsubLogs?.();
    };
  }, [selectedRunId]);

  useEffect(() => {
    const run = runs.find((r) => r.id === runningRunId);
    if (run && run.status !== 'running') {
      setRunningRunId(null);
    }
  }, [runs, runningRunId]);

  const handleSelectArtifact = async (artifact: Artifact) => {
    if (!selectedRunId) return;
    try {
      const content = await window.aro.artifacts.read(selectedRunId, artifact.path);
      setArtifactContent(content);
    } catch {
      setArtifactContent('Failed to read artifact');
    }
  };

  return (
    <main style={{ padding: 16, fontFamily: 'system-ui' }}>
      <h1>Aro Studio</h1>

      <section>
        <h2>Workspace</h2>
        {!workspacePath ? (
          <button type="button" onClick={handleSelectWorkspace}>
            Select workspace
          </button>
        ) : (
          <div>
            <p>
              <strong>Path:</strong> {workspacePath}
            </p>
            <button type="button" onClick={handleSelectWorkspace}>
              Change workspace
            </button>
          </div>
        )}
      </section>

      {error && (
        <p role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {workspacePath && (
        <>
          <section>
            <h2>Jobs</h2>
            <ul>
              {jobKeys.map((key) => (
                <li key={key}>
                  <button type="button" onClick={() => handleRunJob(key)}>
                    Run {key}
                  </button>
                  {runningRunId && (
                    <button
                      type="button"
                      onClick={() => handleCancelJob(runningRunId)}
                      style={{ marginLeft: 8 }}
                    >
                      Cancel
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Runs</h2>
            <ul>
              {runs.map((run) => (
                <li key={run.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRunId(run.id)}
                    style={{
                      fontWeight: selectedRunId === run.id ? 'bold' : 'normal',
                    }}
                  >
                    {run.id.slice(0, 8)} - {run.status} -{' '}
                    {new Date(run.startedAt).toISOString()}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {selectedRunId && (
            <>
              <section>
                <h2>Logs</h2>
                <ul>
                  {logs.map((entry) => (
                    <li key={entry.id}>
                      [{entry.level}] {entry.message}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2>Artifacts</h2>
                <ul>
                  {artifacts.map((artifact) => (
                    <li key={artifact.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectArtifact(artifact)}
                      >
                        {artifact.path}
                      </button>
                    </li>
                  ))}
                </ul>
                {artifactContent !== null && (
                  <pre style={{ background: '#f4f4f4', padding: 8 }}>
                    {artifactContent}
                  </pre>
                )}
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}

export default App;
