# Future UI Models

Beyond the three implemented models (Standalone, Sidebar, Dashboard), the framework could support additional shell layouts. This document describes candidates for future implementation. Each would be a new `ARO_UI_MODEL` value.

See [MODULE_MODELS.md](../modules/MODULE_MODELS.md) for the three implemented models.

---

## Tabs

**Value:** `ARO_UI_MODEL=tabs`

A horizontal top-tab bar instead of a vertical sidebar. Each tab shows a module's full view. Lighter visual weight than the sidebar, better suited for 2-4 modules.

**When to use:**
- Browser-like navigation metaphor
- Fewer modules (2-4) where a sidebar feels heavy
- Horizontal screen layouts where vertical space is more valuable

**Rough structure:**
```
┌──────────────────────────────────┐
│  [Inspect] [Tokens] [Figma]     │  ← tab bar
├──────────────────────────────────┤
│                                  │
│     Active module full view      │
│                                  │
└──────────────────────────────────┘
```

---

## Command Palette

**Value:** `ARO_UI_MODEL=palette`

No persistent navigation. Modules are invoked via a ⌘K / Ctrl+K command palette overlay. The active module owns the full screen. Minimal chrome, power-user oriented.

**When to use:**
- Tools that live in the background
- Power users who prefer keyboard navigation
- Reduced visual clutter

**Rough structure:**
```
┌──────────────────────────────────┐
│                                  │
│     Active module full view      │
│                                  │
│   ┌────────────────────────┐     │
│   │ > Switch to Inspect... │     │  ← ⌘K overlay
│   │   Tokens               │     │
│   │   Figma                 │     │
│   └────────────────────────┘     │
└──────────────────────────────────┘
```

---

## Split / Panels

**Value:** `ARO_UI_MODEL=split`

Two or more modules visible side-by-side in resizable panes. Users drag dividers to allocate screen space. Useful for compare workflows.

**When to use:**
- Design tokens on the left, component audit on the right
- Side-by-side comparison between modules
- Reference + work pattern

**Rough structure:**
```
┌───────────────┬──────────────────┐
│               │                  │
│   Module A    │    Module B      │
│  (full view)  │   (full view)    │
│               │                  │
│               │                  │
└───────────────┴──────────────────┘
         ↕ draggable divider
```

---

## Carousel

**Value:** `ARO_UI_MODEL=carousel`

Swipe or arrow-key between modules, one at a time, no sidebar. Dot indicators or a progress bar show position. Mobile-friendly.

**When to use:**
- Presentation or demo mode
- Kiosk displays
- Mobile-first experiences
- Onboarding flows

**Rough structure:**
```
┌──────────────────────────────────┐
│                                  │
│     Active module full view      │
│                                  │
│         ← swipe / arrows →      │
│                                  │
│          ● ○ ○                   │  ← dot indicators
└──────────────────────────────────┘
```

---

## Embedded / Headless

**Value:** `ARO_UI_MODEL=embedded`

No shell at all. A single module renders as an iframe-embeddable widget or web component. For embedding features inside third-party tools.

**When to use:**
- Figma plugin panels
- VS Code sidebar webviews
- CMS admin panels
- Third-party integrations

**Rough structure:**
```
┌──────────────────────────────────┐
│  Third-party host (Figma, etc.) │
│  ┌────────────────────────────┐  │
│  │  Embedded module (iframe)  │  │
│  │  No shell chrome           │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Implementation notes:**
- Similar to Standalone but with additional constraints: no workspace picker, communication via postMessage
- Module receives config via URL params or postMessage instead of env vars
- May need a dedicated build output (web component or iframe bundle)

---

## Implementation Priority

| Model | Value | Effort | Priority |
|-------|-------|--------|----------|
| Tabs | Low | Low | Medium — quick win, reuses existing patterns |
| Command Palette | Medium | Medium | Low — niche use case |
| Split / Panels | High | High | Medium — high value for compare workflows |
| Carousel | Low | Low | Low — niche use case |
| Embedded | Medium | High | High — enables third-party integrations |
