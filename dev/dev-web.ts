import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

type Proc = ChildProcessWithoutNullStreams;

const DEV_STATE_DIR = path.join(process.cwd(), '.dev-state');
const PID_FILE = path.join(DEV_STATE_DIR, 'web-api.pid');

function isWindows(): boolean {
  return process.platform === 'win32';
}

/**
 * Kill a process tree by PID. Reuses the same logic as killTree.
 * Only kills processes we previously started (see PID file).
 */
async function killTreeByPid(pid: number): Promise<void> {
  if (isWindows()) {
    const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return new Promise((resolve) => {
      killer.on('close', () => resolve());
      killer.on('error', () => resolve());
    });
  }

  return new Promise((resolve) => {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      // ignore
    }
    const hardKillTimer = setTimeout(() => {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        // ignore
      }
      resolve();
    }, 1500);
  });
}

/**
 * Clean up a previous orchestrator run: if we have a PID file and that process
 * is still alive, kill its tree. Only manages processes we started.
 */
async function cleanupPreviousApiRun(): Promise<void> {
  if (!fs.existsSync(PID_FILE)) return;

  let pid: number;
  try {
    pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
  } catch {
    fs.unlinkSync(PID_FILE);
    return;
  }

  if (isNaN(pid) || pid <= 0) {
    fs.unlinkSync(PID_FILE);
    return;
  }

  try {
    process.kill(pid, 0);
  } catch {
    fs.unlinkSync(PID_FILE);
    return;
  }

  await killTreeByPid(pid);
  try {
    fs.unlinkSync(PID_FILE);
  } catch {
    // ignore
  }
}

function persistPid(pid: number): void {
  fs.mkdirSync(DEV_STATE_DIR, { recursive: true });
  fs.writeFileSync(PID_FILE, String(pid));
}

type SpawnSpec = {
  label: 'API' | 'VITE';
  command: string;
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

const READY_TOKEN = 'SERVER_READY';

/**
 * Prefix each line with a label and keep the original stream split (stdout/stderr).
 * Also allows readiness detection on the unprefixed line content.
 */
function attachLineLogging(
  proc: Proc,
  label: string,
  onStdoutLine?: (line: string) => void,
): void {
  const stdoutRL = readline.createInterface({ input: proc.stdout });
  const stderrRL = readline.createInterface({ input: proc.stderr });

  stdoutRL.on('line', (line) => {
    process.stdout.write(`[${label}] ${line}\n`);
    onStdoutLine?.(line);
  });

  stderrRL.on('line', (line) => {
    process.stderr.write(`[${label}] ${line}\n`);
  });

  proc.on('close', () => {
    stdoutRL.close();
    stderrRL.close();
  });
}

/**
 * Spawn a child process in its own process group on POSIX (deterministic kill).
 * On Windows, we rely on taskkill for tree termination.
 */
function spawnLabeled(spec: SpawnSpec): Proc {
  const proc = spawn(spec.command, spec.args, {
    cwd: spec.cwd,
    env: { ...process.env, ...spec.env },
    stdio: ['inherit', 'pipe', 'pipe'],
    // Detach on POSIX so we can kill the entire process group with -pid.
    detached: !isWindows(),
    windowsHide: true,
  });
  return proc as unknown as Proc;
}

async function killTree(proc: Proc, _label: string): Promise<void> {
  if (proc.killed) return;

  return new Promise((resolve) => {
    const pid = proc.pid;
    if (!pid) return resolve();

    if (isWindows()) {
      // /T = terminate child processes, /F = force
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      killer.on('close', () => resolve());
      killer.on('error', () => resolve());
      return;
    }

    try {
      // Kill the whole process group
      process.kill(-pid, 'SIGTERM');
    } catch {
      // ignore
    }

    // Escalate if it doesn't die quickly (no arbitrary long waits; small grace only)
    const hardKillTimer = setTimeout(() => {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        // ignore
      }
      resolve();
    }, 1500);

    proc.once('exit', () => {
      clearTimeout(hardKillTimer);
      resolve();
    });
  });
}

function once<T extends (...args: any[]) => void>(fn: T): T {
  let called = false;
  return ((...args: any[]) => {
    if (called) return;
    called = true;
    fn(...args);
  }) as T;
}

async function main(): Promise<void> {
  await cleanupPreviousApiRun();

  // Track both so we can always clean up.
  let api: Proc | null = null;
  let vite: Proc | null = null;

  const shutdown = once(async (reason: string, code = 0) => {
    process.stderr.write(`\n[DEV] shutdown: ${reason}\n`);

    // Kill Vite first (it tends to keep terminals noisy), then API.
    if (vite) await killTree(vite, 'VITE');
    if (api) await killTree(api, 'API');

    process.exit(code);
  });

  // Ensure we tear down on common signals
  process.on('SIGINT', () => void shutdown('SIGINT', 130));
  process.on('SIGTERM', () => void shutdown('SIGTERM', 143));
  process.on('uncaughtException', (err) => {
    process.stderr.write(
      `[DEV] uncaughtException: ${String(err?.stack || err)}\n`,
    );
    void shutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', (err) => {
    process.stderr.write(`[DEV] unhandledRejection: ${String(err)}\n`);
    void shutdown('unhandledRejection', 1);
  });

  // --- Start API ---
  api = spawnLabeled({
    label: 'API',
    command: 'pnpm',
    args: ['--filter', '@aro/web', 'run', 'dev:server'],
  });
  if (api.pid) persistPid(api.pid);

  let apiReady = false;

  attachLineLogging(api, 'API', (line) => {
    if (!apiReady && line.includes(READY_TOKEN)) {
      apiReady = true;
      startVite();
    }
  });

  api.on('exit', (code, signal) => {
    // If API dies, the dev environment is invalid. Shut down everything.
    const msg = `API exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`;
    void shutdown(msg, code ?? 1);
  });

  function startVite(): void {
    if (vite) return;

    vite = spawnLabeled({
      label: 'VITE',
      // using pnpm exec ensures the right workspace context and local Vite
      command: 'pnpm',
      args: ['--filter', '@aro/web', 'exec', 'vite'],
    });

    attachLineLogging(vite, 'VITE');

    vite.on('exit', (code, signal) => {
      // If Vite dies, you still likely want to stop the whole dev stack.
      const msg = `Vite exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`;
      void shutdown(msg, code ?? 1);
    });
  }

  process.stdout.write('[DEV] waiting for API readiness...\n');
}

void main();
