# Module Model Transitions

This document describes what is required to move between module models. Each transition is incremental; later models build on earlier ones.

See [MODULE_MODELS.md](MODULE_MODELS.md) for the full comparison table of all three models.

---

## Transition: Standalone to Sidebar

### What Stays the Same

- Core API and public surface
- Job registration pattern (modules call `core.jobs.register()`)
- Module-to-Core relationship (via Desktop; modules never touch Core directly)
- Module constraints (no DB access, no cross-module imports)
- Module UI contract (root component, no props)

### Desktop Shell Changes

**Current (Standalone):** Desktop hosts one module's UI; the module effectively owns the renderer content.

**Sidebar:** Desktop provides a shared layout:

- Sidebar or top navigation for module switching
- Main content area as a slot/region where the active module renders
- Persistent header or shell chrome (app title, workspace selector, settings)

**Implementation:** Add a layout component in the renderer that wraps the content area. Sidebar items map to module keys. Selecting a sidebar item updates which module component renders in the main slot. Consider React Router for deep-linking (`/inspect`, `/tokens`).

### Module Loading

**Current (Standalone):** Desktop loads one module (build-time or config); that module registers jobs.

**Sidebar:** Desktop discovers and loads multiple modules:

- Scan `packages/modules/*` (or config-driven list)
- Load all enabled modules at startup
- Each module calls `core.jobs.register()`; job keys must be namespaced (e.g. `tokens:validate`, `figma:sync`)

**Implementation:** Replace single-module loader with a loop over the enabled module list; call each module's init with Core. Store registered job keys per module.

### IPC and Namespacing

**Current (Standalone):** One module; job keys like `hello` are fine. No `module.*` namespace needed.

**Sidebar:** Multiple modules require:

- **Job key namespacing:** Use `moduleKey:jobKey` (e.g. `tokens:validate`) to avoid collisions
- **Optional `module.*` namespace:** If modules need module-specific IPC (e.g. `module.tokens.getConfig`), add a `module` namespace to the preload API
- **Shared channels:** `job:run`, `runs:list`, etc. remain; `job:run` accepts the namespaced key

**Implementation:** Ensure MODULE_PUBLIC_API mandates namespaced job keys from the start (Standalone readiness). Add `module.*` to preload when a module needs custom IPC.

### Enable/Disable

**Current (Standalone):** Config or build selects which single module is active.

**Sidebar:** Per-user or per-workspace module list:

- Store enabled module keys (e.g. in electron-store or workspace config)
- On load, only init modules in the enabled list
- UI for toggling modules (settings, workspace preferences)

**Implementation:** Add `enabledModules: string[]` to config/store; filter module loading by this list.

### Migration Checklist (Standalone to Sidebar)

1. Add Desktop layout/shell with sidebar navigation
2. Change module loading from single to multi
3. Ensure job keys are namespaced
4. Add enable/disable config and UI
5. Add sidebar module registry (icon, label, route per module)
6. Add `module.*` IPC if needed

Core and existing modules require minimal changes if job keys are already namespaced and modules follow the constraints.

---

## Transition: Sidebar to Dashboard

### What Stays the Same

- Everything from Sidebar (sidebar nav, multi-module loading, IPC namespacing, enable/disable)
- Full module views remain identical
- Core API and job registration pattern
- Module constraints

### What Changes

The Dashboard Model adds a **dashboard home view** alongside the existing sidebar navigation. The sidebar still works for switching to full module views; the dashboard is an additional view that shows all enabled modules simultaneously as tiles.

### Module UI Contract Change

**Sidebar contract (unchanged):**

```typescript
// Full module view — renders in the main content area
export default function InspectModule(): JSX.Element;
```

**Dashboard addition:**

```typescript
// Compact widget — renders as a tile in the dashboard grid
export function Widget(): JSX.Element;
```

Modules that don't export a `Widget` are excluded from the dashboard grid but still accessible via sidebar.

### Widget Component Guidelines

The `Widget` export should be:

- **Self-contained:** Fetches its own data via `window.aro` (no props from the shell)
- **Compact:** Designed for a tile size of ~300x200px minimum, responsive up to larger tiles
- **Summary-focused:** Surfaces key metrics, status, or recent activity — not the full UI
- **Lightweight:** Minimal re-renders; avoid heavy polling or large subscriptions
- **Actionable link:** Provides a clear path to the full view (e.g. "View details" navigates to the sidebar module)

Example: the Inspect module's widget might show the composite health score, finding counts, and a "View report" link.

### Dashboard Layout

**Implementation options:**

- **CSS Grid (simplest):** Fixed tile sizes, responsive column count via `auto-fill` / `auto-fit`
- **react-grid-layout (configurable):** Drag-to-reorder, resize tiles, persist layout per user
- **Custom grid:** Somewhere in between — fixed layout but configurable show/hide per tile

**Recommended starting point:** CSS Grid with a fixed tile size. Add drag/resize later if users request it.

### Desktop Shell Changes

- Add a "Home" or "Dashboard" entry to the sidebar (always first)
- Dashboard view renders a grid of `Widget` components from all enabled modules
- Clicking a tile navigates to the full module view via the existing sidebar routing
- Sidebar still works independently for direct module access

### Performance Considerations

Multiple modules rendering and fetching data concurrently:

- **Lazy mount:** Only render widgets that are in the viewport (virtualisation or `IntersectionObserver`)
- **Staggered fetching:** Don't fire all module data requests simultaneously on mount
- **Error isolation:** One widget crashing should not take down the dashboard (React Error Boundaries per tile)
- **Loading states:** Each tile shows its own skeleton/loading state independently

### Optional: Inter-Module Events

If tiles need to coordinate (e.g. workspace change triggers all tiles to refresh):

- Use the existing `window.aro.workspace.onChanged()` callback (already available)
- For custom cross-module events, consider a simple pub/sub on `window.aro.events` — but prefer keeping tiles independent

### Migration Checklist (Sidebar to Dashboard)

1. Define `Widget` export contract in MODULE_PUBLIC_API
2. Add `Widget` export to each module (optional; modules without it are sidebar-only)
3. Add dashboard home view with grid layout
4. Add "Home" / "Dashboard" sidebar entry
5. Add Error Boundaries per tile
6. Add loading/skeleton states per tile
7. Test concurrent data fetching performance
8. Optional: Add user-configurable tile layout persistence

---

## Full Migration Path

```
Standalone
  │
  │  Add sidebar shell, multi-module loading,
  │  IPC namespacing, enable/disable config
  │
  ▼
Sidebar
  │
  │  Add Widget exports, dashboard grid view,
  │  layout engine, error boundaries
  │
  ▼
Dashboard
```

At every stage, Core remains unchanged. Module code requires minimal modification — the primary work is in the Desktop shell.
