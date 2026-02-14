import { createHash } from 'node:crypto';

/** Return a 16-hex-char SHA-256 prefix for a job input value. */
export function stableInputHash(input: unknown): string {
  const serialized = input === undefined ? '' : JSON.stringify(input);
  return createHash('sha256').update(serialized).digest('hex').slice(0, 16);
}
