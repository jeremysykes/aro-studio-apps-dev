# AGENTS.md

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

### Module Engineer Agent

Responsibilities:

- Implement module-specific jobs
- Implement module UI (later)
- Use Core APIs only

Must not:

- Access filesystem directly
- Access database directly
- Import other modules

---

### Desktop Engineer Agent

Responsibilities:

- Electron main/preload/renderer
- IPC wiring
- Module loading
- Navigation

Must not:

- Implement business logic
- Access SQLite directly

## Execution Order

1. Architect Agent defines Core surface
2. Core Engineer implements Core
3. Core Engineer writes applied tests
4. Desktop Engineer wires Core into Electron
5. Module Engineer adds features incrementally
