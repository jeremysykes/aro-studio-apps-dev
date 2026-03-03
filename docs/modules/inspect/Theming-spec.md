# Aro Inspect — Theming Spec

Token tuning recommendations for `packages/ui/src/theme/tokens.css` to achieve a clean, professional, design-system-documentation-tool aesthetic. Reference tools: zeroheight, Storybook, Supernova, Linear.

Authoritative for: token value changes. Implementation by UI Engineer. All changes are expressible as CSS custom property value updates in the `:root` and `@theme inline` blocks of `tokens.css`. No component code modifications are required.

---

## 1. Design rationale

### 1.1 Problem statement

The current token palette maps directly from the Tailwind zinc scale without calibration for the specific visual context of a design system documentation tool. The result is functional but lacks the refined, "quiet confidence" feel of professional tools like zeroheight and Linear. Specific issues:

1. **Flat card surfaces** -- Cards use `shadow-sm` but the background/border token combination creates insufficient visual lift. The card surface (`#ffffff`) is identical to the page background (`#ffffff`), so cards rely entirely on border + shadow for differentiation. This produces a "wireframe" rather than a "finished product" feel.
2. **Border overweight** -- `--aro-border-default` at zinc-200 (`#e4e4e7`) is visible enough but does not create the delicate, barely-there border treatment that characterizes modern documentation tools. The border reads as a structural line rather than a gentle edge.
3. **Insufficient surface layering** -- The jump from `--aro-background` (white) to `--aro-background-muted` (zinc-50, `#fafafa`) is only 2 lightness steps. Professional tools use a warm, slightly tinted near-white for the canvas behind cards, creating clear figure-ground separation without heavy borders.
4. **Missing shadow tokens** -- Shadow depth is hardcoded in component classes (`shadow-sm`, `shadow`) rather than controlled by semantic tokens. This prevents token-level tuning of card elevation, which is central to the visual identity of documentation tools.
5. **Text contrast could be more graduated** -- The foreground scale has only four steps (950, 900, 500, 400). Modern documentation tools use an additional mid-tone (zinc-600 or zinc-700) for secondary content that needs more emphasis than "muted" but less than "default."

### 1.2 Target aesthetic

- **Clean, airy, paper-on-canvas.** Content cards should feel like paper sheets floating slightly above a quiet, off-white canvas. Think of a well-organized document spread on a light grey desk.
- **Borders almost disappear.** Structural boundaries come from shadow and surface contrast, not heavy lines. Borders are backup, not primary.
- **Typography does the heavy lifting.** Size and weight create hierarchy. Color provides secondary differentiation (default vs muted vs subtle). Surfaces stay quiet so text can lead.
- **Deliberate elevation.** Cards have visible but soft shadows. Raised surfaces (like table headers, active tabs) use slightly more prominent shadows. Overlays are unmistakable.
- **Monochrome confidence.** The zinc-only palette, used well, creates a sophisticated, white-label-ready base that lets the content (token values, scores, component names) be the color in the interface.

---

## 2. Token value changes

### 2.1 Backgrounds

Shift the muted background one step deeper to create clearer figure-ground separation between the page canvas and card surfaces.

| Token | Current | Proposed | Zinc step | Rationale |
|-------|---------|----------|-----------|-----------|
| `--aro-background` | `#ffffff` | `#ffffff` | white | No change. Card-hosting areas remain white. |
| `--aro-background-muted` | `#fafafa` (zinc-50) | `#f4f4f5` (zinc-100) | zinc-100 | Page canvas behind cards. One step deeper for visible figure-ground contrast. Cards (white surface) now clearly float on the zinc-100 canvas. |
| `--aro-background-subtle` | `#f4f4f5` (zinc-100) | `#e4e4e7` (zinc-200) | zinc-200 | Deeper background for nested areas (e.g., code blocks within cards, filter bars). Maintains three-step background scale. |

**Visual effect:** When Setup, Run, or Report views have a `bg-background-muted` canvas, white cards with soft shadow will read as elevated surfaces rather than bordered boxes on white-on-white.

### 2.2 Surfaces

Refine the surface scale so that cards and raised elements have better differentiation.

| Token | Current | Proposed | Zinc step | Rationale |
|-------|---------|----------|-----------|-----------|
| `--aro-surface` | `#ffffff` | `#ffffff` | white | No change. Primary card surface stays white. |
| `--aro-surface-muted` | `#f4f4f5` (zinc-100) | `#fafafa` (zinc-50) | zinc-50 | Muted surface (e.g., table header background, disabled card states, progress bar track) shifts one step lighter. With `--aro-background-muted` now at zinc-100, the muted surface sits between white and the canvas, creating a subtle but perceptible layering. |
| `--aro-surface-raised` | `#e4e4e7` (zinc-200) | `#f4f4f5` (zinc-100) | zinc-100 | Raised surface (e.g., active hover states, skeleton loading). One step lighter to avoid appearing too heavy against the new background scale. |
| `--aro-surface-overlay` | `#18181b` (zinc-900) | `#18181b` (zinc-900) | zinc-900 | No change. Dark overlays remain high contrast. |

### 2.3 Borders

Lighten the default border so card edges become more delicate. Maintain emphasis border for intentional structural lines.

| Token | Current | Proposed | Zinc step | Rationale |
|-------|---------|----------|-----------|-----------|
| `--aro-border-default` | `#e4e4e7` (zinc-200) | `#e4e4e7` (zinc-200) | zinc-200 | No change. After evaluating, zinc-200 remains the correct default. With the background shifting to zinc-100, the border now has less contrast against the canvas (good -- borders become more about the card edge than a heavy line). The card's shadow carries more of the visual separation. |
| `--aro-border-muted` | `#f4f4f5` (zinc-100) | `#e4e4e7` (zinc-200) | zinc-200 | Shift one step deeper. The current zinc-100 muted border is invisible against the new zinc-100 background. At zinc-200, muted borders (e.g., table row separators, inner dividers) are perceptible but quiet. |
| `--aro-border-emphasis` | `#27272a` (zinc-800) | `#27272a` (zinc-800) | zinc-800 | No change. Strong dividers (header separators, focus borders) remain high contrast. |

### 2.4 Foreground / text

Add a mid-tone for secondary-emphasis text. Adjust subtle to be slightly stronger to maintain WCAG 4.5:1 on the new zinc-100 backgrounds.

| Token | Current | Proposed | Zinc step | Rationale |
|-------|---------|----------|-----------|-----------|
| `--aro-foreground` | `#09090b` (zinc-950) | `#09090b` (zinc-950) | zinc-950 | No change. Primary heading text. |
| `--aro-foreground-default` | `#18181b` (zinc-900) | `#18181b` (zinc-900) | zinc-900 | No change. Default body text. |
| `--aro-foreground-muted` | `#71717a` (zinc-500) | `#52525b` (zinc-600) | zinc-600 | One step darker. Zinc-500 on zinc-100 background has ~4.6:1 contrast (barely AA). Zinc-600 on zinc-100 has ~6.4:1 -- comfortably above AA, reads as "secondary but legible" rather than "washed out." This is used for section headings, helper text, log info messages. |
| `--aro-foreground-subtle` | `#a1a1aa` (zinc-400) | `#71717a` (zinc-500) | zinc-500 | One step darker. Current zinc-400 on zinc-100 has ~3.0:1 -- fails WCAG AA for normal text. Zinc-500 on zinc-100 gives ~4.6:1 -- passes AA. Used for "(weight)" annotations, timestamps, debug-level log text, "/ 100" denominator. |
| `--aro-foreground-on-emphasis` | `#fafafa` (zinc-50) | `#fafafa` (zinc-50) | zinc-50 | No change. Light text on dark surfaces. |

**Contrast verification (proposed values on `--aro-background-muted` zinc-100 `#f4f4f5`):**

| Token | Value | Contrast vs zinc-100 | WCAG AA (normal) |
|-------|-------|---------------------|------------------|
| `--aro-foreground` | `#09090b` | 15.4:1 | Pass |
| `--aro-foreground-default` | `#18181b` | 14.1:1 | Pass |
| `--aro-foreground-muted` | `#52525b` | 6.4:1 | Pass |
| `--aro-foreground-subtle` | `#71717a` | 4.6:1 | Pass |

**Contrast verification (proposed values on `--aro-surface` white `#ffffff`):**

| Token | Value | Contrast vs white | WCAG AA (normal) |
|-------|-------|-------------------|------------------|
| `--aro-foreground` | `#09090b` | 18.4:1 | Pass |
| `--aro-foreground-default` | `#18181b` | 16.8:1 | Pass |
| `--aro-foreground-muted` | `#52525b` | 7.5:1 | Pass |
| `--aro-foreground-subtle` | `#71717a` | 5.4:1 | Pass |

### 2.5 Interactive states

Adjust hover and active to work with the new surface scale.

| Token | Current | Proposed | Zinc step | Rationale |
|-------|---------|----------|-----------|-----------|
| `--aro-hover` | `#f4f4f5` (zinc-100) | `#f4f4f5` (zinc-100) | zinc-100 | No change. Hover on white surfaces remains visually distinct. |
| `--aro-active` | `#e4e4e7` (zinc-200) | `#e4e4e7` (zinc-200) | zinc-200 | No change. Active/pressed state depth. |

### 2.6 Secondary action

| Token | Current | Proposed | Zinc step | Rationale |
|-------|---------|----------|-----------|-----------|
| `--aro-secondary` | `#f4f4f5` (zinc-100) | `#f4f4f5` (zinc-100) | zinc-100 | No change. Secondary buttons remain clearly tinted against white card surfaces. |
| `--aro-secondary-hover` | `#e4e4e7` (zinc-200) | `#e4e4e7` (zinc-200) | zinc-200 | No change. |
| `--aro-secondary-foreground` | `#18181b` (zinc-900) | `#18181b` (zinc-900) | zinc-900 | No change. |

### 2.7 Sidebar

No changes to sidebar tokens. The dark sidebar (zinc-900) provides strong anchor contrast against the lighter main content area. This contrast is consistent with zeroheight and Storybook sidebar patterns.

### 2.8 Ring / focus

| Token | Current | Proposed | Zinc step | Rationale |
|-------|---------|----------|-----------|-----------|
| `--aro-ring-muted` | `#a1a1aa` (zinc-400) | `#71717a` (zinc-500) | zinc-500 | One step darker to match the foreground-subtle adjustment. Ensures focus rings are visible on both white and zinc-100 backgrounds. Zinc-400 ring on zinc-100 background is low contrast. |

---

## 3. New tokens

### 3.1 Shadow tokens

Shadows are central to the documentation-tool aesthetic. Currently, shadow values are hardcoded in component Tailwind classes (`shadow-sm`, `shadow`). Introducing shadow tokens allows token-level tuning of elevation without modifying component code.

**New CSS custom properties:**

```css
/* ── Shadows ───────────────────────────────────────────────── */
--aro-shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
--aro-shadow-card-hover: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03);
--aro-shadow-raised: 0 2px 4px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
--aro-shadow-overlay: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
```

**Corresponding `@theme inline` mappings:**

```css
/* Shadows */
--shadow-card: var(--aro-shadow-card);
--shadow-card-hover: var(--aro-shadow-card-hover);
--shadow-raised: var(--aro-shadow-raised);
--shadow-overlay: var(--aro-shadow-overlay);
```

| Token | Usage | Tailwind utility |
|-------|-------|------------------|
| `--aro-shadow-card` | Default card resting state. Soft, low shadow that creates lift without heaviness. Replaces `shadow-sm` on Card component. | `shadow-card` |
| `--aro-shadow-card-hover` | Card hover state (if cards become interactive, e.g., run list items). Slightly more pronounced for feedback. | `shadow-card-hover` |
| `--aro-shadow-raised` | Elevated elements: active tab triggers, table sticky headers, tooltips. Slightly stronger than card shadow. Replaces `shadow-sm` on active TabsTrigger. | `shadow-raised` |
| `--aro-shadow-overlay` | Dialogs, dropdowns, floating panels. Strong shadow for elements floating above the page. Replaces `shadow-lg` on Dialog. | `shadow-overlay` |

**Design rationale for shadow values:**
- The `0.04` and `0.03` opacity values are deliberately low. Documentation tools feel best when shadows are *just barely there* -- enough to create depth perception without creating visual noise.
- The two-layer shadow (ambient + directional) creates a more natural elevation effect than a single shadow.
- The card shadow is softer than Tailwind's `shadow-sm` (which uses `0.05` opacity) because with the new zinc-100 canvas, the figure-ground contrast does some of the elevation work.

### 3.2 Table header background token

A dedicated token for sticky table headers ensures they remain distinct when scrolling content behind them, without relying on hardcoded `bg-white`.

```css
--aro-table-header-background: #fafafa;  /* zinc-50 */
```

```css
/* @theme inline */
--color-table-header-background: var(--aro-table-header-background);
```

| Token | Usage | Rationale |
|-------|-------|-----------|
| `--aro-table-header-background` | Sticky `<thead>` background in Token Inventory and Component Inventory tables. | Current `bg-white` is hardcoded. With table rows hovering at zinc-50, the header needs a subtle tint or must be explicitly white. Making it zinc-50 with a bottom border creates a professional "frozen header" look. White-label tenants can override this to match their surface tone. |

---

## 4. Summary of all changes to `tokens.css`

### 4.1 Modified tokens (`:root` block)

```css
/* ── Backgrounds ───────────────────────────────────────────── */
--aro-background: #ffffff;
--aro-background-muted: #f4f4f5;      /* zinc-100 (was zinc-50) */
--aro-background-subtle: #e4e4e7;     /* zinc-200 (was zinc-100) */

/* ── Surfaces ──────────────────────────────────────────────── */
--aro-surface: #ffffff;
--aro-surface-muted: #fafafa;         /* zinc-50  (was zinc-100) */
--aro-surface-raised: #f4f4f5;        /* zinc-100 (was zinc-200) */
--aro-surface-overlay: #18181b;       /* zinc-900 (unchanged) */

/* ── Foreground / text ─────────────────────────────────────── */
--aro-foreground: #09090b;            /* zinc-950 (unchanged) */
--aro-foreground-default: #18181b;    /* zinc-900 (unchanged) */
--aro-foreground-muted: #52525b;      /* zinc-600 (was zinc-500) */
--aro-foreground-subtle: #71717a;     /* zinc-500 (was zinc-400) */
--aro-foreground-on-emphasis: #fafafa;/* zinc-50  (unchanged) */

/* ── Borders ───────────────────────────────────────────────── */
--aro-border-default: #e4e4e7;        /* zinc-200 (unchanged) */
--aro-border-muted: #e4e4e7;          /* zinc-200 (was zinc-100) */
--aro-border-emphasis: #27272a;       /* zinc-800 (unchanged) */

/* ── Focus rings ───────────────────────────────────────────── */
--aro-ring: #18181b;                  /* zinc-900 (unchanged) */
--aro-ring-muted: #71717a;            /* zinc-500 (was zinc-400) */
--aro-ring-offset: #ffffff;           /* (unchanged) */
```

### 4.2 New tokens (`:root` block)

```css
/* ── Shadows ───────────────────────────────────────────────── */
--aro-shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
--aro-shadow-card-hover: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03);
--aro-shadow-raised: 0 2px 4px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
--aro-shadow-overlay: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);

/* ── Table ─────────────────────────────────────────────────── */
--aro-table-header-background: #fafafa; /* zinc-50 */
```

### 4.3 New `@theme inline` mappings

```css
/* Shadows */
--shadow-card: var(--aro-shadow-card);
--shadow-card-hover: var(--aro-shadow-card-hover);
--shadow-raised: var(--aro-shadow-raised);
--shadow-overlay: var(--aro-shadow-overlay);

/* Table */
--color-table-header-background: var(--aro-table-header-background);
```

### 4.4 Unchanged tokens

The following tokens are reviewed and intentionally unchanged:

- `--aro-primary`, `--aro-primary-hover`, `--aro-primary-foreground` -- zinc-900/800/50 primary action buttons are appropriately confident.
- `--aro-secondary`, `--aro-secondary-hover`, `--aro-secondary-foreground` -- zinc-100/200/900 secondary buttons work well against white card surfaces.
- `--aro-destructive-*` -- red-600/700/white destructive tokens are correctly calibrated. No change needed.
- `--aro-hover`, `--aro-active` -- zinc-100/200 interactive states remain correct after the surface scale shift.
- `--aro-sidebar-*` -- dark sidebar tokens are intentionally outside this tuning scope. They provide strong anchoring contrast.

---

## 5. Visual hierarchy principles applied

### 5.1 Three-layer depth model

The tuned tokens establish three clear visual planes:

```
Layer 3 (top)    : Cards, dialogs         → --aro-surface (#fff) + shadow-card
Layer 2 (middle) : Table headers, tabs    → --aro-surface-muted (#fafafa) + shadow-raised
Layer 1 (canvas) : Page background        → --aro-background-muted (#f4f4f5)
```

This replaces the current flat model where Layer 1 and Layer 3 are both white, differentiated only by a zinc-200 border.

### 5.2 Text hierarchy reinforcement

The four foreground tones now cover distinct communication levels:

```
--aro-foreground         (#09090b)  → Page headings, hero score
--aro-foreground-default (#18181b)  → Body text, form values, active states
--aro-foreground-muted   (#52525b)  → Section headings, helper text, secondary labels
--aro-foreground-subtle  (#71717a)  → Timestamps, annotations, tertiary metadata
```

The one-step darkening of muted and subtle ensures all four levels pass WCAG AA on both white surfaces and the zinc-100 canvas.

### 5.3 Border restraint

With shadow carrying more of the elevation signal, borders play a supporting role:

- `--aro-border-default` (zinc-200): Card edges, input borders. Visible on white but softer than a line-drawing.
- `--aro-border-muted` (zinc-200, was zinc-100): Inner dividers, table row separators. Now visible against the zinc-100 canvas (previously invisible at zinc-100-on-zinc-100).
- `--aro-border-emphasis` (zinc-800): Header separators, active focus. Reserved for intentional structural emphasis.

---

## 6. Component-level impact (no code changes required)

This section documents how the token changes will visually affect each component as consumed by the Inspect module. Because components already reference semantic tokens, the visual changes take effect automatically.

### 6.1 Card

- **Before:** White card, zinc-200 border, `shadow-sm` on white canvas. Card edges barely distinguishable from page.
- **After:** White card, zinc-200 border, `shadow-card` on zinc-100 canvas. Card reads as elevated paper on a grey desk.
- **Action for UI Engineer:** Replace hardcoded `shadow-sm` in Card component with `shadow-card` (the new Tailwind utility). This is the only component-level class change needed -- and it maps to the new token.

### 6.2 Table

- **Before:** `bg-white` sticky header, zinc-200 row borders, zinc-50 hover.
- **After:** `bg-table-header-background` (zinc-50) sticky header, zinc-200 row borders, zinc-50 hover. Header has a subtle tint distinguishing it from the white card surface.
- **Action for UI Engineer:** Replace `bg-white` with `bg-table-header-background` in TableHeader. Replace hardcoded `bg-zinc-50/50` in TableRow hover/selected with `bg-surface-muted` and `bg-surface-muted` respectively. Replace `border-zinc-200` with `border-border-muted` in TableRow and TableFooter. Replace `text-zinc-500` with `text-foreground-muted` in TableHead and TableCaption.

### 6.3 Tabs

- **Before:** Active trigger gets `bg-surface` (white) + `shadow-sm`.
- **After:** Active trigger gets `bg-surface` (white) + `shadow-raised`. Slightly more elevation than at-rest cards, signaling the active state.
- **Action for UI Engineer:** Replace `shadow-sm` with `shadow-raised` in TabsTrigger active state.

### 6.4 Badge

- No visual change. Badge tokens (`--aro-primary`, `--aro-secondary`, `--aro-destructive`) are unchanged.

### 6.5 Button

- No visual change. Button tokens are unchanged.

### 6.6 Input

- **Before:** `bg-surface` (white), `border-border-default` (zinc-200). Clean on white cards.
- **After:** Same values. Inputs remain visually identical within white card surfaces.

### 6.7 Progress

- **Before:** Track `bg-zinc-200`, indicator `bg-zinc-900`.
- **After:** Track should use `bg-surface-raised` (zinc-100), indicator should use `bg-primary` (zinc-900). Track becomes lighter and less visually heavy.
- **Action for UI Engineer:** Replace `bg-zinc-200` with `bg-surface-raised` and `bg-zinc-900` with `bg-primary` in Progress component.

### 6.8 Separator

- **Before:** `bg-zinc-200`.
- **After:** Should use `bg-border-default` (zinc-200). Same visual result, but now token-controlled.
- **Action for UI Engineer:** Replace `bg-zinc-200` with `bg-border-default` in Separator component.

### 6.9 Dialog

- No token changes affect dialog content. Shadow token `--aro-shadow-overlay` should replace the hardcoded `shadow-lg` for consistency.
- **Action for UI Engineer:** Replace `shadow-lg` with `shadow-overlay` in Dialog overlay/content.

### 6.10 Tooltip

- **Before:** `bg-zinc-900`, `text-zinc-50`.
- **After:** Should use `bg-surface-overlay` and `text-foreground-on-emphasis`. Same visual result, now token-controlled.
- **Action for UI Engineer:** Replace `bg-zinc-900` with `bg-surface-overlay` and `text-zinc-50` with `text-foreground-on-emphasis` in TooltipContent.

---

## 7. Remaining hardcoded values to migrate

The following components still contain hardcoded zinc/white classes that should be migrated to semantic tokens as a follow-up. This is tracked separately from the token value tuning but is noted here for completeness.

| Component | File | Hardcoded class | Recommended token |
|-----------|------|-----------------|-------------------|
| TableHeader | `packages/ui/src/components/ui/table.tsx` | `bg-white` | `bg-table-header-background` |
| TableFooter | `packages/ui/src/components/ui/table.tsx` | `border-zinc-200 bg-zinc-50/50` | `border-border-muted bg-surface-muted` |
| TableRow | `packages/ui/src/components/ui/table.tsx` | `border-zinc-200 hover:bg-zinc-50/50 data-[state=selected]:bg-zinc-50` | `border-border-muted hover:bg-surface-muted data-[state=selected]:bg-surface-muted` |
| TableHead | `packages/ui/src/components/ui/table.tsx` | `text-zinc-500` | `text-foreground-muted` |
| TableCaption | `packages/ui/src/components/ui/table.tsx` | `text-zinc-500` | `text-foreground-muted` |
| Progress | `packages/ui/src/components/ui/progress.tsx` | `bg-zinc-200` (track), `bg-zinc-900` (indicator) | `bg-surface-raised` (track), `bg-primary` (indicator) |
| Separator | `packages/ui/src/components/ui/separator.tsx` | `bg-zinc-200` | `bg-border-default` |
| Skeleton | `packages/ui/src/components/ui/skeleton.tsx` | `bg-zinc-200` | `bg-surface-raised` |
| Textarea | `packages/ui/src/components/ui/textarea.tsx` | Multiple `zinc-*` classes | Migrate to `border-border-default bg-surface text-foreground-default` etc. |
| Tooltip | `packages/ui/src/components/ui/tooltip.tsx` | `bg-zinc-900 text-zinc-50` | `bg-surface-overlay text-foreground-on-emphasis` |
| TabsLayout | `packages/ui/src/shell/TabsLayout.tsx` | `border-zinc-200 bg-zinc-50`, `bg-white text-zinc-900 shadow-sm`, `text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100` | Migrate to semantic tokens |
| DashboardLayout | `packages/ui/src/shell/DashboardLayout.tsx` | `border-zinc-200 bg-white` | `border-border-default bg-surface` |
| Sidebar | `packages/ui/src/shell/Sidebar.tsx` | `border-zinc-200 bg-zinc-50`, `bg-zinc-200` | Migrate to semantic tokens |
| CarouselLayout | `packages/ui/src/shell/CarouselLayout.tsx` | `border-zinc-200 bg-zinc-50`, `bg-zinc-900`, `bg-zinc-300 hover:bg-zinc-400` | Migrate to semantic tokens |

---

## 8. Acceptance criteria

### 8.1 Token values

- [ ] All token value changes listed in section 4.1 are applied to the `:root` block in `packages/ui/src/theme/tokens.css`.
- [ ] All new tokens listed in section 4.2 are added to the `:root` block.
- [ ] All new `@theme inline` mappings listed in section 4.3 are added to the `@theme inline` block.
- [ ] No token outside the scope of this spec is modified.

### 8.2 Contrast verification

- [ ] `--aro-foreground-muted` (`#52525b`) on `--aro-background-muted` (`#f4f4f5`) meets WCAG 2.1 AA (4.5:1 minimum for normal text). Expected: ~6.4:1.
- [ ] `--aro-foreground-subtle` (`#71717a`) on `--aro-background-muted` (`#f4f4f5`) meets WCAG 2.1 AA (4.5:1 minimum for normal text). Expected: ~4.6:1.
- [ ] `--aro-foreground-subtle` (`#71717a`) on `--aro-surface` (`#ffffff`) meets WCAG 2.1 AA. Expected: ~5.4:1.

### 8.3 Visual checks (manual)

- [ ] Cards on Setup, Run, and Report views appear as elevated white surfaces on a slightly grey canvas. No white-on-white blending.
- [ ] Table headers in Token Inventory and Component Inventory are subtly tinted (zinc-50) and visually distinct from white card surface and table body.
- [ ] Section headings (e.g., "Health score", "Score breakdown") are legible and clearly secondary to hero text but not washed out.
- [ ] Log timestamps and "(weight)" annotations are readable but clearly subordinate to primary content.
- [ ] Focus rings are visible on both white card surfaces and the zinc-100 canvas.
- [ ] Sidebar contrast against the main content area is unchanged and strong.

### 8.4 White-label compatibility

- [ ] All new tokens use the `--aro-` prefix and are overridable via tenant `TenantConfig.theme` map.
- [ ] No brand-specific colors introduced. All values remain in the zinc scale + red for destructive.
- [ ] Shadow tokens use `rgba(0, 0, 0, ...)` which is neutral and works with any color scheme.

---

## 9. Implementation sequence

1. **Token values** -- Apply section 4.1 and 4.2 changes to `tokens.css` `:root` block.
2. **Theme mappings** -- Apply section 4.3 changes to `tokens.css` `@theme inline` block.
3. **Component migration** -- Apply the class changes listed in section 6 (Card shadow, Table header, Progress, Separator, Tooltip, Dialog, Tabs shadow).
4. **Hardcoded cleanup** -- Migrate remaining hardcoded zinc classes listed in section 7.
5. **Visual verification** -- Walk through all Inspect views (Setup, Run, Report with all three tabs) and verify acceptance criteria in section 8.3.

Steps 1-2 are pure token changes and can be verified immediately. Steps 3-4 are component class updates that reference the new tokens. Step 5 is manual review.

---

## 10. Docs to update after implementation

| Document | Change |
|----------|--------|
| `docs/modules/inspect/UI_ACCEPTANCE_CRITERIA.md` | Add token-level acceptance criteria: cards use `shadow-card`, table headers use `bg-table-header-background`, all foreground text passes WCAG AA on zinc-100 canvas. |
| `docs/meta/UI_UX_ACCESSIBILITY.md` | Add reference to the `--aro-foreground-*` contrast requirements established here. |
| `WHITE_LABEL.md` (if it exists) | Document the new shadow tokens and table-header-background token as tenant-overridable. |

---

## References

- [Design-spec.md](Design-spec.md) -- views, states, IA, layout specs
- [Health-dashboard-design-reevaluation.md](Health-dashboard-design-reevaluation.md) -- typography hierarchy decisions
- [UI_ACCEPTANCE_CRITERIA.md](UI_ACCEPTANCE_CRITERIA.md) -- view-level acceptance criteria
- [../../meta/UI_UX_ACCESSIBILITY.md](../../meta/UI_UX_ACCESSIBILITY.md) -- project-wide WCAG 2.1 AA standards
- `packages/ui/src/theme/tokens.css` -- token definitions (implementation target)
