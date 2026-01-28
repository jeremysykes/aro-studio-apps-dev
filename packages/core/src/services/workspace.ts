import { resolve } from 'node:path';
import { resolveWithinWorkspace } from '../infra/paths.js';
import {
  readTextSync,
  writeTextSync,
  existsSyncCheck,
  mkdirp as fsMkdirp,
} from '../infra/fs.js';

export function createWorkspaceService(workspaceRoot: string) {
  const aroDir = resolve(workspaceRoot, '.aro');

  return {
    initWorkspace(): void {
      fsMkdirp(aroDir);
    },

    resolve(relPath: string): string {
      return resolveWithinWorkspace(workspaceRoot, relPath);
    },

    readText(relPath: string): string {
      const abs = resolveWithinWorkspace(workspaceRoot, relPath);
      return readTextSync(abs);
    },

    writeText(relPath: string, content: string): void {
      const abs = resolveWithinWorkspace(workspaceRoot, relPath);
      writeTextSync(abs, content);
    },

    exists(relPath: string): boolean {
      const abs = resolveWithinWorkspace(workspaceRoot, relPath);
      return existsSyncCheck(abs);
    },

    mkdirp(relDir: string): void {
      const abs = resolveWithinWorkspace(workspaceRoot, relDir);
      fsMkdirp(abs);
    },
  };
}

export type WorkspaceService = ReturnType<typeof createWorkspaceService>;
