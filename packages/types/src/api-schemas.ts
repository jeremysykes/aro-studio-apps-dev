/**
 * Zod schemas for IPC/API payload validation.
 *
 * Applied at the boundary in both desktop (ipc.ts) and web (api.ts) hosts.
 * Every inbound payload that carries user-supplied data is validated here
 * before reaching Core.
 */
import { z } from 'zod';

// ─── Reusable primitives ─────────────────────────────────────────────────────

/** Non-empty string parameter (e.g. runId, subscriptionId). */
export const RunIdParam = z.string().min(1, 'runId is required');

/**
 * Safe relative path — rejects path traversal and absolute paths.
 * Used by artifacts:read to prevent directory escape.
 */
export const SafeRelativePath = z.string().min(1, 'path is required')
  .refine((p) => !p.includes('..'), { message: 'Path traversal (..) not allowed' })
  .refine((p) => !p.startsWith('/'), { message: 'Absolute paths not allowed' });

// ─── Endpoint payloads ───────────────────────────────────────────────────────

/** job:run / POST /job/run */
export const JobRunPayload = z.object({
  jobKey: z.string().min(1, 'jobKey is required'),
  input: z.unknown().optional(),
  traceId: z.string().optional(),
});
export type JobRunPayload = z.infer<typeof JobRunPayload>;

/** job:cancel / POST /job/cancel */
export const JobCancelPayload = z.object({
  runId: RunIdParam,
});
export type JobCancelPayload = z.infer<typeof JobCancelPayload>;

/** artifacts:read — validates both runId and path */
export const ArtifactReadParams = z.object({
  runId: RunIdParam,
  path: SafeRelativePath,
});
export type ArtifactReadParams = z.infer<typeof ArtifactReadParams>;

/** WebSocket /ws/logs — query string validation */
export const LogSubscribeQuery = z.object({
  runId: RunIdParam,
});
export type LogSubscribeQuery = z.infer<typeof LogSubscribeQuery>;

/** POST /api/workspace/select — set workspace to an absolute path */
export const WorkspaceSelectPayload = z.object({
  path: z.string().min(1, 'path is required'),
});
export type WorkspaceSelectPayload = z.infer<typeof WorkspaceSelectPayload>;

/** GET /api/filesystem/browse — browse directories on the server */
export const FileSystemBrowseQuery = z.object({
  path: z.string().min(1).optional(),
});
export type FileSystemBrowseQuery = z.infer<typeof FileSystemBrowseQuery>;
