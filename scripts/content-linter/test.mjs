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
 * plus the linter-allow marker line itself (ISSUE-KVD-DEV-637E1B):
 *   marker-names-own-rule.md    → PASS (marker not matched against the rule it names)
 *   marker-hides-secret.md      → FAIL (category a inside a marker is still reported)
 *
 * Each fixture asserts the exact set of {category, ruleId, line} it produces
 * (ISSUE-KVD-DEV-2C68AD): one finding too many, too few, or on the wrong line
 * fails it.
 *
 * Exit 0 if every fixture behaves as expected, 1 otherwise.
 */

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from './index.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '__fixtures__');

const cases = [
  {
    file: 'secret-leak.md',
    expect: 'fail',
    wantCategory: 'a',
    want: [
      { category: 'a', ruleId: 'aws-account-number', line: 6 },
      { category: 'a', ruleId: 'aws-account-number', line: 9 },
    ],
  },
  {
    file: 'enterprise-leak.md',
    expect: 'fail',
    wantCategory: 'b',
    want: [
      { category: 'b', ruleId: 'paid-service', line: 6 },
      { category: 'b', ruleId: 'sso-enterprise-auth', line: 6 },
      { category: 'b', ruleId: 'private-repo-name', line: 9 },
    ],
  },
  {
    file: 'clean.md',
    expect: 'pass',
    want: [],
  },
  {
    file: 'pointer-allowed.astro',
    expect: 'pass',
    want: [],
  },
  {
    file: 'pointer-with-price.astro',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'pricing-tier-sku (inside commercial pointer)',
    want: [
      { category: 'b', ruleId: 'pricing-tier-sku (inside commercial pointer)', line: 6 },
      { category: 'b', ruleId: 'pointer-catalog-term', line: 8 },
      { category: 'b', ruleId: 'pricing-tier-sku (inside commercial pointer)', line: 8 },
    ],
  },
  {
    file: 'pointer-unmarked-link.astro',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'commercial-link',
    want: [
      { category: 'b', ruleId: 'commercial-link', line: 4 },
    ],
  },
  {
    file: 'pointer-two-per-context.md',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'pointer-limit (max one per context)',
    want: [
      { category: 'b', ruleId: 'pointer-limit (max one per context)', line: 7 },
    ],
  },
  {
    file: 'pointer-form.astro',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'pointer-not-link-only',
    want: [
      { category: 'b', ruleId: 'pointer-not-link-only', line: 5 },
    ],
  },
  {
    file: 'pointer-unclosed.md',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'pointer-unclosed',
    want: [
      { category: 'b', ruleId: 'pointer-unclosed', line: 3 },
    ],
  },
  {
    file: 'pointer-tier-sla.md',
    expect: 'fail',
    wantCategory: 'b',
    wantRule: 'pointer-catalog-term',
    want: [
      { category: 'b', ruleId: 'pointer-catalog-term', line: 4 },
    ],
  },
  {
    file: 'page-secret-leak.astro',
    expect: 'fail',
    wantCategory: 'a',
    want: [
      { category: 'a', ruleId: 'cloudfront-distribution-id', line: 4 },
      { category: 'a', ruleId: 'abs-path-users', line: 4 },
    ],
  },
  {
    file: 'llms-business-leak.txt',
    expect: 'fail',
    wantCategory: 'b',
    want: [
      { category: 'b', ruleId: 'pricing-tier-sku', line: 2 },
      { category: 'b', ruleId: 'sso-enterprise-auth', line: 2 },
    ],
  },
  {
    file: 'marker-names-own-rule.md',
    expect: 'pass',
    want: [],
  },
  {
    file: 'marker-hides-secret.md',
    expect: 'fail',
    wantCategory: 'a',
    wantRule: 'abs-path-users',
    want: [
      { category: 'a', ruleId: 'abs-path-users', line: 1 },
    ],
  },
];

const key = (f) => `${f.category} · line ${f.line} · ${f.ruleId}`;

let ok = true;

for (const c of cases) {
  const { findings } = lint([join(FIXTURES, c.file)]);
  const failed = findings.length > 0;
  const expectedFail = c.expect === 'fail';

  // Exact set: every expected {category, ruleId, line} and nothing else.
  const got = findings.map(key).sort();
  const want = c.want.map(key).sort();
  let pass = failed === expectedFail;
  if (pass) {
    pass = got.length === want.length && got.every((k, i) => k === want[i]);
  }

  const status = pass ? 'PASS' : 'FAIL';
  const detail =
    c.expect === 'fail'
      ? `expected blocking match (cat ${c.wantCategory}${c.wantRule ? `, ${c.wantRule}` : ''}), got ${findings.length}`
      : `expected 0 matches, got ${findings.length}`;
  console.log(`  [${status}] ${c.file} — ${detail}`);
  if (!pass) {
    ok = false;
    for (const k of got) {
      console.log(`        got:  ${k}`);
    }
    for (const k of want) {
      console.log(`        want: ${k}`);
    }
  }
}

if (ok) {
  console.log('content-linter test: all fixtures behaved as expected.');
  process.exit(0);
}
console.error('content-linter test: FAILED — see above.');
process.exit(1);
