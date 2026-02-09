
Goal: least dependency footprint while still shipping reliably.

## Allowed deps (Core MVP)

Core (`packages/core`) may use ONLY:

- `better-sqlite3` (SQLite persistence)
- `zod` (boundary validation)

Node built-ins are allowed.

## Not allowed (Core MVP)

- ORMs / query builders (Prisma, Drizzle, TypeORM, Kysely, etc.)
- IndexedDB / Dexie
- logging frameworks (unless explicitly approved)
- DI frameworks
- plugin systems

## Adding a dependency

If a new dependency is proposed:

1. Update this doc with:
   - dependency name
   - reason it is required
   - what it replaces / why built-in is insufficient
2. Keep the change scoped to the package that needs it.
3. Prefer zero-dependency solutions unless the dependency removes real risk.

If this doc is not updated first, the dependency is rejected.
