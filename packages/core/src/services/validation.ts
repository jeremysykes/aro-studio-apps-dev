import { z } from 'zod';
import type { ValidationResult, ValidationIssue } from '../types.js';

// Minimal token schema for MVP: allow arbitrary object. Zod at boundary.
const tokensSchema = z.record(z.unknown());

export function createValidationService() {
  return {
    validateTokens(tokens: unknown): ValidationResult {
      const parsed = tokensSchema.safeParse(tokens);
      if (parsed.success) {
        return { ok: true };
      }
      const issues: ValidationIssue[] = parsed.error.errors.map((e) => ({
        path: e.path.join('.') || '(root)',
        message: e.message,
      }));
      return { ok: false, issues };
    },
  };
}

export type ValidationService = ReturnType<typeof createValidationService>;
