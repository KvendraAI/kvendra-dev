#!/usr/bin/env node
/**
 * Content-linter test runner (AC-6 fixtures).
 *
 * Asserts:
 *   secret-leak.md     → FAIL (>=1 category-a finding; escape attempt ignored)
 *   enterprise-leak.md → FAIL (>=1 category-b finding)
 *   clean.md           → PASS (0 findings)
 *
 * Exit 0 if all three behave as expected, 1 otherwise.
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

  const status = pass ? 'PASS' : 'FAIL';
  const detail =
    c.expect === 'fail'
      ? `expected blocking match (cat ${c.wantCategory}), got ${findings.length}`
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
