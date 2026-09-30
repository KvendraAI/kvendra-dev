#!/usr/bin/env node
/**
 * Content-linter test runner (AC-6 fixtures).
 *
 * Asserts:
 *   secret-leak.md     → FAIL (>=1 category-a finding; escape attempt ignored)
 *   enterprise-leak.md → FAIL (>=1 category-b finding)
 *   clean.md           → PASS (0 findings)
 * plus the commercial-pointer carve-out (ADR-KVD-A24AB7) and the extended
 * coverage of .astro pages and .txt files (ISSUE-KVD-DEV-8BFB5A):
 *   pointer-allowed.astro       → PASS (marked, link-only pointer)
 *   pointer-with-price.astro    → FAIL (price/tier inside the pointer; escape ignored)
 *   pointer-unmarked-link.astro → FAIL (commercial link outside a pointer)
 *   pointer-two-per-context.md  → FAIL (more than one pointer per context)
 *   pointer-form.astro          → FAIL (not link-only)
 *   pointer-unclosed.md         → FAIL (block never closed)
 *   pointer-tier-sla.md         → FAIL (tier name / SLA promise inside the pointer)
 *   page-secret-leak.astro      → FAIL (category a in an .astro page)
 *   llms-business-leak.txt      → FAIL (category b in a .txt file)
 *
 * Exit 0 if every fixture behaves as expected, 1 otherwise.
 */

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from './index.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '__fixtures__');

const cases = [
  { file: 'secret-leak.md', expect: 'fail', wantCategory: 'a' },
  { file: 'enterprise-leak.md', expect: 'fail', wantCategory: 'b' },
  { file: 'clean.md', expect: 'pass' },
  { file: 'pointer-allowed.astro', expect: 'pass' },
  {
    file: 'pointer-with-price.astro',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'pricing-tier-sku (inside commercial pointer)',
  },
  {
    file: 'pointer-unmarked-link.astro',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'commercial-link',
  },
  {
    file: 'pointer-two-per-context.md',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'pointer-limit (max one per context)',
  },
  {
    file: 'pointer-form.astro',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'pointer-not-link-only',
  },
  {
    file: 'pointer-unclosed.md',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'pointer-unclosed',
  },
  {
    file: 'pointer-tier-sla.md',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'pointer-catalog-term',
  },
  { file: 'page-secret-leak.astro', expect: 'fail', wantCategory: 'a' },
  { file: 'llms-business-leak.txt', expect: 'fail', wantCategory: 'b' },
];

let ok = true;

for (const c of cases) {
  const { findings } = lint([join(FIXTURES, c.file)]);
  const failed = findings.length > 0;
  const expectedFail = c.expect === 'fail';

  let pass = failed === expectedFail;
  if (pass && c.wantCategory) {
    pass = findings.some((f) => f.category === c.wantCategory);
  }
  if (pass && c.wantRule) {
    pass = findings.some((f) => f.ruleId === c.wantRule);
  }

  const status = pass ? 'PASS' : 'FAIL';
  const detail =
    c.expect === 'fail'
      ? `expected blocking match (cat ${c.wantCategory}${c.wantRule ? `, ${c.wantRule}` : ''}), got ${findings.length}`
      : `expected 0 matches, got ${findings.length}`;
  console.log(`  [${status}] ${c.file} — ${detail}`);
  if (!pass) {
    ok = false;
    for (const f of findings) {
      console.log(`        ${f.category} · line ${f.line} · ${f.ruleId}`);
    }
  }
}

if (ok) {
  console.log('content-linter test: all fixtures behaved as expected.');
  process.exit(0);
}
console.error('content-linter test: FAILED — see above.');
process.exit(1);
