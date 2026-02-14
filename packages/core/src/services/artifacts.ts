import { resolve } from 'node:path';
import type { Db } from '../infra/db/schema.js';
import * as stmt from '../infra/db/statements.js';
import { createId } from '../kernel/ids.js';
import { writeTextSync } from '../infra/fs.js';
import type { Artifact } from '../types.js';

function rowToArtifact(r: stmt.ArtifactRow): Artifact {
  return {
    id: r.id,
    runId: r.run_id,
    traceId: r.trace_id,
    path: r.path,
    jobKey: r.job_key,
    inputHash: r.input_hash,
    createdAt: r.created_at,
  };
}

export interface WriteArtifactParams {
  runId: string;
  traceId: string;
  path: string;
  content: string;
  jobKey: string;
  inputHash: string;
}

export function createArtifactsService(db: Db, workspaceRoot: string) {
  const artifactsDir = resolve(workspaceRoot, '.aro', 'artifacts');

  return {
    writeArtifact(params: WriteArtifactParams): Artifact {
      const id = createId();
      const createdAt = Date.now();
      const relPath = `${params.runId}/${params.path}`;
      const absPath = resolve(artifactsDir, relPath);
      writeTextSync(absPath, params.content);
      stmt.artifactInsert(db, {
        id,
        run_id: params.runId,
        trace_id: params.traceId,
        path: params.path,
        job_key: params.jobKey,
        input_hash: params.inputHash,
        created_at: createdAt,
      });
      return {
        id,
        runId: params.runId,
        traceId: params.traceId,
        path: params.path,
        jobKey: params.jobKey,
        inputHash: params.inputHash,
        createdAt,
      };
    },

    listArtifacts(runId: string): Artifact[] {
      return stmt.artifactListByRunId(db, runId).map(rowToArtifact);
    },
  };
}

export type ArtifactsService = ReturnType<typeof createArtifactsService>;
