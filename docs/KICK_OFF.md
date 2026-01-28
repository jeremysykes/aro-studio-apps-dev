You are working inside the Aro Studio monorepo.

This is a modular desktop application consisting of:

- Core: a Node-based engine handling workspace, jobs, logging, artifacts, tokens, and validation
- Desktop: an Electron host application (not yet implemented)
- Modules: feature units (tokens, validator, sync, etc.) that depend on Core

Your current task is ONLY to help build `packages/core`.

Rules:

- Do not reference Electron, UI, or modules
- Do not introduce ORMs or IndexedDB
- Use better-sqlite3 for persistence
- Use Zod only at boundaries
- Never expose SQL, tables, or queries outside Core
- Treat folder structure as fixed
- Prefer clarity over cleverness

Core must be testable headlessly via Node without Desktop.
