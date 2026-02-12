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
  const scanInput = (input ?? {}) as ScanInput;

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

  if (config.figma?.fileKeys?.length && config.figma.pat) {
    ctx.logger('info', 'Phase 1: Figma');
    try {
      const result = await scanFigma(
        config.figma.fileKeys,
        config.figma.pat,
        ctx.abort,
        ctx.logger
      );
      figmaTokens = result.tokens;
      figmaComponents = result.componentNames;
      sourcesScanned.push('figma');
    } catch (e) {
      ctx.logger('warning', `Figma scan failed: ${e}`);
    }
    ctx.progress?.(0.25);
  }

  if (ctx.abort.aborted) return null;

  if (config.codeTokens?.inline) {
    ctx.logger('info', 'Phase 2: Code tokens (inline)');
    codeTokens = parseTokensFromContent(
      config.codeTokens.inline,
      config.codeTokens.format
    );
    sourcesScanned.push('code');
  }
  if (config.codeTokens?.paths?.length) {
    ctx.logger('info', 'Phase 2: Code tokens');
    const pathTokens = scanCodeTokens(
      ctx.workspace,
      config.codeTokens.paths,
      config.codeTokens.format
    );
    codeTokens = [...codeTokens, ...pathTokens];
    if (!sourcesScanned.includes('code')) sourcesScanned.push('code');
  }
  if ((config.codeTokens?.inline || config.codeTokens?.paths?.length) && codeTokens.length === 0) {
    ctx.logger('warning', 'Code tokens configured but no tokens produced. Check paths or inline JSON format (DTCG or Style Dictionary).');
  }
  ctx.progress?.(0.5);

  if (ctx.abort.aborted) return null;

  if (config.storybook?.indexUrl) {
    ctx.logger('info', 'Phase 3: Storybook (URL)');
    try {
      storybookComponents = await scanStorybookFromUrl(config.storybook.indexUrl);
      sourcesScanned.push('storybook');
    } catch (e) {
      ctx.logger('warning', `Storybook URL scan failed: ${e}`);
    }
  } else if (config.storybook?.indexPath) {
    ctx.logger('info', 'Phase 3: Storybook (path)');
    storybookComponents = scanStorybookFromPath(
      ctx.workspace,
      config.storybook.indexPath
    );
    sourcesScanned.push('storybook');
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

  return report;
}
