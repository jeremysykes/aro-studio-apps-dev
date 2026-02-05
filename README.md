# aro-studio-apps-dev

Design-system application suite: Core (headless engine), Desktop (Electron host), and Modules (feature modules). Built as a single repo with clear layering and dependency rules.

## Run / build

```bash
pnpm install
pnpm build
pnpm test
```

See [package.json](package.json) for scripts.

## Documentation

Documentation lives in a separate repo: **[aro-studio-apps-docs](https://github.com/jeremysykes/aro-studio-apps-docs)**. It holds architecture, public API, ADRs, decisions, and diagrams.

- **Before coding:** Read the docs repo’s README, then follow that repo’s `cursor/rules` and `docs/ARCHITECTURE.md` and `docs/CORE_PUBLIC_API.md`.
- **Agent roles and execution order:** See `AGENTS.md` in the docs repo (or via the symlink in this repo).

This README stays focused on what this repo is and how to run it; “how to work with the architecture and rules” lives in the docs repo.

### Documentation symlinks

Documentation and rules are used in this repo via **relative symlinks** that are **committed**. When you clone this repo you get the symlinks; **check out the docs repo** in the same folder structure and they resolve—no extra commands needed.

**Expected layout:** The workspace root must contain both `knowledge` and `projects` (e.g. dev repo at `projects/aro-studio/aro-studio-apps-dev`, docs repo at `knowledge/aro-studio/aro-studio-apps-docs`).

Relative path from this repo’s root to the docs repo: `../../../knowledge/aro-studio/aro-studio-apps-docs`.

**If your layout is different**, from the dev repo root you can (re)create the symlinks. For `.cursor/rules`, create a real directory and symlink each file (so the IDE can open them):

```bash
DOCS_REL="../../../knowledge/aro-studio/aro-studio-apps-docs"
rm -rf docs && ln -s "$DOCS_REL/docs" docs
rm -rf .cursor/rules && mkdir -p .cursor/rules
ln -s "../../$DOCS_REL/cursor/rules/CURSOR_RULES.md" .cursor/rules/CURSOR_RULES.md
ln -s "../../$DOCS_REL/cursor/rules/README.md" .cursor/rules/README.md
rm -f AGENTS.md && ln -s "$DOCS_REL/AGENTS.md" AGENTS.md
rm -rf adr && ln -s "$DOCS_REL/adr" adr
rm -rf decisions && ln -s "$DOCS_REL/decisions" decisions
rm -rf diagrams && ln -s "$DOCS_REL/diagrams" diagrams
```

Optionally, run `./scripts/link-docs.sh` when the docs repo is at a non-standard path (if that script exists).

**If symlinked files don't show or open in the IDE:** Many editors don't follow symlinks that point outside the workspace root. Use a **multi-root workspace** that includes both this repo and the docs repo (e.g. a `.code-workspace` file with both `projects/aro-studio/aro-studio-apps-dev` and `knowledge/aro-studio/aro-studio-apps-docs`). Then the symlinked `docs` folder and other links resolve and are openable. **`.cursor/rules`** is a real directory with per-file symlinks into the docs repo's `cursor/rules`, so the rules files (e.g. CURSOR_RULES.md, README.md) open correctly from the tree.
