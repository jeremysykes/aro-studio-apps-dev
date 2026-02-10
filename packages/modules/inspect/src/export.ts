/**
 * inspect:export — read report artifact for a run, export as CSV or markdown.
 */
import type { JobContext } from '@aro/core';
import type { ExportInput, InspectReport } from './types.js';

const ARTIFACTS_PREFIX = '.aro/artifacts/';

function reportToCsv(report: InspectReport): string {
  const rows: string[] = [];
  rows.push('Section,Name,Value,Type,Source');
  rows.push(`Health,Composite,${report.healthScore.composite},,`);
  rows.push(`Health,Token consistency,${report.healthScore.tokenConsistency},,`);
  rows.push(`Health,Component coverage,${report.healthScore.componentCoverage},,`);
  for (const t of report.tokens) {
    rows.push(`Token,${escapeCsv(t.name)},${escapeCsv(t.value)},${escapeCsv(t.type)},${escapeCsv(t.source)}`);
  }
  for (const c of report.components) {
    rows.push(`Component,${escapeCsv(c.name)},${escapeCsv(c.coverage.join(';'))},,${c.isOrphan}`);
  }
  return rows.join('\n');
}

function escapeCsv(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function reportToMarkdown(report: InspectReport): string {
  const lines: string[] = [];
  lines.push('# Inspect Report');
  lines.push('');
  lines.push(`**Composite score:** ${report.healthScore.composite}`);
  lines.push('');
  lines.push('## Tokens');
  lines.push('| Name | Type | Value | Source |');
  lines.push('|------|------|-------|--------|');
  for (const t of report.tokens.slice(0, 100)) {
    lines.push(`| ${t.name} | ${t.type} | ${t.value} | ${t.source} |`);
  }
  if (report.tokens.length > 100) {
    lines.push(`| ... | ${report.tokens.length - 100} more |`);
  }
  lines.push('');
  lines.push('## Components');
  lines.push('| Name | Coverage | Orphan |');
  lines.push('|------|----------|--------|');
  for (const c of report.components) {
    lines.push(`| ${c.name} | ${c.coverage.join(', ')} | ${c.isOrphan} |`);
  }
  return lines.join('\n');
}

export async function runExport(ctx: JobContext, input: unknown): Promise<void> {
  const { runId, format } = (input ?? {}) as ExportInput;
  if (!runId || !format || (format !== 'csv' && format !== 'markdown')) {
    ctx.logger('warning', 'inspect:export requires { runId, format: "csv" | "markdown" }');
    return;
  }
  const reportPath = `${ARTIFACTS_PREFIX}${runId}/report.json`;
  if (!ctx.workspace.exists(reportPath)) {
    ctx.logger('warning', `Report not found: ${reportPath}`);
    return;
  }
  let raw: string;
  try {
    raw = ctx.workspace.readText(reportPath);
  } catch (e) {
    ctx.logger('warning', `Failed to read report: ${e}`);
    return;
  }
  let report: InspectReport;
  try {
    report = JSON.parse(raw) as InspectReport;
  } catch {
    ctx.logger('warning', 'Invalid report JSON');
    return;
  }
  const content = format === 'csv' ? reportToCsv(report) : reportToMarkdown(report);
  const ext = format === 'csv' ? 'csv' : 'md';
  ctx.artifactWriter({ path: `inspect-export.${ext}`, content });
  ctx.logger('info', `Exported report as ${format}`);
}
