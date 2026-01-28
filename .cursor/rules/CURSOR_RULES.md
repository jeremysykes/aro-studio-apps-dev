# Cursor Rules

1. Core must not import Desktop or Modules
2. Modules must not import each other
3. SQL must remain inside infra/db
4. Services expose intent-based methods only
5. Jobs are the only long-running execution model (I/O, computation, or multi-step workflows).
6. No new dependencies without justification in /docs/DEPENDENCIES.md.
7. Prefer synchronous code in Core
8. Favor applied tests over unit tests
9. All decisions must be consistent with /docs. If unclear, update docs first, then implement.
