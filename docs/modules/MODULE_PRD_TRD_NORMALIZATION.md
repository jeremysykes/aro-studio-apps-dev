# Module PRD/TRD Normalization Process

This document defines a repeatable process for turning a module Product Requirements Document (PRD) and Technical Requirements Document (TRD) into two aligned, non-contradictory specification artifacts: **Design-spec.md** and **Implementation-spec.md**. It is module-agnostic; use it for any new Aro Studio module (e.g. inspect, tokens, figma-sync).

---

## Prerequisites

1. **Source documents:** PRD and TRD for the module in readable form (markdown or plain text). If only .docx is available, extract text first (e.g. `textutil -convert txt file.docx` on macOS, or Pandoc to .md).
2. **Authoritative references:** Have these at hand; normalization must not contradict them:
   - [ARCHITECTURE.md](../ARCHITECTURE.md) — Core/Desktop/Module boundaries, dependency rules
   - [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md) — Job registration, module contract
   - [MODULE_CONSTRAINTS.md](MODULE_CONSTRAINTS.md) — No DB/fs/cross-module; IPC only via `window.aro`
   - [CORE_PUBLIC_API.md](../core/CORE_PUBLIC_API.md) — JobContext, workspace, artifactWriter, tokens, validation
   - [DESKTOP_PUBLIC_API.md](../desktop/DESKTOP_PUBLIC_API.md) — Preload API (workspace, job, runs, logs, artifacts)
   - [UI_UX_ACCESSIBILITY.md](../meta/UI_UX_ACCESSIBILITY.md) — WCAG 2.1 AA, semantic HTML, keyboard, focus
   - [DEPENDENCIES.md](../meta/DEPENDENCIES.md) — Allowed deps; new deps require justification
3. **Module key:** Know the module key (e.g. `inspect`). All job keys must be namespaced: `moduleKey:jobKey`.

---

## Global constraints (apply to every module)

- Scope strictly to the given **module key**.
- Do **not invent** features, APIs, jobs, UI views, or data sources; only derive from PRD and TRD.
- Do **not contradict** any of the referenced architecture or constraint documents.
- Assume the existing Aro Studio Core, Desktop shell, and job system as given.
- Prefer **explicitness** over abstraction.
- When PRD and TRD conflict, **defer to the TRD**.

---

## Step 1: Extract and scope

1. Read the PRD and TRD fully.
2. Note the module key and whether the module is **read-only/diagnostic** or **mutating** (affects what non-goals to state).
3. List every **job** mentioned (key and purpose).
4. List every **UI view** and **primary user flow**.
5. List **explicit out-of-scope** items from the PRD/TRD; add any implied by architecture (e.g. no direct DB, no cross-module imports).

---

## Step 2: Produce Design-spec.md

**Purpose:** Design intent and UX contract only. No implementation details.

**Sections to include:**

1. **Module purpose and mental model** — One paragraph: what the module does and how users should think about it (e.g. “X-ray,” “read-only”).
2. **User goals by persona** — Table or list; only personas explicitly in the PRD.
3. **Surface inventory model** — What “surfaces” or data sources exist; what the inventory (tokens, components, etc.) represents as a product concept.
4. **UI views and states** — Names of views (e.g. Setup, Run, Report); what each view shows; states (e.g. no workspace, scan running, report loaded).
5. **Information architecture** — What data appears where (which view, which tab or section).
6. **Interaction rules** — Read-only vs mutating; cancellable jobs; snapshot vs live; export behavior.
7. **Accessibility and usability constraints** — Keyboard, tables, focus, severity indicators, design system; reference UI_UX_ACCESSIBILITY.md.
8. **Explicit non-goals** — What the module does not do (from PRD “Out of scope” and architecture).
9. **Release slices** — P0 (minimum viable), P1, P2 per major capability; dependencies between slices; each slice shippable and testable on its own.

**Do not include:** File paths, TypeScript types, API call details, scanner implementation, artifact schema field names (unless needed for UX clarity).

**Output location:** `docs/modules/<moduleKey>/Design-spec.md`.

---

## Step 3: Produce Implementation-spec.md

**Purpose:** Technical execution contract only. No UI copy or product rationale.

**Sections to include:**

1. **Module boundaries and dependencies** — Package path; what the module may/must not import; reference MODULE_CONSTRAINTS and ARCHITECTURE.
2. **Job definitions and execution flow** — Job keys; input schema; use of JobContext (logger, workspace, artifactWriter, abort, progress); execution order and phases.
3. **Scanner (or equivalent) responsibilities** — Per data source: inputs, endpoints or file types, normalization rules, outputs. No UI.
4. **Normalization rules** — How names, types, and values are normalized for comparison (tokens, components).
5. **Cross-reference and analysis** — How sources are matched; how findings are categorized and severity assigned.
6. **Health score (or equivalent) computation** — Formula, weights, and inputs if the module has a score or metric.
7. **Artifact schemas and persistence** — Where artifacts are written (run directory); schema of main artifacts (report, tokens, components); config and credential storage rules.
8. **Renderer–job interaction contract** — How the UI gets data (only via `window.aro`: runs, logs, artifacts.read); no custom IPC unless documented; no Core in renderer.
9. **Performance, security, and cancellation** — AbortSignal usage; credential handling; rate limiting; partial failure behavior.
10. **Implementation slices** — P0/P1/P2 aligned with Design-spec; each slice implementable and testable independently; dependencies stated.

**Do not include:** UI copy, product rationale, visual design decisions, marketing language.

**Output location:** `docs/modules/<moduleKey>/Implementation-spec.md`.

---

## Step 4: Reconciliation

After both specs are drafted:

1. **Terminology** — Same names for views, jobs, and major concepts in both docs (e.g. “inspect:scan,” “Setup view,” “InspectReport”).
2. **Constraints** — Neither spec violates ARCHITECTURE, MODULE_ARCHITECTURE, MODULE_CONSTRAINTS. No direct DB/fs in module code; no Core in renderer.
3. **Scope and non-goals** — Design-spec non-goals and Implementation-spec scope match; no feature in one doc contradicts the other.
4. **Conflict resolution** — Resolve any PRD vs TRD conflict in favor of the TRD. Document assumptions in a short “Assumptions” subsection in Implementation-spec (or in both) if needed.

---

## Step 5: Iterative slicing

Both specs must express work as **shippable slices**, not a monolith.

1. For each **major capability** (e.g. Token Inventory, Component Inventory, Health Score):
   - **P0:** Minimum viable slice — smallest set that can be implemented, tested, and released.
   - **P1 / P2:** Follow-on slices that build on P0.
2. State **dependencies** between slices (e.g. “Health score depends on Token + Component pipelines”).
3. Ensure each slice can be **released independently** and tested without the next slice.
4. **Align** Design-spec “Release slices” with Implementation-spec “Implementation slices” so UX and engineering ship the same increments.

---

## Output summary

| Artifact | Path | Owner (conceptually) |
|----------|------|----------------------|
| Design-spec.md | `docs/modules/<moduleKey>/Design-spec.md` | Product Designer / UX; UI Engineer implements to it |
| Implementation-spec.md | `docs/modules/<moduleKey>/Implementation-spec.md` | Module Engineer / Core Engineer; implementation must satisfy it |

Create the directory `docs/modules/<moduleKey>/` if it does not exist. Both specs are long-lived references; avoid TODOs and speculative language. When in doubt, keep wording explicit and defer to the TRD and architecture docs.
