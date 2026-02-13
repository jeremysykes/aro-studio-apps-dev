# Active Module Single-Switch

**Date:** 2025-02-10  
**Title:** Single configuration for active module selection

## Summary

Desktop implements a **single-switch** so that which module is loaded (main process init and renderer root UI) is controlled by one configuration. No editing of multiple files (e.g. `moduleLoader.ts` and `App.tsx`) to switch modules.

## Rationale

- One place to change when switching between hello-world, inspect, or future modules
- Adding a new module = add package + one registry entry; no scattered import edits
- Aligns with the Standalone Model: "build or config selects which module is loaded" ([MODULE_ARCHITECTURE.md](../docs/modules/MODULE_ARCHITECTURE.md))

## Implementation (Phase 3)

- **Source of truth:** Environment variable `ARO_ACTIVE_MODULE`; default `hello-world` when unset. Developers can use **`.env`** at the project root for development (see [docs/desktop/ACTIVE_MODULE_SWITCH.md](../docs/desktop/ACTIVE_MODULE_SWITCH.md)).
- **Module registry:** One registry in Desktop mapping each module key to (1) `init(core)` for main process, (2) root UI component for renderer. Both main and renderer resolve the active module from this single registry (or a renderer-visible mirror driven by the same key).
- **Documentation:** README or docs/desktop describes how to set the switch and how to add a new module (package + registry registration).

## References

- [docs/modules/MODULE_ARCHITECTURE.md](../docs/modules/MODULE_ARCHITECTURE.md) — Standalone Model, job registration flow
- [decisions/module-model-choice.md](module-model-choice.md) — Standalone Model for MVP
