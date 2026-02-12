# Health Dashboard — Design re-evaluation

Senior product design re-evaluation of the Reports > Dashboard (Health) area, focusing on design hierarchy, typography, use of white space, and information hierarchy. Implementation reference: [Design-spec §9.4](Design-spec.md#94-health-dashboard-layout), [UI_ACCEPTANCE_CRITERIA](UI_ACCEPTANCE_CRITERIA.md).

---

## 1. Design hierarchy & typography hierarchy

**Current state**

- **Primary:** The composite score (e.g. 100) is the single hero: `text-5xl font-semibold`, with “/ 100” smaller and muted (`text-lg font-normal text-muted-foreground`). This correctly dominates the view.
- **Section labels:** “Health score”, “Score breakdown”, “Findings by severity” use `text-sm font-medium text-muted-foreground` — consistent, secondary to the score.
- **Body/secondary:** Breakdown list uses `text-xs`; severity badges use `text-xs`. Both read as supporting detail.

**Assessment**

- The large score vs. everything else works well and supports “score first” scanning.
- The “Health score” label is intentionally small and muted; its position (above the number) keeps it as a caption, which is acceptable. No change required unless the label needs to be more prominent for accessibility or onboarding.
- **Recommendation:** Keep the current typographic scale. Optionally consider a slightly stronger “Health score” label (e.g. `text-sm` with a touch more contrast) only if user research shows confusion; otherwise leave as is.

**Typography hierarchy (explicit)**

| Level | Role | Current | Notes |
|-------|------|---------|--------|
| 1 | Hero score | 5xl, semibold | Single focal number; do not reduce. |
| 2 | Score denominator / context | lg, normal, muted | Supports hero; keep smaller than score. |
| 3 | Section headings | sm, medium, muted | “Health score”, “Score breakdown”, “Findings by severity”. |
| 4 | Breakdown list & badge text | xs | Supporting detail; subordinate to headings. |

---

## 2. Element layout & white space

**Current state**

- Two-column grid at 900px+: left = health score (centred in column), right = score breakdown + findings by severity (stacked, vertically centred in column).
- Column gap: `gap-8` (32px). Section spacing on the right: `space-y-6` (24px). Score label-to-number: `mt-0.5`; section heading-to-content: `mt-2`.
- Left column has a lot of empty space; the score block is centred within it.

**Assessment**

- **Left column sparsity:** The emptiness is intentional — it isolates the score and reinforces importance. Acceptable for a “single focal point” layout. If it feels too empty, consider a subtle background tint or a light rule only; do not add competing content.
- **Vertical alignment:** The left block is vertically centred in its column; the right block is also vertically centred. So the **top** of the right content (e.g. “Score breakdown” heading) can sit lower than the **top** of the left score block, which can feel like a slight misalignment. Aligning the **top** of both content areas (e.g. `items-start` on the grid with consistent top padding) would create a clearer “content starts here” line and a more balanced frame.
- **Recommendation:** Prefer **top alignment** for the two columns so the first line of content (score label on the left, “Score breakdown” on the right) aligns horizontally. Keep vertical centring only if the design goal is “floating hero” over “aligned content bands”. Specify in Design-spec: “At 900px+, align the top of the left (health score) and right (breakdown + severity) content areas so the content bands share a common top baseline.”

**White-space rhythm**

- Keep `gap-8` between columns and `space-y-6` between “Score breakdown” and “Findings by severity”.
- Keep `mt-2` between section headings and their content; it’s tighter than the 24px section gap, which correctly differentiates in-block spacing from between-section spacing.

---

## 3. Information hierarchy (score → breakdown → severity)

**Intended order**

1. **Score** — Most important; user should see the composite first.
2. **Breakdown** — Next: how the score is made up (token consistency, component coverage, etc.).
3. **Severity badges** — Summary of findings by severity; supporting, at-a-glance.

**Current state**

- Score is left, large, and isolated → **correct**.
- Breakdown is right, above severity → **correct**.
- Severity badges are right, below breakdown, with restrained styling (tinted backgrounds or white + border, subtle shadow) → **correct**; they don’t compete with the score or the list.

**Assessment**

- Layout and visual weight already support score > breakdown > severity. No structural change needed.
- Ensure severity badges stay visually secondary: avoid large type, heavy borders, or saturated fills. Current treatment (small type, light tint or white + coloured border, shadow-xs) is appropriate.

**Recommendation**

- Document the hierarchy explicitly in Design-spec §9.4: “Information hierarchy: (1) composite health score, (2) score breakdown list, (3) findings-by-severity badges. Visual weight and placement must reflect this order.”
- Leave implementation as is; only refine if future feedback suggests the breakdown or badges are overpowering the score.

---

## 4. Summary of recommendations

| Area | Recommendation | Priority |
|------|----------------|----------|
| **Typography** | Keep current scale; optionally slightly strengthen “Health score” label only if research shows need. | Low |
| **Layout / alignment** | Prefer top alignment of left and right content areas so content bands share a common top baseline; document in Design-spec. | Medium |
| **White space** | Keep gap-8 and space-y-6; no change. | — |
| **Information hierarchy** | Document score > breakdown > severity in Design-spec; keep severity badges visually secondary. | Low (doc only) |

---

## 5. Design-spec and acceptance criteria updates

- **Design-spec §9.4:** Add (a) top alignment of the two content areas at 900px+ so content bands share a common top baseline, and (b) explicit information hierarchy: composite score → score breakdown → findings-by-severity; visual weight and order must reflect this.
- **UI_ACCEPTANCE_CRITERIA (Report view / Health Dashboard):** Add that the top of the health-score block and the top of the score-breakdown block align at 900px+ (content top alignment), and that severity badges remain visually secondary to the score and breakdown.
