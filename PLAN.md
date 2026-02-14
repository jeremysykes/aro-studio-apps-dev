# Plan: Fix Error Message Rendering via shadcn Theme Foundation

## Problem

Error messages using `<Alert variant="destructive">` render incorrectly because the shadcn semantic CSS variables are not defined. The alert component uses classes like `bg-card`, `text-destructive`, `text-muted-foreground`, `border-destructive` — but only `--destructive` is registered with Tailwind. The rest (`--card`, `--border`, `--muted-foreground`) don't exist, so those utility classes produce no CSS output and the component falls back to broken rendering.

## Root Cause

A theme-layer gap. The project has Tailwind v4 with `@theme inline` but only registered two tokens (`--color-destructive`, `--color-destructive-foreground`). The full set of shadcn semantic tokens needed by the Alert component were never defined.

## Steps

### Step 1 — Add shadcn semantic tokens to `tokens.css`

**File:** `packages/ui/src/theme/tokens.css`

Define the HSL-format CSS variables that shadcn components expect, in both `:root` and `.dark`. Register them with Tailwind via `@theme inline`. This replaces the need for a `tailwind.config.ts` (Tailwind v4 uses CSS-based config).

Tokens to add: `--background`, `--foreground`, `--card`, `--card-foreground`, `--border`, `--muted`, `--muted-foreground`. Update `--destructive` and `--destructive-foreground` to use HSL format for consistency.

### Step 2 — Update `alert.tsx` destructive variant to use token classes

Replace hardcoded colors with the official shadcn token-based classes:

- Default variant: `bg-card text-card-foreground`
- Destructive variant: `border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive`
- AlertDescription: `text-muted-foreground` instead of `text-zinc-500 dark:text-zinc-400`

No structural changes. No new components. No class overrides at call sites.

### Step 3 — Verify

- Build passes
- `bg-card`, `text-destructive`, `text-muted-foreground`, `border-destructive` appear in built CSS
- Alert renders with proper red destructive styling, correct background contrast, proper border, correct dark mode
- 73 tests pass

## Files Modified

| File | Change |
|------|--------|
| `packages/ui/src/theme/tokens.css` | Add shadcn semantic tokens + expand `@theme inline` |
| `packages/ui/src/components/ui/alert.tsx` | Replace hardcoded colors with token classes |
