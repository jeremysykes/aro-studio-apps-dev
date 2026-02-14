// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Aro Studio — Architectural boundary enforcement.
 *
 * Each rule maps to one of the 10 documented architectural smells
 * (see docs/modules/MODULE_CONSTRAINTS.md and the hardening analysis).
 * Rules are grouped by the boundary they protect.
 */
export default tseslint.config(
  // ── Global ignores ─────────────────────────────────────────────────────────
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.js', '**/*.mjs', '!eslint.config.js', '.claude/**', 'dev/**'],
  },

  // ── Base: recommended rules for all TS/TSX files ───────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── Relax noisy recommended rules (pre-existing patterns) ──────────────────
  {
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',     // shadcn component props pattern
      '@typescript-eslint/no-unused-vars': ['warn', {        // allow underscore-prefixed unused vars
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },

  // ── Smell 1 — Core internal bypass ─────────────────────────────────────────
  // Modules must not import from @aro/core internals (src/, dist/infra).
  // Only the public barrel (@aro/core) is allowed.
  {
    files: ['packages/modules/**/*.ts', 'packages/modules/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@aro/core/src/*', '@aro/core/dist/*'], message: 'Import from @aro/core (public barrel) only. Direct internal imports bypass the API boundary.' },
        ],
      }],
    },
  },

  // ── Smell 2 — Node APIs in renderer / UI code ─────────────────────────────
  // Renderer, UI, and module UI code must not use Node built-ins.
  {
    files: [
      'apps/desktop/src/renderer/**/*.ts',
      'apps/desktop/src/renderer/**/*.tsx',
      'apps/web/src/client/**/*.ts',
      'apps/web/src/client/**/*.tsx',
      'packages/modules/**/ui/**/*.ts',
      'packages/modules/**/ui/**/*.tsx',
      'packages/ui/src/**/*.ts',
      'packages/ui/src/**/*.tsx',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'node:fs', message: 'Node filesystem APIs are forbidden in renderer/UI code.' },
          { name: 'node:path', message: 'Node path APIs are forbidden in renderer/UI code.' },
          { name: 'fs', message: 'Node filesystem APIs are forbidden in renderer/UI code.' },
          { name: 'path', message: 'Node path APIs are forbidden in renderer/UI code.' },
          { name: 'better-sqlite3', message: 'Direct database access is forbidden outside @aro/core.' },
        ],
        patterns: [
          { group: ['@aro/core/src/*', '@aro/core/dist/*'], message: 'Import from @aro/core (public barrel) only.' },
        ],
      }],
    },
  },

  // ── Smell 5 — Module renderer reading process.env ──────────────────────────
  // Config flows from host → shell → module, never self-sourced.
  {
    files: [
      'packages/modules/**/ui/**/*.ts',
      'packages/modules/**/ui/**/*.tsx',
      'packages/ui/src/**/*.ts',
      'packages/ui/src/**/*.tsx',
    ],
    rules: {
      'no-restricted-globals': ['error',
        { name: 'process', message: 'process.env is forbidden in renderer/UI code. Config should flow from the host.' },
      ],
    },
  },

  // ── Smell 7 — Bypass @aro/ui exports boundary ─────────────────────────────
  // Consumers must import from @aro/ui/components or @aro/ui/shell, never @aro/ui/src/*.
  {
    files: [
      'packages/modules/**/*.ts',
      'packages/modules/**/*.tsx',
      'apps/**/*.ts',
      'apps/**/*.tsx',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@aro/ui/src/*'], message: 'Import from @aro/ui/components or @aro/ui/shell. Direct src/ imports bypass the exports boundary.' },
        ],
      }],
    },
  },

  // ── Smell 10 — Shell importing module-specific code ────────────────────────
  // Shell layouts must be module-agnostic.
  {
    files: ['packages/ui/src/shell/**/*.ts', 'packages/ui/src/shell/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@aro/module-*'], message: 'Shell layouts must be module-agnostic. Do not import module-specific code.' },
        ],
      }],
    },
  },

  // ── Smell 1+2 cross-module imports ─────────────────────────────────────────
  // Modules must not import from each other (Constraint 1).
  {
    files: ['packages/modules/hello-world/**/*.ts', 'packages/modules/hello-world/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@aro/module-inspect', '@aro/module-inspect/*'], message: 'Modules must not import from each other (Constraint 1).' },
          { group: ['@aro/core/src/*', '@aro/core/dist/*'], message: 'Import from @aro/core (public barrel) only.' },
        ],
      }],
    },
  },
  {
    files: ['packages/modules/inspect/**/*.ts', 'packages/modules/inspect/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@aro/module-hello-world', '@aro/module-hello-world/*'], message: 'Modules must not import from each other (Constraint 1).' },
          { group: ['@aro/core/src/*', '@aro/core/dist/*'], message: 'Import from @aro/core (public barrel) only.' },
        ],
      }],
    },
  },

  // ── Smell 2 — Database access outside core ─────────────────────────────────
  // Only @aro/core may use better-sqlite3 (Constraint 2).
  {
    files: ['packages/modules/**/*.ts', 'apps/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'better-sqlite3', message: 'Direct database access is forbidden outside @aro/core (Constraint 2).' },
        ],
      }],
    },
  },

  // ── Relax rules for config/build files ─────────────────────────────────────
  {
    files: ['eslint.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
