# Module Model A (Standalone) for MVP

**Date:** 2025-02-09
**Title:** Module Model A (Standalone) for MVP

## Summary

Start with Model A: one module per app; module owns the UI; build/config selects the active module. Model B (Sidebar) and Model C (Dashboard) are documented for future transition.

## Three Models

- **Model A (Standalone):** One module per app. Current MVP implementation.
- **Model B (Sidebar):** One app, sidebar switches between full module views. One module visible at a time.
- **Model C (Dashboard):** One app, multiple module widgets visible simultaneously as tiles. Sidebar still available for full views.

Each model builds on the previous. See [docs/modules/MODULE_MODELS.md](../docs/modules/MODULE_MODELS.md) for the full comparison table.

## Rationale for Starting with Model A

- Aligns with "different applications" vision (e.g. "Aro Studio Tokens", "Aro Studio Figma")
- Simpler first implementation
- Clear incremental path to Model B and then Model C
- See [docs/modules/MODULE_TRANSITION.md](../docs/modules/MODULE_TRANSITION.md) for the transition roadmap

## Future Progression

Model A to B is a Desktop shell change (add sidebar, multi-module loading, IPC namespacing). Module code requires minimal modification.

Model B to C adds a dashboard grid view and requires modules to export a second `Widget` component. The sidebar and full module views from Model B remain unchanged.
