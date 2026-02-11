import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { watchTSC } from './watch-tsc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');

const serverCommand =
  'ELECTRON_RUN_AS_NODE=1 electron dist/server/index.js';

let nodemonStarted = false;

watchTSC((success) => {
  if (!nodemonStarted) {
    nodemonStarted = true;
    const nodemon = spawn(
      'npx',
      [
        'nodemon',
        '--watch', 'dist/server',
        '-e', 'js',
        '-x', serverCommand,
      ],
      {
        cwd: appDir,
        stdio: 'inherit',
        shell: true,
      }
    );
    nodemon.on('error', (err) => {
      console.error(err);
      process.exit(1);
    });
  }
});
