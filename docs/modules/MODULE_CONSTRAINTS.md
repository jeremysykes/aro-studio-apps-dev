# Module Constraints: Implementation Details

This document details how to implement and verify each module constraint. Modules must not break the Core/Desktop/Module communication contract.

---

## Constraint 1: Modules must not import each other

**Rule:** Modules MUST NOT import other modules.

**Implementation:**

- Each module lives in `packages/modules/<module-name>`.
- Module `package.json` must not list other modules as dependencies.
- Tsconfig or build tooling must not resolve imports from other modules.
- Consider: lint rule (e.g. eslint-plugin-import) that forbids `@aro/module-*` imports within `packages/modules/*`.

**Verification:**

- Run `pnpm why <package>` from a module; it must not depend on other modules.
- CI step: dependency graph check or lint that fails if a module imports another module.

---

## Constraint 2: Modules must not access the database directly

**Rule:** Modules must never access SQLite or Core internals.

**Implementation:**

- Modules never import `@aro/core` internals (e.g. `infra/db`, `schema`, `statements`).
- Modules never import `better-sqlite3`.
- Modules only interact with Core via the public API (e.g. job context's workspace facet, or via Desktop's IPC).
- Job definitions receive `ctx` (JobContext) with `workspace`, `logger`, `artifactWriter`, `abort`; no DB access.

**Verification:**

- No `better-sqlite3`, `infra/db`, or Core internal paths in module imports.
- Code review checklist: confirm modules use only documented APIs.

---

## Constraint 3: Modules must not access the filesystem directly outside Core workspace APIs

**Rule:** Modules must not use `fs` or `path` for domain data; only via Core workspace APIs.

**Implementation:**

- Inside job definitions, use `ctx.workspace` (resolve, readText, writeText, exists, mkdirp).
- Modules must not import `node:fs` or `node:path` for workspace file operations.
- Renderer code has no filesystem access (no Node integration).

**Verification:**

- Grep/lint: forbid `fs`, `path` for domain files in module code.
- Domain operations must go through job context's workspace facet.

---

## Constraint 4: Modules must not break the Core/Desktop/Module communication contract

**Rule:** Modules use only Desktop-exposed IPC; no custom IPC unless documented.

**Implementation:**

- Module renderer code uses `window.aro` only (workspace, job, runs, logs, artifacts).
- Modules do not receive Core handles in the renderer.
- No `nodeIntegration`; no direct Node/Electron imports in renderer.
- Custom IPC (if needed for Model B) must be documented in MODULE_PUBLIC_API.md.

**Verification:**

- Preload exposes only the documented API.
- Module renderer bundles must not include Core or Node-specific code.

---

## Constraint 5: Module dependencies

**Rule:** New module dependencies require justification in docs.

**Implementation:**

- Each module has its own `package.json`.
- When adding a dependency to a module, update [meta/DEPENDENCIES.md](../meta/DEPENDENCIES.md) (or a module-specific section) with: name, reason, what it replaces.
- Per [meta/DOCUMENTATION.md](../meta/DOCUMENTATION.md), dependencies are justified before addition.

**Verification:**

- PR check: if `packages/modules/*/package.json` changes, [meta/DEPENDENCIES.md](../meta/DEPENDENCIES.md) must include the new dep with justification.
