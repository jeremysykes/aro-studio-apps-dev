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
    path: r.path,
    createdAt: r.created_at,
  };
}

export interface WriteArtifactParams {
  runId: string;
  path: string;
  content: string;
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
        path: params.path,
        created_at: createdAt,
      });
      return { id, runId: params.runId, path: params.path, createdAt };
    },

    listArtifacts(runId: string): Artifact[] {
      return stmt.artifactListByRunId(db, runId).map(rowToArtifact);
    },
  };
}

export type ArtifactsService = ReturnType<typeof createArtifactsService>;
