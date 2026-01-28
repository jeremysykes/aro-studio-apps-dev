import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export function readTextSync(absPath: string): string {
  return readFileSync(absPath, 'utf-8');
}

export function writeTextSync(absPath: string, content: string): void {
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, content, 'utf-8');
}

export function existsSyncCheck(absPath: string): boolean {
  return existsSync(absPath);
}

export function mkdirp(absPath: string): void {
  mkdirSync(absPath, { recursive: true });
}
