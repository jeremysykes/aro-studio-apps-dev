export interface Run {
  id: string;
  status: string;
  startedAt: number;
  finishedAt: number | null;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  runId: string;
  level: string;
  message: string;
  createdAt: number;
}

export interface Artifact {
  id: string;
  runId: string;
  path: string;
  createdAt: number;
}
