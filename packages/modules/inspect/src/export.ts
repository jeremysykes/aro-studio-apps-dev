/**
 * inspect:export — read report artifact for a run, export as CSV, markdown, or PDF.
 */
import type { JobContext } from '@aro/core';
import type { ExportInput, InspectReport } from './types.js';
import { ExportInputSchema } from './schemas.js';
import PDFDocument from 'pdfkit';

const ARTIFACTS_PREFIX = '.aro/artifacts/';

const ROW_HEIGHT = 18;
const PAGE_MARGIN = 50;
const BOTTOM_MARGIN = 50;

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
    const displayName =
      c.coverage.includes('figma') && c.layerName
        ? `${c.layerName}, ${c.name}`
        : c.name;
    rows.push(`Component,${escapeCsv(displayName)},${escapeCsv(c.coverage.join(';'))},,${c.isOrphan}`);
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
  for (const t of report.tokens) {
    lines.push(`| ${t.name} | ${t.type} | ${t.value} | ${t.source} |`);
  }
  lines.push('');
  lines.push('## Components');
  lines.push('| Name | Coverage | Orphan |');
  lines.push('|------|----------|--------|');
  for (const c of report.components) {
    const displayName =
      c.coverage.includes('figma') && c.layerName
        ? `${c.layerName}, ${c.name}`
        : c.name;
    lines.push(`| ${displayName} | ${c.coverage.join(', ')} | ${c.isOrphan} |`);
  }
  return lines.join('\n');
}

async function reportToPdf(report: InspectReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - PAGE_MARGIN * 2;
    const checkPageBreak = (needLines = 1) => {
      if (doc.y + needLines * ROW_HEIGHT > doc.page.height - BOTTOM_MARGIN) {
        doc.addPage();
      }
    };

    doc.fontSize(20).text('Inspect Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Composite score: ${report.healthScore.composite}`);
    doc.text(`Token consistency: ${report.healthScore.tokenConsistency}`);
    doc.text(`Component coverage: ${report.healthScore.componentCoverage}`);
    doc.moveDown();

    const drawTable = (
      headers: string[],
      rows: string[][],
      colWidths: number[],
    ) => {
      const startY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.y = startY;
      let x = PAGE_MARGIN;
      headers.forEach((h, i) => {
        doc.text(h, x, doc.y, { width: colWidths[i] });
        x += colWidths[i];
      });
      doc.y += ROW_HEIGHT;
      doc.moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_MARGIN + pageWidth, doc.y).stroke();
      doc.font('Helvetica').fontSize(9);
      for (const row of rows) {
        checkPageBreak(1);
        const rowY = doc.y;
        x = PAGE_MARGIN;
        row.forEach((cell, i) => {
          doc.text(String(cell).slice(0, 60), x, rowY, { width: colWidths[i] - 4 });
          x += colWidths[i];
        });
        doc.y = rowY + ROW_HEIGHT;
      }
      doc.moveDown(0.5);
    };

    doc.fontSize(14).text('Tokens', { continued: false });
    doc.moveDown(0.5);
    const tokenCols = [pageWidth * 0.25, pageWidth * 0.15, pageWidth * 0.35, pageWidth * 0.25];
    drawTable(
      ['Name', 'Type', 'Value', 'Source'],
      report.tokens.map((t) => [t.name, t.type, t.value, t.source]),
      tokenCols,
    );

    doc.fontSize(14).text('Components', { continued: false });
    doc.moveDown(0.5);
    const compCols = [pageWidth * 0.25, pageWidth * 0.2, pageWidth * 0.35, pageWidth * 0.2];
    drawTable(
      ['Name', 'Category', 'Coverage', 'Orphan'],
      report.components.map((c) => {
        const displayName =
          c.coverage.includes('figma') && c.layerName
            ? `${c.layerName}, ${c.name}`
            : c.name;
        return [
          displayName,
          c.category ?? 'Unknown',
          c.coverage.join(', '),
          c.isOrphan ? 'Yes' : 'No',
        ];
      }),
      compCols,
    );

    doc.end();
  });
}

export async function runExport(ctx: JobContext, input: unknown): Promise<void> {
  const parseResult = ExportInputSchema.safeParse(input ?? {});
  if (!parseResult.success) {
    ctx.logger('warning', `inspect:export invalid input: ${parseResult.error.issues.map(i => i.message).join(', ')}`);
    return;
  }
  const { runId, format } = parseResult.data;

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
  if (format === 'pdf') {
    const buffer = await reportToPdf(report);
    ctx.artifactWriter({
      path: 'inspect-export.pdf',
      content: buffer.toString('base64'),
    });
  } else {
    const content = format === 'csv' ? reportToCsv(report) : reportToMarkdown(report);
    const ext = format === 'csv' ? 'csv' : 'md';
    ctx.artifactWriter({ path: `inspect-export.${ext}`, content });
  }
  ctx.logger('info', `Exported report as ${format}`);
}
