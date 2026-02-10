# Module Models: Model A vs Model B

This document defines two architectural models for how Modules integrate with Core and Desktop. The summary table is the preserved reference artifact.

## Summary Table

| Aspect | Model A (Multi-Variant) | Model B (Dashboard) |
|--------|-------------------------|---------------------|
| Module = ? | Application (owns main content) | Feature panel / tab |
| UI ownership | Module owns main content | Desktop shell + module regions |
| Multiple modules at once? | No | Yes |
| Enable/disable | Build/config only | Per-user or per-workspace |
| IPC namespacing | Not needed (one module) | Required for multiple modules |
| Use case | "Aro Studio Tokens", "Aro Studio Figma" | Single "Aro Studio" with many features |

---

## Model A (Multi-Variant)

**Description:** One module per application. The active module effectively is the application. Core + Desktop are shared infrastructure; the module owns the main UI and user experience. Each shipped product is a distinct app (e.g. "Aro Studio Tokens", "Aro Studio Figma").

**When to use:**
- Different applications packaged from the same platform
- Each app has a focused, domain-specific experience
- Simpler first implementation; one module, full control of UI

---

## Model B (Dashboard)

**Description:** One "Aro Studio" app that loads multiple modules. Desktop provides a shared shell (layout, sidebar, navigation). Modules are contained as panels, tabs, or regions within the shell. Multiple modules can be active; enable/disable per user or per workspace.

**When to use:**
- Single product with many integrated features
- Users need to switch between domains within one app
- Per-user or per-workspace module permissions

---

## Transition Path

Moving from Model A (Multi-Variant) to Model B (Dashboard) is documented in [MODULE_B_TRANSITION.md](MODULE_B_TRANSITION.md). The transition should be clear and painless; Core and the module-to-Core relationship remain the same.
