# Tenant Configuration

How to customise the application's brand identity — name, logo, favicon, and splash screen — without changing any code.

This guide is for **designers, product managers, and anyone** who needs to rebrand or white-label the application. No programming experience is required.

See [WHITE_LABEL.md](WHITE_LABEL.md) for the architectural principles behind the brand layer.

---

## What is a tenant?

A **tenant** is a branded version of the application. The same codebase can power many different products — each with its own name, logo, and visual identity. The tenant configuration controls what the user sees.

| Term | What it means | Example |
|------|--------------|---------|
| **Tenant** | A branded instance of the app | "Acme Design Studio" |
| **Brand assets** | The visual identity files a tenant provides | Logo image, favicon file |
| **TenantConfig** | The settings object that tells the app which brand assets to use | `{ appName: "Acme Design Studio" }` |

---

## What you can configure

| Setting | What it controls | Required? | Default |
|---------|-----------------|-----------|---------|
| `appName` | The name shown in the browser tab, title bar, and dashboard header | Yes | `Aro Studio` |
| `logoUrl` | The brand logo displayed in the shell (sidebar header, splash screen) | No | None (no logo shown) |
| `faviconUrl` | The small icon in the browser tab | No | None (browser default) |
| `splashComponent` | A custom loading screen shown while the app starts | No | Plain "Loading…" text |

---

## Quick start — changing the app name

The simplest customisation is changing the application name. This updates the browser tab title and the dashboard header in one place.

**Before** (default):

```
Browser tab:  "Aro Studio"
Dashboard:    "Aro Studio" header
```

**After** (with tenant config):

```
Browser tab:  "Acme Design Studio"
Dashboard:    "Acme Design Studio" header
```

### Where to make the change

Open the **App file** for the host you are using:

| Host | File |
|------|------|
| Desktop (Electron) | `apps/desktop/src/renderer/App.tsx` |
| Web (Browser) | `apps/web/src/client/App.tsx` |

Find the `TenantProvider` near the bottom of the file:

```tsx
function App() {
  return (
    <TenantProvider>
      <AppShell />
    </TenantProvider>
  );
}
```

Add a `config` prop with your brand settings:

```tsx
function App() {
  return (
    <TenantProvider config={{ appName: 'Acme Design Studio' }}>
      <AppShell />
    </TenantProvider>
  );
}
```

Save the file. The app will pick up the change on next reload.

---

## Full example — name, logo, and favicon

To apply a complete brand identity, provide all three visual settings:

```tsx
<TenantProvider
  config={{
    appName: 'Acme Design Studio',
    logoUrl: '/assets/acme-logo.svg',
    faviconUrl: '/assets/acme-favicon.ico',
  }}
>
  <AppShell />
</TenantProvider>
```

### Where to put brand asset files

| Host | Place files in | How to reference them |
|------|---------------|----------------------|
| Desktop | `apps/desktop/src/renderer/assets/` | `'/assets/acme-logo.svg'` (relative to renderer root) |
| Web | `apps/web/src/client/assets/` | `'/assets/acme-logo.svg'` (served by Vite) |

You can also use a full URL if assets are hosted externally:

```tsx
config={{
  appName: 'Acme Design Studio',
  logoUrl: 'https://cdn.acme.com/logo.svg',
  faviconUrl: 'https://cdn.acme.com/favicon.ico',
}}
```

---

## What each setting does

### `appName`

Sets the application name everywhere it appears:

- **Browser tab** — the text in the tab title
- **Dashboard header** — the heading at the top of the dashboard grid view
- **Back button** — when a module is expanded in dashboard mode, the back button reads "← Acme Design Studio"

The default is `Aro Studio`. If you only set `appName`, the logo and favicon remain unchanged.

### `logoUrl`

A path or URL to the brand logo image. Accepts any web image format:

| Format | Extension | Best for |
|--------|-----------|----------|
| SVG | `.svg` | Logos (scales to any size, smallest file) |
| PNG | `.png` | Logos with transparency |
| ICO | `.ico` | Not recommended for logos (use for favicon) |

The logo is displayed in the shell header areas. If not set, no logo is shown.

### `faviconUrl`

A path or URL to the favicon — the small icon in the browser tab next to the page title.

| Format | Size | Notes |
|--------|------|-------|
| `.ico` | 16×16 or 32×32 | Best compatibility across all browsers |
| `.png` | 32×32 | Works in modern browsers |
| `.svg` | Any | Works in modern browsers, scales perfectly |

If not set, the browser shows its default icon.

### `splashComponent`

An advanced setting for custom loading screens. This is the key of a React component registered in the module registry. When set, the app renders this component instead of the default "Loading…" text while the application starts up.

Most tenants do not need this. The default loading state is sufficient.

---

## Settings reference

All available `TenantConfig` fields in one table:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `appName` | text | Yes | `Aro Studio` | Application display name |
| `logoUrl` | text (URL or path) | No | None | Brand logo image |
| `faviconUrl` | text (URL or path) | No | None | Browser tab icon |
| `splashComponent` | text (component key) | No | None | Custom loading screen component |

---

## Checklist for rebranding

Use this checklist when applying a new brand to the application.

- [ ] **Choose an app name** — this appears in browser tabs and headers
- [ ] **Prepare a logo** — SVG recommended, any web image format accepted
- [ ] **Prepare a favicon** — 32×32 `.ico` or `.png` recommended
- [ ] **Place asset files** in the correct directory for your host (see table above)
- [ ] **Update `TenantProvider`** in `App.tsx` with your `config` prop
- [ ] **Verify the browser tab** shows your app name and favicon
- [ ] **Verify dashboard mode** shows your app name in the header
- [ ] **Verify the back button** in expanded dashboard view shows "← Your App Name"

---

## Frequently asked questions

### Do I need to rebuild the app after changing the config?

In development: **No.** Save the file and the app reloads automatically (hot reload).

In production: **Yes.** Run `pnpm build` after making changes, then redeploy.

### Can I have different brands for Desktop and Web?

**Yes.** Each host has its own `App.tsx` file. You can set different `config` values in each.

### What happens if I only set some fields?

Missing fields use the defaults. For example, if you only set `appName`, the logo and favicon remain unchanged. You never need to provide all fields.

### Can I change the brand at runtime (without restarting)?

Not currently. The brand is set when the app starts. Changing it requires a page reload. This is intentional — brand identity should be stable during a session.

### Where is the TenantConfig type defined?

In `packages/types/src/index.ts`. This is the canonical type shared by all packages:

```typescript
interface TenantConfig {
  appName: string;
  logoUrl?: string;
  faviconUrl?: string;
  splashComponent?: string;
}
```

---

## Architecture notes

For engineers extending the tenant system, the implementation follows the [WHITE_LABEL.md](WHITE_LABEL.md) contract:

| Component | Package | Purpose |
|-----------|---------|---------|
| `TenantConfig` type | `@aro/types` | Canonical type definition shared by all packages |
| `TenantProvider` | `@aro/ui/hooks` | React context provider — merges partial config over defaults |
| `useTenant()` | `@aro/ui/hooks` | React hook to read the active tenant config from any component |
| `useBrandHead()` | `@aro/ui/hooks` | Keeps `document.title` and favicon in sync with the config |

Shell components (`DashboardLayout`, etc.) consume brand values via `useTenant()` instead of hardcoded strings. The HTML templates contain no brand references — the `useBrandHead` hook sets the title and favicon dynamically at runtime.
