/**
 * Architecture tests for ReactJS boilerplate.
 *
 * Rule Coverage:
 *   - TYPESCRIPT-STRICT-001: entities/ and types/ must not use `any`
 *   - REACT-BUSINESS-LOGIC: .tsx files must not contain business logic (API calls, complex computations)
 *   - REACT-API-ISOLATION: .tsx/.ts files outside api/ must not import axios directly
 *
 * These are static-analysis tests. No runtime needed.
 * 
 * Run: npm test -- --run src/test/architecture.test.ts
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC_ROOT = join(__dirname, '..');

// --- Helpers ---

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'test') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

// --- TYPESCRIPT-STRICT-001 ---

describe('TYPESCRIPT-STRICT-001', () => {
  it('entities/ and types/ must not use `any` type', () => {
    const violations: string[] = [];

    for (const file of walk(SRC_ROOT)) {
      // Only check domain layer: entities/ and types/
      if (!file.includes('/entities/') && !file.includes('/types/')) continue;
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;

      const content = readFileSync(file, 'utf-8');
      // Match explicit `: any` or `any` in type positions (not in comments/strings)
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Skip comments and strings
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
        if (/: any\b|<any>|any\b\s*=/.test(line)) {
          violations.push(`${file}:${idx + 1}: uses \`any\` type — ${line.trim()}`);
        }
      });
    }

    if (violations.length > 0) {
      console.error('Type strictness violations:\n  ' + violations.join('\n  '));
    }
    expect(violations).toEqual([]);
  });
});

// --- REACT-BUSINESS-LOGIC ---

describe('REACT-BUSINESS-LOGIC', () => {
  it('.tsx files must not contain axios/fetch API calls', () => {
    const violations: string[] = [];

    for (const file of walk(SRC_ROOT)) {
      if (!file.endsWith('.tsx')) continue;
      // Skip test files
      if (file.includes('.test.') || file.includes('.spec.')) continue;

      const content = readFileSync(file, 'utf-8');
      if (content.includes('axios.')) {
        violations.push(`${file}: contains axios. call — move to api/ layer`);
      }
      if (content.includes('fetch(')) {
        violations.push(`${file}: contains fetch() call — move to api/ layer`);
      }
    }

    if (violations.length > 0) {
      console.error('Business logic violations:\n  ' + violations.join('\n  '));
    }
    expect(violations).toEqual([]);
  });

  it('.tsx files must not contain complex business logic (>50 chars regex/computation)', () => {
    const violations: string[] = [];

    for (const file of walk(SRC_ROOT)) {
      if (!file.endsWith('.tsx')) continue;
      if (file.includes('.test.') || file.includes('.spec.')) continue;

      const content = readFileSync(file, 'utf-8');
      // Check for complex regex patterns or date manipulation in component
      if (/new RegExp\([^)]{50,}\)/.test(content)) {
        violations.push(`${file}: contains complex RegExp — move to hook/utility`);
      }
      if (/moment\.|dayjs\.|date-fns\./.test(content) && !content.includes('import')) {
        violations.push(`${file}: contains date manipulation — move to hook/utility`);
      }
    }

    if (violations.length > 0) {
      console.error('Business logic violations:\n  ' + violations.join('\n  '));
    }
    expect(violations).toEqual([]);
  });
});

// --- REACT-API-ISOLATION ---

describe('REACT-API-ISOLATION', () => {
  it('components must not import axios directly (use api/ layer)', () => {
    const violations: string[] = [];

    for (const file of walk(SRC_ROOT)) {
      // Check .tsx and .ts files, but exclude api/ folder itself
      if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
      if (file.includes('/api/')) continue; // api/ layer is allowed
      if (file.includes('.test.') || file.includes('.spec.')) continue;
      if (file.includes('node_modules')) continue;

      const content = readFileSync(file, 'utf-8');
      // Check for direct axios import (not re-export from api/)
      if (/import\s+axios\s+from\s+['"]axios['"]/.test(content)) {
        violations.push(`${file}: imports axios directly — use api/ layer`);
      }
      if (/import\s*{.*axios.*}\s*from\s+['"]axios['"]/.test(content)) {
        violations.push(`${file}: imports axios directly — use api/ layer`);
      }
    }

    if (violations.length > 0) {
      console.error('API isolation violations:\n  ' + violations.join('\n  '));
    }
    expect(violations).toEqual([]);
  });
});
