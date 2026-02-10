## Purpose

Aro Studio is a modular desktop application built as a single repo:
- `packages/core` is the engine (headless, Node-based) — MVP complete
- `apps/desktop` is the Electron host — MVP complete
- `packages/modules/*` are feature modules (later)

This document is the source of truth for boundaries and dependency direction.

## High-level diagram

Core → Desktop
Modules → Desktop
Modules → Core

No other dependency direction is allowed.

## Dependency rules (hard)

1. Core MUST NOT import Desktop or Modules.
2. Modules MUST NOT import each other.
3. Desktop MAY import Core and Modules.
4. Core must never expose SQL/tables/queries.
5. Modules must never access the database directly.
6. Modules must never access the filesystem directly outside Core workspace APIs.

## Layers inside Core

Core is layered from inner to outer:

0. Kernel
- ids, errors, event emitter

1. Infra (private)
- SQLite connection + schema + statements
- filesystem primitives + safe path resolution

2. Services (public)
- workspace, runs, logs, artifacts, tokens, validation, jobs
- Services expose intent-based methods only and must not leak persistence or infrastructure concerns.

3. Execution Context
- per-run job context: logger, workspace, artifact writer, abort, progress

4. Public Surface
- `createCore()` and exported types from `src/index.ts`

## Core responsibilities

Core provides:
- Workspace management (scoped file access)
- Persistence for operational data (runs/logs/artifacts)
- Job execution model (run/cancel/progress)
- Token IO (load/save/normalize/diff)
- Validation (schema + lightweight policy checks)

## Non-goals (MVP)

Core does NOT provide:
- plugin discovery
- module loading
- Electron APIs
- UI
- cloud sync
- bidirectional Figma sync