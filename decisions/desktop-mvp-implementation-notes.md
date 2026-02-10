# Desktop MVP Implementation Notes

**Date:** 2025-02-09

## pnpm + Electron compatibility

Electron's main process `require('electron')` can resolve to the npm package's index.js (which exports a path string) instead of the Electron API when using pnpm's default node_modules layout. 

**Decision:** Add `.npmrc` with `shamefully-hoist=true` and `public-hoist-pattern[]=*electron*` so the Electron binary and module resolution work correctly.

## electron-store ESM

electron-store v10+ is ESM-only. The Desktop main process is compiled to CommonJS by tsc.

**Decision:** Use dynamic `import('electron-store')` in `state.ts` so the module loads asynchronously. Store initialization is deferred to first use via `getStore()`.

## Core tests + better-sqlite3 ABI

Desktop's `postinstall` runs `electron-rebuild`, which rebuilds better-sqlite3 for Electron's Node ABI (NODE_MODULE_VERSION 130). Core tests run with plain Node.js 22 (NODE_MODULE_VERSION 127), causing a mismatch.

**Decision:** Run Core tests with `ELECTRON_RUN_AS_NODE=1` and the Electron binary. This uses the same Node ABI as Desktop, so the single better-sqlite3 build works for both tests and app.
