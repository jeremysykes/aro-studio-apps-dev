import path from 'path';
import { config as loadDotenv } from 'dotenv';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { createCore } from '@aro/core';
import { createServer as createHttpServer } from 'http';
import { initCore, shutdownCore } from './state.js';
import { loadActiveModule } from './moduleLoader.js';
import { createApiRouter, attachLogWebSocket } from './api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../../');
loadDotenv({ path: path.join(projectRoot, '.env') });

const workspaceRoot = process.env.ARO_WORKSPACE_ROOT || projectRoot;
const core = initCore(workspaceRoot, createCore);
loadActiveModule(core);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', createApiRouter());

if (process.env.NODE_ENV !== 'production') {
  app.get('/', (_req, res) => {
    res.status(200).type('html').send(`
<!DOCTYPE html>
<html>
<head><title>Aro Studio API</title></head>
<body>
  <p>This is the API server. Open the URL Vite prints (e.g. <a href="http://localhost:5173">http://localhost:5173</a>; port may be 5174 if 5173 is in use) for the web app.</p>
  <p>Vite proxies <code>/api</code> and <code>/ws</code> to this server.</p>
</body>
</html>`);
  });
}

const server = createHttpServer(app);
attachLogWebSocket(server);

const PORT = parseInt(process.env.PORT ?? '3001', 10);

if (process.env.NODE_ENV === 'production') {
  const clientDir = path.join(__dirname, '../client');
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`Web API server running at http://localhost:${PORT}`);
  console.log('SERVER_READY');
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Vite client: run "pnpm --filter @aro/web exec vite" in another terminal`);
    console.log(`Then open the URL Vite prints (e.g. http://localhost:5173)`);
  }
});

process.on('SIGINT', () => {
  shutdownCore();
  server.close();
  process.exit(0);
});
