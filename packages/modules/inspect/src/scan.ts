/**
 * inspect:scan — full flow: config, 5 phases, artifact write. Abort and progress.
 */
import type { JobContext } from '@aro/core';
import type {
  ScanInput,
  InspectReport,
  Token,
  Component,
} from './types.js';
import { ScanInputSchema } from './schemas.js';
import {
  scanCodeTokens,
  parseTokensFromContent,
} from './scanners/codeTokens.js';
import { scanFigma } from './scanners/figma.js';
import {
  scanStorybookFromUrl,
  scanStorybookFromPath,
} from './scanners/storybook.js';
import { crossReferenceTokens, crossReferenceComponents } from './analysis/crossReference.js';
import { generateFindings, findingsBySeverity } from './analysis/findings.js';
import { computeHealthScore } from './analysis/healthScore.js';

const CONFIG_PATH = 'inspect-config.json';

export async function runScan(
  ctx: JobContext,
  input: unknown
): Promise<InspectReport | null> {
  // Validate input with Zod
  const parseResult = ScanInputSchema.safeParse(input ?? {});
  let scanInput: ScanInput;
  if (parseResult.success) {
    scanInput = parseResult.data as ScanInput;
  } else {
    ctx.logger('warning', `Invalid scan input: ${parseResult.error.issues.map(i => i.message).join(', ')}. Using defaults.`);
    scanInput = {};
  }

  let config: ScanInput = scanInput;
  try {
    if (ctx.workspace.exists(CONFIG_PATH)) {
      const raw = ctx.workspace.readText(CONFIG_PATH);
      config = { ...JSON.parse(raw), ...scanInput };
    }
  } catch {
    // use input only
  }

  const sourcesScanned: string[] = [];
  let codeTokens: Token[] = [];
  let figmaTokens: Token[] = [];
  let figmaComponents: Array<{ name: string; layerName?: string }> = [];
  let storybookComponents: Component[] = [];

  ctx.progress?.(0);

  if (ctx.abort.aborted) return null;

  // Phase 1 & 3: Figma and Storybook run in parallel (both network I/O)
  const hasFigma = !!(config.figma?.fileKeys?.length && config.figma.pat);
  const hasStorybook = !!(config.storybook?.indexUrl || config.storybook?.indexPath);

  const figmaPromise = hasFigma
    ? (async () => {
        ctx.logger('info', 'Phase 1: Figma');
        try {
          const result = await scanFigma(
            config.figma!.fileKeys,
            config.figma!.pat!,
            ctx.abort,
            ctx.logger
          );
          figmaTokens = result.tokens;
          figmaComponents = result.componentNames;
          sourcesScanned.push('figma');
        } catch (e) {
          ctx.logger('warning', `Figma scan failed: ${e}`);
        }
      })()
    : Promise.resolve();

  const storybookPromise = hasStorybook
    ? (async () => {
        ctx.logger('info', 'Phase 3: Storybook');
        if (config.storybook?.indexUrl) {
          try {
            storybookComponents = await scanStorybookFromUrl(config.storybook.indexUrl);
            sourcesScanned.push('storybook');
          } catch (e) {
            ctx.logger('warning', `Storybook URL scan failed: ${e}`);
          }
        } else if (config.storybook?.indexPath) {
          try {
            storybookComponents = scanStorybookFromPath(
              ctx.workspace,
              config.storybook.indexPath
            );
            sourcesScanned.push('storybook');
          } catch (e) {
            ctx.logger('warning', `Storybook path scan failed: ${e}`);
          }
        }
      })()
    : Promise.resolve();

  // Run Figma and Storybook in parallel
  await Promise.all([figmaPromise, storybookPromise]);
  ctx.progress?.(0.5);

  if (ctx.abort.aborted) return null;

  // Phase 2: Code tokens (synchronous file reads, runs after parallel phases)
  if (config.codeTokens?.inline) {
    ctx.logger('info', 'Phase 2: Code tokens (inline)');
    try {
      codeTokens = parseTokensFromContent(
        config.codeTokens.inline,
        config.codeTokens.format
      );
    } catch (e) {
      ctx.logger('warning', `Inline token parsing failed: ${e}`);
    }
    sourcesScanned.push('code');
  }
  if (config.codeTokens?.paths?.length) {
    ctx.logger('info', 'Phase 2: Code tokens');
    try {
      const pathTokens = scanCodeTokens(
        ctx.workspace,
        config.codeTokens.paths,
        config.codeTokens.format,
        ctx.logger
      );
      codeTokens = [...codeTokens, ...pathTokens];
    } catch (e) {
      ctx.logger('warning', `Code token scan failed: ${e}`);
    }
    if (!sourcesScanned.includes('code')) sourcesScanned.push('code');
  }
  if ((config.codeTokens?.inline || config.codeTokens?.paths?.length) && codeTokens.length === 0) {
    ctx.logger('warning', 'Code tokens configured but no tokens produced. Check paths or inline JSON format (DTCG or Style Dictionary).');
  }
  ctx.progress?.(0.75);

  if (ctx.abort.aborted) return null;

  ctx.logger('info', 'Phase 4: Analysis');

  const tokenLists: { source: string; tokens: Token[] }[] = [];
  if (figmaTokens.length) tokenLists.push({ source: 'figma', tokens: figmaTokens });
  if (codeTokens.length) tokenLists.push({ source: codeTokens[0]?.source ?? 'code', tokens: codeTokens });
  const { merged: tokens, duplicateNames: dupNames, driftCandidates: drift } = crossReferenceTokens(tokenLists);

  const components = crossReferenceComponents(figmaComponents, storybookComponents);
  const findings = generateFindings(tokens, components, dupNames, drift);
  const findingsBySev = findingsBySeverity(findings);
  const healthScore = computeHealthScore(
    tokens,
    components,
    findings,
    dupNames,
    drift
  );

  const storybookBaseUrl =
    config.storybook?.indexUrl != null
      ? new URL(config.storybook.indexUrl).origin + '/'
      : undefined;

  const report: InspectReport = {
    version: 1,
    timestamp: Date.now(),
    sourcesScanned,
    tokens,
    components,
    findings,
    healthScore,
    summary: {
      totalTokens: tokens.length,
      totalComponents: components.length,
      findingsBySeverity: findingsBySev,
    },
    incomplete: ctx.abort.aborted,
    storybookBaseUrl,
  };

  // Persist config to workspace for next session
  try {
    const configToSave: Record<string, unknown> = {};
    if (config.figma?.fileKeys?.length) {
      configToSave.figma = { fileKeys: config.figma.fileKeys };
    }
    if (config.codeTokens?.paths?.length) {
      configToSave.codeTokens = { paths: config.codeTokens.paths };
    }
    if (config.storybook) {
      configToSave.storybook = { ...config.storybook };
    }
    if (Object.keys(configToSave).length > 0) {
      ctx.workspace.writeText(CONFIG_PATH, JSON.stringify(configToSave, null, 2));
    }
  } catch {
    // non-critical — config persistence is best-effort
  }

  ctx.progress?.(1.0);

  return report;
}
