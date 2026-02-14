# Tenant Configuration

How the application loads, validates, and applies tenant configuration — covering UI model, enabled modules, brand identity, theme tokens, and feature flags.

This guide is for **developers, designers, and product managers**. No deep programming knowledge is required for the basic workflow.

See [WHITE_LABEL.md](WHITE_LABEL.md) for the architectural principles behind the white-label system.

---

## Quick start — the developer workflow

Your `.env` file continues to work exactly as before:

```
ARO_UI_MODEL=carousel
ARO_ENABLED_MODULES=inspect,hello-world
```

Change a value, restart the app, done. Nothing about your daily workflow has changed.

---

## How configuration is resolved

The system reads configuration from multiple sources and merges them in priority order. Later sources override earlier ones:

```
Zod defaults  →  tenant.config.json  →  .env overrides  →  Zod validation
    (1)                (2)                    (3)               (4)
```

| Step | Source | Required? | What it does |
|------|--------|-----------|-------------|
| 1 | **Zod defaults** | Always | Every field has a sensible default (`uiModel: "standalone"`, `brand.appName: "Aro Studio"`, etc.) |
| 2 | **tenant.config.json** | Optional | Structured base config at project root. Provides a complete config in one file. |
| 3 | **.env overrides** | Optional | `ARO_UI_MODEL` and `ARO_ENABLED_MODULES` override the JSON file. Highest priority. |
| 4 | **Zod validation** | Always | Validates the merged result. If invalid, the app exits immediately with a clear error. |

**Key rule:** `.env` always wins over `tenant.config.json`. If you have both, the env var takes priority.

---

## Configuration reference

### Full schema

| Field | Type | Default | Env var override | Description |
|-------|------|---------|-----------------|-------------|
| `uiModel` | `"standalone"` `"sidebar"` `"dashboard"` `"tabs"` `"carousel"` | `"standalone"` | `ARO_UI_MODEL` | Which shell layout to render |
| `enabledModules` | Array of strings | `[]` | `ARO_ENABLED_MODULES` (comma-separated) | Which module keys are active |
| `brand.appName` | String | `"Aro Studio"` | — | Name in title bar, headers, meta tags |
| `brand.logoUrl` | String (optional) | — | — | URL or path to brand logo |
| `brand.faviconUrl` | String (optional) | — | — | URL or path to browser favicon |
| `brand.splashComponent` | String (optional) | — | — | Key of a registered splash component |
| `theme` | Object (CSS var name to value) | `{}` | — | CSS custom property overrides |
| `features` | Object (flag name to boolean) | `{}` | — | Feature flags |

### UI models

| Model | Description |
|-------|-------------|
| `standalone` | Single module owns the full screen. Only the first enabled module is loaded. |
| `sidebar` | Vertical navigation rail on the left. One module visible at a time. |
| `dashboard` | Responsive grid of widget cards. Modules can expand to full screen. |
| `tabs` | Horizontal tab bar at the top. One module visible at a time. |
| `carousel` | Horizontal swipe/arrow navigation with dot indicators. |

---

## tenant.config.json

An optional JSON file at the project root. It provides a structured base that env vars can selectively override.

### Minimal example

```json
{
  "uiModel": "standalone",
  "enabledModules": ["inspect"]
}
```

### Full example

```json
{
  "uiModel": "dashboard",
  "enabledModules": ["inspect", "hello-world"],
  "brand": {
    "appName": "Acme Design Studio",
    "logoUrl": "/assets/acme-logo.svg",
    "faviconUrl": "/assets/acme-favicon.ico"
  },
  "theme": {
    "--aro-primary": "#2563eb",
    "--aro-primary-hover": "#1d4ed8",
    "--aro-primary-foreground": "#ffffff"
  },
  "features": {
    "experimentalTokenDiff": true
  }
}
```

### Where to put it

The file must be at the **project root** (next to `package.json` and `.env`). Both the desktop and web hosts look for it there.

---

## .env overrides

Two env vars are supported. They take the highest priority in the resolution chain:

| Env var | Maps to | Example |
|---------|---------|---------|
| `ARO_UI_MODEL` | `uiModel` | `ARO_UI_MODEL=carousel` |
| `ARO_ENABLED_MODULES` | `enabledModules` | `ARO_ENABLED_MODULES=inspect,hello-world` |

If both `tenant.config.json` and `.env` set the same field, the `.env` value wins.

**Example:**

```
# tenant.config.json has: "uiModel": "dashboard"
# .env has:
ARO_UI_MODEL=sidebar
```

Result: the app starts with `sidebar` layout (env wins).

---

## Theme tokens

The application defines CSS custom properties in `packages/ui/src/theme/tokens.css`. These are the default values:

| Token | Default | Role |
|-------|---------|------|
| `--aro-background` | `#ffffff` | Page background |
| `--aro-foreground` | `#09090b` | Primary text |
| `--aro-primary` | `#18181b` | Primary button/action |
| `--aro-destructive` | `#dc2626` | Error/destructive actions |
| `--aro-border-default` | `#e4e4e7` | Standard borders |
| `--aro-sidebar-background` | `#18181b` | Sidebar background |

See `tokens.css` for the complete list. Tenants override tokens via the `theme` field in `tenant.config.json`:

```json
{
  "theme": {
    "--aro-primary": "#2563eb",
    "--aro-sidebar-background": "#1e293b"
  }
}
```

> **Note:** Component migration to consume `var(--aro-*)` is in progress. The tokens file establishes the contract. See WHITE_LABEL.md for the roadmap.

---

## Brand identity

The `brand` object controls what the user sees in the title bar, headers, and browser tab:

| Setting | What it controls | Default |
|---------|-----------------|---------|
| `appName` | Browser tab title, dashboard header, back button label | `Aro Studio` |
| `logoUrl` | Brand logo in shell header areas | None |
| `faviconUrl` | Browser tab icon | Browser default |
| `splashComponent` | Custom loading screen while app starts | Plain "Loading..." text |

### Setting brand via tenant.config.json

```json
{
  "brand": {
    "appName": "Acme Design Studio",
    "logoUrl": "/assets/acme-logo.svg",
    "faviconUrl": "/assets/acme-favicon.ico"
  }
}
```

### Where to put brand asset files

| Host | Place files in | How to reference |
|------|---------------|-----------------|
| Desktop | `apps/desktop/src/renderer/assets/` | `/assets/acme-logo.svg` |
| Web | `apps/web/public/` or `apps/web/src/client/assets/` | `/assets/acme-logo.svg` |

You can also use full URLs for externally hosted assets.

---

## Feature flags

The `features` object enables or disables named features:

```json
{
  "features": {
    "experimentalTokenDiff": true,
    "showDebugPanel": false
  }
}
```

Application code reads flags via `useTenant().features`:

```tsx
const { features } = useTenant();
if (features.experimentalTokenDiff) {
  // render experimental UI
}
```

---

## Fail-fast validation

If any configuration value is invalid, the app exits immediately at startup with a structured error message. This prevents silent misconfiguration.

**Example:** Setting `ARO_UI_MODEL=invalid` produces:

```
TenantConfigError: Invalid tenant configuration:
  - uiModel: Invalid enum value. Expected 'standalone' | 'sidebar' | 'dashboard' | 'tabs' | 'carousel', received 'invalid'
```

This is intentional. Fix the value and restart.

---

## Common scenarios

### Scenario 1: Developer testing different layouts

```bash
# In .env — change and restart
ARO_UI_MODEL=carousel
ARO_ENABLED_MODULES=inspect,hello-world
```

No `tenant.config.json` needed. Your `.env` file is sufficient.

### Scenario 2: White-label deployment for a client

Create `tenant.config.json` at project root:

```json
{
  "uiModel": "dashboard",
  "enabledModules": ["inspect"],
  "brand": {
    "appName": "ClientCo Design System",
    "logoUrl": "/assets/clientco-logo.svg",
    "faviconUrl": "/assets/clientco-favicon.ico"
  },
  "theme": {
    "--aro-primary": "#0ea5e9",
    "--aro-sidebar-background": "#0c4a6e"
  }
}
```

Remove `ARO_UI_MODEL` and `ARO_ENABLED_MODULES` from `.env` (or delete them) so the JSON values apply.

### Scenario 3: Overriding one field during development

Keep `tenant.config.json` for the base config, but override the UI model in `.env`:

```bash
# .env overrides tenant.config.json's uiModel for local testing
ARO_UI_MODEL=sidebar
```

The app uses `sidebar` (from .env) but keeps everything else from `tenant.config.json`.

---

## How to add a new config field

1. **Add the field to the Zod schema** in `packages/config/src/schema.ts`. Give it a default value.
2. **Add the field to the TypeScript interface** in `packages/types/src/index.ts` (keep types aligned with the schema).
3. **(Optional) Add an env var override** in `packages/config/src/loader.ts` if the field should be controllable via `.env`.
4. **Consume the field** in UI code via `useTenant()`.
5. **Update this document** with the new field.

---

## Architecture notes

| Component | Package | Purpose |
|-----------|---------|---------|
| `TenantConfigSchema` | `@aro/config` | Zod schema — single source of truth for shape + validation |
| `loadTenantConfig()` | `@aro/config` | Config resolution: JSON file + env overrides + Zod validation |
| `TenantConfig` interface | `@aro/types` | TypeScript type shared by all packages |
| `TenantProvider` | `@aro/ui/hooks` | React context — provides config to all components |
| `useTenant()` | `@aro/ui/hooks` | React hook — reads the active config |
| `useBrandHead()` | `@aro/ui/hooks` | Syncs document title and favicon with brand config |
| `tokens.css` | `@aro/ui/theme` | CSS custom property defaults for theming |

Both hosts (desktop and web) call `loadTenantConfig()` at startup, store the result, and serve it to the renderer via IPC (desktop) or REST API (web).

---

## Checklist for rebranding

- [ ] **Choose an app name** and set `brand.appName`
- [ ] **Prepare brand assets** (logo SVG, favicon ICO/PNG) and place them in the assets directory
- [ ] **Create or update `tenant.config.json`** at project root
- [ ] **Set theme tokens** in the `theme` object if custom colors are needed
- [ ] **Choose a UI model** (`dashboard`, `sidebar`, `tabs`, `carousel`, or `standalone`)
- [ ] **Enable the modules** your deployment needs in `enabledModules`
- [ ] **Verify browser tab** shows your app name and favicon
- [ ] **Verify dashboard/sidebar header** shows your app name
- [ ] **Test fail-fast** by temporarily setting an invalid `uiModel` — app should exit with clear error
