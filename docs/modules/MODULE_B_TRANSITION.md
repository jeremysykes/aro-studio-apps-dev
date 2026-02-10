# Transition: Model A (Multi-Variant) to Model B (Dashboard)

This document describes what would be required to move from Multi-Variant (one module per app) to Dashboard (single app with multiple contained modules). The transition should be clear and painless.

## What Stays the Same

- Core API and public surface
- Job registration pattern (modules call `core.jobs.register()`)
- Module-to-Core relationship (via Desktop; modules never touch Core directly)
- Module constraints (no DB access, no cross-module imports)

---

## Desktop Shell Changes

**Current (Model A):** Desktop hosts one module's UI; the module effectively owns the renderer content.

**Model B:** Desktop provides a shared layout:

- Sidebar or top navigation for module switching
- Main content area as a slot/region where the active module renders
- Possibly a persistent header or shell chrome

**Implementation:** Add a layout component in the renderer that renders the active module into a designated region. Module selection (tab, sidebar item) updates which module's UI is shown.

---

## Module Loading

**Current (Model A):** Desktop loads one module (build-time or config); that module registers jobs.

**Model B:** Desktop discovers and loads multiple modules:

- Scan `packages/modules/*` (or config-driven list)
- Load all enabled modules at startup
- Each module calls `core.jobs.register()`; job keys must be namespaced (e.g. `tokens:validate`, `figma:sync`)

**Implementation:** Replace single-module loader with a loop over enabled module list; call each module's init with Core.

---

## IPC and Namespacing

**Current (Model A):** One module; job keys like `hello` are fine. No `module.*` namespace needed.

**Model B:** Multiple modules require:

- **Job key namespacing:** Use `moduleKey:jobKey` (e.g. `tokens:validate`) to avoid collisions
- **Optional `module.*` namespace:** If modules need module-specific IPC (e.g. `module.tokens.getConfig`), add a `module` namespace to the preload API
- **Shared channels:** `job:run`, `runs:list`, etc. remain; `job:run` accepts the namespaced key

**Implementation:** Ensure MODULE_PUBLIC_API mandates namespaced job keys from the start (Model A readiness). Add `module.*` to preload when a module needs custom IPC.

---

## Enable/Disable

**Current (Model A):** Config or build selects which single module is active.

**Model B:** Per-user or per-workspace module list:

- Store enabled module keys (e.g. in electron-store or workspace config)
- On load, only init modules in the enabled list
- UI for toggling modules (settings, workspace preferences)

**Implementation:** Add `enabledModules: string[]` to config/store; filter module loading by this list.

---

## Module UI Contract

**Current (Model A):** Module provides the main app UI; Desktop loads it as the root.

**Model B:** Modules export components for composition:

- Each module exports a root component (e.g. `TokensModule`, `FigmaModule`)
- Desktop shell imports these and renders the selected one into the main region
- Alternatively: modules register routes (`/tokens`, `/figma`); shell uses React Router

**Implementation:** Define a module UI contract (e.g. `export default function TokensModule()`) and a registry; Desktop looks up and renders the active module's component.

---

## Migration Checklist

When transitioning from Model A to Model B:

1. Add Desktop layout/shell with navigation
2. Change module loading from single to multi
3. Ensure job keys are namespaced
4. Add enable/disable config and UI
5. Define and implement module UI contract
6. Add `module.*` IPC if needed

Core and existing modules require minimal changes if job keys are already namespaced and modules follow the constraints.
