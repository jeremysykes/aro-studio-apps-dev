# Orchestration: agent roles and execution order

This document is the **agent role contract** for the [aro-studio-apps-dev](https://github.com/jeremysykes/aro-studio-apps-dev) repo: which agent types are allowed, their responsibilities and constraints, separation of concerns, and execution order. It is part of the [.claude/](../) control plane (governance). For **coding rules** (e.g. boundaries, SQL, dependencies), see [.cursor/rules/](../../.cursor/rules/) and `docs/ARCHITECTURE.md`.

This project is designed for agent-assisted development.
Agents must follow architectural boundaries strictly.

## Allowed Agents

### Architect Agent

Responsibilities:
- Core layering decisions
- Service boundaries
- Public API design
- Folder structure enforcement

Must not:
- Write UI code
- Introduce dependencies
- Implement features

---
### Core Engineer Agent

Responsibilities:
- Implement Core services
- Write SQLite schema & statements
- Implement job runner
- Write applied tests

Must not:
- Touch Desktop or Modules
- Introduce Electron imports
- Modify documents in /docs without Architect Agent approval

---
### Desktop Engineer Agent

Responsibilities:
- Electron main process, preload, IPC wiring, module loading (calling module init; active module via `ARO_ACTIVE_MODULE`, default `hello-world`, or **`.env`** at the project root), navigation/routing
- Renderer process bootstrap (entry point that loads the app)

Must not:
- Implement renderer UI content (React components, layout, or design system)
- Implement business logic
- Access SQLite directly

---
### Web Engineer Agent

Responsibilities:
- Web server (Node), API that wraps Core, module loading for web (same `ARO_ACTIVE_MODULE` / init pattern), web app bootstrap
- HTTP/WS API that mirrors Desktop IPC surface

Must not:
- Implement renderer UI content (React components, layout, or design system)
- Implement business logic
- Access SQLite directly

---
### Module Engineer Agent

Responsibilities:
- Implement module-specific jobs (init, register jobs)
- Module feature behavior and use of Core APIs from the module

Must not:
- Implement React components or module UI screens
- Access filesystem directly
- Access database directly
- Import other modules

---
### Product Designer Agent

Responsibilities:
- User flows, layout and interaction specs, visual hierarchy
- Design tokens (spacing, type scale, colors where needed)
- Accessibility requirements (e.g. WCAG 2.1 Level AA), acceptance criteria for UI/UX
- Produce docs and specs in `docs/` or `decisions/` (e.g. wireframes in markdown, a11y checklist). May create or update [docs/meta/UI_UX_ACCESSIBILITY.md](../../docs/meta/UI_UX_ACCESSIBILITY.md).

Must not:
- Write application or component code
- Implement features in React/Electron
- Touch Core, Desktop, or Module implementation files

---
### UI Engineer Agent

Responsibilities:
- All renderer UI: Desktop shell, Web shell, and module screens
- Implement UI from Product Designer specs; use design system (shadcn + Tailwind); semantic HTML and ARIA; component structure and composition in React; ensure markup and behavior meet documented a11y criteria

Must not:
- Define product flows or visual design from scratch without design input
- Change business logic or Core/Desktop/Module boundaries
- Introduce new dependencies without DEPENDENCIES.md justification

---

## Separation of responsibilities

Each role has a single clear owner for its domain. No overlap.

| Agent | Owns (only) | Does not |
|-------|-------------|----------|
| **Architect** | Core layering, service boundaries, public API design, folder structure. | Write UI; introduce dependencies; implement features. |
| **Core Engineer** | Core services, SQLite schema/statements, job runner, applied tests. | Touch Desktop or Modules; Electron; modify /docs without Architect approval. |
| **Desktop Engineer** | Main process, preload, IPC, module loading, navigation; renderer bootstrap. | Implement renderer UI content (React, layout, design system); business logic; SQLite. |
| **Web Engineer** | Web server, API, module loading for web, web app bootstrap. | Implement renderer UI content (React, layout, design system); business logic; SQLite. |
| **Module Engineer** | Module job definitions, module feature behavior, Core APIs from the module. | Implement React/components or module UI screens; fs/DB directly; import other modules. |
| **Product Designer** | User flows, layout/specs, visual hierarchy, design tokens, a11y requirements; docs/specs only. | Write any application or component code; touch implementation files. |
| **UI Engineer** | All renderer UI (Desktop shell, Web shell, module screens); design system usage; semantic HTML/ARIA. | Define product/visual design from scratch without design input; business logic; new deps without DEPENDENCIES.md. |

Renderer UI is owned solely by **UI Engineer**. Desktop Engineer owns only the Desktop host (main, preload, IPC, module loading, renderer entry). Web Engineer owns only the Web host (server, API, module loading, web app bootstrap). Module screens and components are **UI Engineer**; **Module Engineer** owns only job registration and module behavior.

---

## Execution Order

1. Architect Agent defines Core surface
2. Core Engineer implements Core
3. Core Engineer writes applied tests
4. Desktop Engineer wires Core into Electron and sets up module loading
5. Web Engineer wires Core into Web host and sets up module loading
6. Module Engineer adds module job logic and feature behavior
7. Product Designer may produce or update design/a11y specs
8. UI Engineer implements all UI (Desktop shell, Web shell, and module screens) from specs using the design system

When MVP status or main commands change, the README should be updated (see [docs/meta/DOCUMENTATION.md](../../docs/meta/DOCUMENTATION.md)).
