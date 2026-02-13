# Module Models: Standalone, Sidebar, and Dashboard

This document defines three architectural models for how Modules integrate with Core and Desktop. Each model builds on the previous; transitions are incremental. This is the authoritative reference for module model design.

## Summary Table

| Aspect | Standalone | Sidebar | Dashboard |
|--------|------------|---------|-----------|
| Module = ? | Application (owns main content) | Full-screen view behind a nav item | Tile / widget in a grid layout |
| UI ownership | Module owns main content | Desktop shell (sidebar + content slot) | Desktop shell (grid layout + tile slots) |
| Modules visible at once | 1 | 1 (switch via sidebar) | Many (tiles rendered simultaneously) |
| Modules loaded at once | 1 | All enabled | All enabled |
| Enable/disable | Build/config only | Per-user or per-workspace config | Per-user or per-workspace config |
| IPC namespacing | Recommended (`moduleKey:jobKey`) | Required | Required |
| Module UI exports | `default` (root component) | `default` (root component) | `default` (root component) + `Widget` |
| Layout responsibility | Module | Desktop shell | Desktop shell + layout engine |
| Config key | `ARO_UI_MODEL=standalone` + `ARO_ENABLED_MODULES=inspect` | `ARO_UI_MODEL=sidebar` + `ARO_ENABLED_MODULES=inspect,tokens` | `ARO_UI_MODEL=dashboard` + `ARO_ENABLED_MODULES=inspect,tokens` |
| Use case | "Aro Studio Tokens", "Aro Studio Figma" | Single "Aro Studio" app, switch between features | Single "Aro Studio" app, see everything at a glance |

---

## Selecting the Active Model

The active model is controlled by the `ARO_UI_MODEL` environment variable (or `.env` at the project root).

| `ARO_UI_MODEL` value | Model | Behaviour |
|----------------------|-------|-----------|
| `standalone` | Standalone | Current MVP behaviour. First module in `ARO_ENABLED_MODULES` owns the full screen. |
| `sidebar` | Sidebar | Desktop shell renders sidebar + content slot. All modules in `ARO_ENABLED_MODULES` are loaded. |
| `dashboard` | Dashboard | Extends Sidebar. Adds a dashboard home view with module widget tiles. |

### Configuration variables

Two environment variables control the module system:

- **`ARO_UI_MODEL`** — which shell layout to use (`standalone`, `sidebar`, or `dashboard`).
- **`ARO_ENABLED_MODULES`** — comma-separated list of module keys to load. Used by all models.

| Variable | Standalone | Sidebar | Dashboard |
|----------|------------|---------|-----------|
| `ARO_UI_MODEL` | `standalone` | `sidebar` | `dashboard` |
| `ARO_ENABLED_MODULES` | Single module (e.g. `inspect`) | Multiple (e.g. `inspect,hello-world`) | Same as Sidebar |

**`.env` examples:**

```bash
# Standalone — one module, no shell chrome
ARO_UI_MODEL=standalone
ARO_ENABLED_MODULES=inspect

# Sidebar — multiple modules behind a nav
ARO_UI_MODEL=sidebar
ARO_ENABLED_MODULES=inspect,hello-world

# Dashboard — tiled widget grid (extends Sidebar)
ARO_UI_MODEL=dashboard
ARO_ENABLED_MODULES=inspect,hello-world
```

See [desktop/ACTIVE_MODULE_SWITCH.md](../desktop/ACTIVE_MODULE_SWITCH.md) for full switching instructions.

---

## Standalone Model

**Description:** One module per application. Set `ARO_ENABLED_MODULES` to a single module key (e.g. `inspect`). The module owns the main UI and user experience; no shell chrome is rendered. Core + Desktop are shared infrastructure. Each shipped product is a distinct app (e.g. "Aro Studio Tokens", "Aro Studio Figma").

**When to use:**
- Different applications packaged from the same platform
- Each app has a focused, domain-specific experience
- Simpler first implementation; one module, full control of UI

**Status:** Implemented.

**Desktop renderer structure (Standalone):**

```
App.tsx
└── <ActiveModule />        ← module owns the entire content area
```

**Key files (current implementation):**
- `apps/desktop/src/main/moduleLoader.ts` — loads single active module
- `apps/desktop/src/main/moduleRegistry.ts` — maps module keys to init functions
- `apps/desktop/src/renderer/moduleRegistry.tsx` — maps module keys to React components
- `apps/desktop/src/renderer/App.tsx` — resolves and renders single active module

---

## Sidebar Model

**Description:** One "Aro Studio" app that loads multiple modules. Desktop provides a shared shell with a sidebar for switching between modules. The selected module renders its full UI in the main content area. Only one module is visible at a time, but all enabled modules are loaded and their jobs are registered.

**When to use:**
- Single product with many integrated features
- Users need to switch between domains within one app
- Per-user or per-workspace module permissions

**Status:** Implemented (desktop + web).

**Desktop renderer structure (Sidebar):**

```
App.tsx
├── <Sidebar />
│   ├── <SidebarItem module="inspect" icon={...} label="Inspect" />
│   ├── <SidebarItem module="tokens" icon={...} label="Tokens" />
│   └── ...
└── <ContentSlot>
    └── <ActiveModule />    ← selected module renders here
</ContentSlot>
```

### Implementation requirements

**1. Desktop shell layout (`apps/desktop/src/renderer/`)**

Create a `ShellLayout` component that wraps the content area:

```typescript
// apps/desktop/src/renderer/ShellLayout.tsx
export function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

**2. Sidebar component**

```typescript
// apps/desktop/src/renderer/Sidebar.tsx
interface SidebarItem {
  key: string;          // module key (e.g. 'inspect')
  label: string;        // display name
  icon: React.ReactNode; // module icon
}

// Sidebar reads enabled modules from registry
// Active module state drives which item is highlighted
// Clicking an item updates the active module in app state
```

**3. Module registry extension**

Add metadata for sidebar rendering:

```typescript
// apps/desktop/src/renderer/moduleRegistry.tsx
export interface ModuleRegistryEntry {
  key: string;
  component: React.ComponentType;
  label: string;        // sidebar display name
  icon: React.ReactNode; // sidebar icon
}

export const moduleRegistry: ModuleRegistryEntry[] = [
  { key: 'inspect', component: Inspect, label: 'Inspect', icon: <InspectIcon /> },
  { key: 'hello-world', component: HelloWorld, label: 'Hello World', icon: <HelloIcon /> },
];
```

**4. Module loader change (`apps/desktop/src/main/moduleLoader.ts`)**

Replace single-module loading with multi-module loading:

```typescript
// Current (Standalone):
export function loadActiveModule(core: AroCore): void { ... }

// Sidebar:
export function loadEnabledModules(core: AroCore): void {
  const enabledKeys = getEnabledModuleKeys(); // from ARO_ENABLED_MODULES
  for (const key of enabledKeys) {
    const init = getInit(key);
    if (!init) { console.warn(`Module not found: ${key}`); continue; }
    const jobKeys = init(core);
    addRegisteredJobKeys(key, jobKeys); // store per-module
  }
}
```

**5. App.tsx change**

```typescript
// Current (Standalone):
return <ActiveComponent />;

// Sidebar:
const [activeModuleKey, setActiveModuleKey] = useState(enabledModules[0]);
return (
  <ShellLayout>
    <Sidebar modules={enabledModules} active={activeModuleKey} onChange={setActiveModuleKey} />
    <ActiveModuleComponent />
  </ShellLayout>
);
```

**6. IPC namespacing**

Job keys must use `moduleKey:jobKey` format. This is already the convention but becomes strictly required:

```typescript
// Module init
core.jobs.register({ key: 'inspect:scan', run: ... });
core.jobs.register({ key: 'inspect:export', run: ... });
```

**7. IPC: expose active model to renderer**

Add `window.aro.getUIModel()` to preload so the renderer knows which layout to use:

```typescript
// preload
getUIModel: () => ipcRenderer.invoke('app:getUIModel'),
// main
ipcMain.handle('app:getUIModel', () => process.env.ARO_UI_MODEL ?? 'standalone');
```

---

## Dashboard Model

**Description:** One "Aro Studio" app where multiple modules are visible simultaneously as tiles in a grid layout. Users see a dashboard of module widgets — compact summaries that surface key information at a glance. Clicking a tile can expand it or navigate to the full module view (Sidebar navigation).

**When to use:**
- Users want an overview of multiple domains without switching context
- Key metrics from several modules should be visible side-by-side
- The product has matured enough that inter-module awareness adds value

**Status:** Implemented (desktop + web). Widget components are optional per module; modules without widgets render a placeholder card.

**Desktop renderer structure (Dashboard):**

```
App.tsx
├── <Sidebar />
│   ├── <SidebarItem key="home" label="Dashboard" />  ← new: dashboard home
│   ├── <SidebarItem module="inspect" label="Inspect" />
│   └── ...
└── <ContentSlot>
    ├── (when home) <DashboardGrid>
    │   ├── <WidgetTile module="inspect"><InspectWidget /></WidgetTile>
    │   ├── <WidgetTile module="tokens"><TokensWidget /></WidgetTile>
    │   └── ...
    │ </DashboardGrid>
    └── (when module) <ActiveModule />
</ContentSlot>
```

### Implementation requirements

**Everything from the Sidebar Model, plus:**

**1. Module UI contract extension**

Each module exports a `Widget` component in addition to its default root:

```typescript
// packages/modules/inspect/src/ui/index.tsx

// Full view (Standalone + Sidebar — unchanged)
export { default } from './Inspect';

// Compact widget (Dashboard)
export { InspectWidget as Widget } from './widgets/InspectWidget';
```

**2. Widget component guidelines**

```typescript
// packages/modules/inspect/src/ui/widgets/InspectWidget.tsx
export function InspectWidget() {
  // Self-contained: fetches own data via window.aro
  // Compact: designed for ~300x200px tile, responsive
  // Summary-focused: health score, finding counts, "View report" link
  // Lightweight: no heavy polling, no large subscriptions
}
```

Requirements:
- **Self-contained** — fetches its own data via `window.aro` (no props from the shell)
- **Compact** — minimum tile size ~300x200px, responsive within tile bounds
- **Summary-focused** — key metrics, status, recent activity; not the full UI
- **Lightweight** — minimal re-renders; use `useMemo` / `useCallback` where needed
- **Actionable** — provides a clear "View details" link that navigates to the full module view

**3. Widget registry extension**

```typescript
// apps/desktop/src/renderer/moduleRegistry.tsx
export interface ModuleRegistryEntry {
  key: string;
  component: React.ComponentType;
  widget?: React.ComponentType;  // optional — modules without this are sidebar-only
  label: string;
  icon: React.ReactNode;
}
```

**4. Dashboard grid component**

```typescript
// apps/desktop/src/renderer/DashboardGrid.tsx
export function DashboardGrid({ modules }: { modules: ModuleRegistryEntry[] }) {
  const widgetModules = modules.filter(m => m.widget);
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 p-4">
      {widgetModules.map(m => (
        <ErrorBoundary key={m.key} fallback={<WidgetError module={m.label} />}>
          <WidgetTile label={m.label} onExpand={() => navigateTo(m.key)}>
            <m.widget />
          </WidgetTile>
        </ErrorBoundary>
      ))}
    </div>
  );
}
```

**5. Error isolation**

Each widget tile must be wrapped in a React Error Boundary. One widget crashing must not take down the dashboard:

```typescript
<ErrorBoundary fallback={<WidgetError module={label} />}>
  <Suspense fallback={<WidgetSkeleton />}>
    <Widget />
  </Suspense>
</ErrorBoundary>
```

**6. Performance considerations**

- **Staggered fetching** — don't fire all widget data requests simultaneously on mount; use `requestIdleCallback` or stagger with small delays
- **Lazy mount** — only render widgets in the viewport (`IntersectionObserver` or virtualisation)
- **Independent loading states** — each tile shows its own skeleton independently
- **Memoisation** — widgets should memoise expensive computations and avoid unnecessary re-renders

**7. Sidebar addition**

Add a "Dashboard" / "Home" entry as the first sidebar item. When active, render `DashboardGrid` in the content slot instead of a module view.

---

## Transition Path

Each model builds on the previous. Detailed implementation steps are in [MODULE_TRANSITION.md](MODULE_TRANSITION.md).

```
Standalone
  │
  │  + shell layout, sidebar, multi-module loading,
  │  + IPC namespacing, enable/disable config, ARO_UI_MODEL
  │
  ▼
Sidebar
  │
  │  + Widget exports, dashboard grid, layout engine,
  │  + error boundaries, performance tuning
  │
  ▼
Dashboard
```

Core and the module-to-Core relationship remain the same across all three models.

---

## Visual Summary

See [diagrams/module-models.md](../../diagrams/module-models.md) for Mermaid diagrams of all three models.
