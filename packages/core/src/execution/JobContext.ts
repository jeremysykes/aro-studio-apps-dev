import type {
  JobContext as JobContextType,
  RunLogger,
  WorkspaceFacet,
  ArtifactWriter,
} from '../types.js';

export function createJobContext(
  runId: string,
  logger: RunLogger,
  workspace: WorkspaceFacet,
  artifactWriter: ArtifactWriter,
  abort: AbortSignal,
  progress?: (value: number | { current: number; total: number }) => void
): JobContextType {
  return {
    logger,
    workspace,
    artifactWriter,
    abort,
    progress: progress ?? (() => {}),
  };
}
