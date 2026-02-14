# White-Label Architecture

This document defines the white-label methodology governing the project. It is a contract, not commentary. All contributors must follow these rules.

---

## Core Philosophy

This is a white-label software framework. The product must have a neutral, brand-agnostic foundation. All brand expression is layered on top of a stable core. The system must remain fully functional if branding is removed.

---

## Separation of Concerns

Every asset in the project falls into one of three layers:

| Layer | What it contains | Where it lives | Example |
|-------|-----------------|----------------|---------|
| **Core** | Business logic, API contracts, data models, layout structure, module loading | `packages/core`, `packages/ui/src/shell`, server-side registries | `createCore()`, `ShellLayout`, `ShellRouter`, `DashboardLayout`, `loadModules()` |
| **Theme** | Colors, typography, spacing, motion, border radii, shadows — resolved through design tokens | CSS custom properties in root stylesheets, Tailwind config | `--color-background`, `--color-foreground`, `--radius` |
| **Brand** | Logos, imagery, app name, marketing tone, product personality | Per-brand config files (future), environment variables | App title, favicon, splash screen |

**Rules:**
- Core must never reference a brand name, logo, or specific color.
- Theme values must be abstract tokens, not raw values.
- Brand assets must be additive overlays, never baked into core components.

---

## Override Hierarchy

```
Core → Theme → Brand → Context
```

Each layer can override the previous. Overrides are additive and controlled, never destructive. A brand configuration should deterministically generate a predictable UI. No ad hoc overrides. No one-off exceptions.

---

## Token-First Rule

All visual decisions must resolve through abstract design tokens. No raw values (colors, spacing, font sizes) should exist without abstraction.

**Correct:**
```css
.sidebar { background: var(--color-sidebar-background); }
```
```html
<nav className="bg-sidebar border-border">
```

**Incorrect:**
```html
<nav className="bg-zinc-50 border-zinc-200">
```

### Current State (MVP)

The shadcn/ui components in `packages/ui` currently use hardcoded zinc/white/red color values. This is the standard shadcn pattern and is acceptable for MVP. These will be migrated to CSS custom properties when a theming system is added.

**Migration path:**
1. Define a design token contract (CSS custom properties)
2. Update Tailwind config to resolve tokens
3. Replace hardcoded colors in shadcn components with token references
4. Create per-brand token files

---

## Component Neutrality

Components in `@aro/ui` must not assume:
- A brand voice, marketing tone, or visual personality
- Stylistic bias (specific border radii, playful/serious mood)
- Single tenant, single brand, or single product line

Components should be structurally complete but visually restrained. All personality comes from the theme and brand layers.

---

## Naming Conventions

Use semantic intent over appearance in all token and variable names.

| Good (semantic) | Bad (appearance) |
|-----------------|-----------------|
| `surface-primary` | `blue-500` |
| `text-muted` | `gray-400` |
| `border-default` | `zinc-200` |
| `action-destructive` | `red-600` |

---

## Module Contract

Modules must:
- Import UI components from `@aro/ui/components`, not create their own
- Use design tokens (when available) for all visual values
- Not hardcode brand names, logos, or product-specific language
- Be self-contained — no assumptions about which other modules are loaded
- Work identically across all hosts (Desktop and Web)

---

## Layout Resilience

Layout systems must support multiple density modes, typography scales, and spacing systems. No layout should collapse when theme variables change. Shell components (`ShellLayout`, `ShellRouter`, `DashboardLayout`, `Sidebar`) must be tested with varying content sizes.

---

## Multi-Tenancy by Default

Do not assume:
- Single tenant
- Single brand
- Single product line

Design for multi-tenant, multi-brand environments by default. A single codebase should be deployable as many different branded products by changing only theme and brand configuration.

---

## Documentation as Contract

Every architectural decision must be documented. This file and the files it references are contracts. When in doubt, check the docs. When the docs are ambiguous, clarify them — don't make assumptions.

---

## What Needs Work (Roadmap)

1. **Design token system** — define CSS custom property contract, create Tailwind theme resolver
2. ~~**Brand config files**~~ — **Done.** `TenantConfig` provides `appName`, `logoUrl`, `faviconUrl`, and `splashComponent`. See [TENANT_CONFIGURATION.md](TENANT_CONFIGURATION.md) for setup and usage.
3. **Migrate shadcn components** — replace hardcoded colors with token references
4. **Theme preview tool** — live theme switching for development and demos
