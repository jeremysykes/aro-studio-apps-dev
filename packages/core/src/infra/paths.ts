import { resolve, relative } from 'node:path';
import { PathTraversalError } from '../kernel/errors.js';

export function resolveWithinWorkspace(workspaceRoot: string, relPath: string): string {
  if (relPath.includes('..')) {
    throw new PathTraversalError(relPath);
  }
  const absolute = resolve(workspaceRoot, relPath);
  const rel = relative(workspaceRoot, absolute);
  if (rel.startsWith('..') || rel === '..') {
    throw new PathTraversalError(relPath);
  }
  return absolute;
}
