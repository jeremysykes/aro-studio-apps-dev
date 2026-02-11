import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');
const tscBin = path.join(appDir, 'node_modules', '.bin', 'tsc');

/**
 * Spawn tsc -w and call onCompileDone(success) when a compile cycle completes.
 * Completion is detected by "Watching for file changes." on stdout.
 * Success is determined by "Found 0 errors." in the same buffer.
 * No timeouts or polling.
 */
export function watchTSC(onCompileDone) {
  const tsc = spawn(
    tscBin,
    ['-p', 'tsconfig.server.json', '-w', '--pretty', 'false'],
    {
      cwd: appDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let buffer = '';

  tsc.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);
    buffer += text;

    if (buffer.includes('Watching for file changes.')) {
      const success = buffer.includes('Found 0 errors.');
      onCompileDone(success);
      buffer = '';
    }
  });

  tsc.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  return tsc;
}
