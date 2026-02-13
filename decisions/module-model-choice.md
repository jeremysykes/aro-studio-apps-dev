# Standalone Model for MVP

**Date:** 2025-02-09
**Title:** Standalone Model for MVP

## Summary

Start with the Standalone Model: one module per app; module owns the UI; build/config selects the active module. Sidebar and Dashboard models are documented for future transition.

## Three Models

- **Standalone:** One module per app. Current MVP implementation.
- **Sidebar:** One app, sidebar switches between full module views. One module visible at a time.
- **Dashboard:** One app, multiple module widgets visible simultaneously as tiles. Sidebar still available for full views.

Each model builds on the previous. See [docs/modules/MODULE_MODELS.md](../docs/modules/MODULE_MODELS.md) for the full comparison table.

## Rationale for Starting with Standalone

- Aligns with "different applications" vision (e.g. "Aro Studio Tokens", "Aro Studio Figma")
- Simpler first implementation
- Clear incremental path to Sidebar and then Dashboard
- See [docs/modules/MODULE_TRANSITION.md](../docs/modules/MODULE_TRANSITION.md) for the transition roadmap

## Future Progression

Standalone to Sidebar is a Desktop shell change (add sidebar, multi-module loading, IPC namespacing). Module code requires minimal modification.

Sidebar to Dashboard adds a dashboard grid view and requires modules to export a second `Widget` component. The sidebar and full module views from the Sidebar Model remain unchanged.
