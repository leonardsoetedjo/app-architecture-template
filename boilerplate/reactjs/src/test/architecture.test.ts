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
  it('.tsx files in pages/ must not contain business logic (hooks, API calls, complex logic)', () => {
    const violations: string[] = [];

    for (const file of walk(SRC_ROOT)) {
      // Only check pages/ directory
      if (!file.includes('/pages/')) continue;
      if (!file.endsWith('.tsx')) continue;
      if (file.includes('.test.') || file.includes('.spec.')) continue;

      const content = readFileSync(file, 'utf-8');

      // Check for hooks being defined (not just imported)
      if (/export\s+function\s+use[A-Z]\w*\(/.test(content)) {
        violations.push(`${file}: defines hook — move to features/`);
      }

      // Check for API calls (axios, fetch)
      if (content.includes('axios.')) {
        violations.push(`${file}: contains axios. call — move to features/ or api/`);
      }
      if (content.includes('fetch(')) {
        violations.push(`${file}: contains fetch() call — move to features/ or api/`);
      }

      // Check for complex logic patterns (mutations, dispatch, Redux logic)
      if (/useMutation\(|use[A-Z]\w+Mutation/.test(content)) {
        violations.push(`${file}: contains mutation hook — move to features/`);
      }

      // Check for form validation schemas defined inline
      if (/z\.object\(|yup\.object\(|\.refine\(/.test(content)) {
        violations.push(`${file}: contains validation schema — move to features/`);
      }
    }

    if (violations.length > 0) {
      console.error('Business logic violations in pages/:\n  ' + violations.join('\n  '));
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
