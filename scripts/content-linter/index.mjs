#!/usr/bin/env node
/**
 * Content security linter (AC-6) — BLOCKING.
 *
 * Scans Markdown/MDX content for two categories of forbidden material:
 *   (a) operational secrets   — rules/secrets.js   — NEVER escapable
 *   (b) enterprise/business    — rules/business.js  — escapable per-line for
 *                                                     generic false positives
 *
 * Escape syntax (category b only):
 *   <!-- linter-allow: <rule-id> reason -->
 * placed on the line immediately before the offending line. The escape must
 * name the exact rule id. Category (a) escapes are rejected and reported.
 *
 * Exit code: 0 if clean, 1 if any blocking match remains.
 * Output per finding: `<category> · <file> · <line> · <rule-id>`.
 *
 * Usage:
 *   node scripts/content-linter/index.mjs [dir-or-file ...]
 * Default scan root: src/content (recursively, *.md and *.mdx).
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as secrets from './rules/secrets.js';
import * as business from './rules/business.js';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = resolve(HERE, '..', '..');

const ALLOW_RE = /<!--\s*linter-allow:\s*([A-Za-z0-9_-]+)\s+(.+?)\s*-->/;

const CATEGORIES = [
  { mod: secrets, escapable: false },
  { mod: business, escapable: true },
];

/** Recursively collect *.md / *.mdx files under a path. */
function collect(target) {
  const out = [];
  if (!existsSync(target)) return out;
  const st = statSync(target);
  if (st.isFile()) {
    if (['.md', '.mdx'].includes(extname(target))) out.push(target);
    return out;
  }
  for (const name of readdirSync(target)) {
    if (name.startsWith('.')) continue; // skip .kb-cache etc.
    out.push(...collect(join(target, name)));
  }
  return out;
}

/** Lint a single file; returns array of findings. */
function lintFile(file) {
  const findings = [];
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = i > 0 ? lines[i - 1] : '';
    const allowMatch = prev.match(ALLOW_RE);
    const allowedRuleId = allowMatch ? allowMatch[1] : null;

    for (const { mod, escapable } of CATEGORIES) {
      for (const rule of mod.rules) {
        if (!rule.regex.test(line)) continue;

        // Category (a) is never escapable. If someone tries to escape it,
        // emit an extra finding flagging the illegal escape attempt.
        if (!escapable) {
          findings.push({
            category: mod.CATEGORY,
            file,
            line: i + 1,
            ruleId: rule.id,
          });
          if (allowedRuleId === rule.id) {
            findings.push({
              category: mod.CATEGORY,
              file,
              line: i + 1,
              ruleId: `${rule.id} (illegal-escape: category-a is never escapable)`,
            });
          }
          continue;
        }

        // Category (b): honour a matching, well-formed escape.
        if (allowedRuleId === rule.id) continue;

        findings.push({
          category: mod.CATEGORY,
          file,
          line: i + 1,
          ruleId: rule.id,
        });
      }
    }
  }
  return findings;
}

export function lint(targets) {
  const roots =
    targets && targets.length
      ? targets.map((t) => resolve(t))
      : [join(PROJECT_ROOT, 'src', 'content')];

  const files = [...new Set(roots.flatMap(collect))];
  const findings = [];
  for (const f of files) findings.push(...lintFile(f));
  return { files, findings };
}

function main() {
  const args = process.argv.slice(2);
  const { files, findings } = lint(args);

  if (findings.length === 0) {
    console.log(
      `content-linter: OK — scanned ${files.length} file(s), 0 blocking matches.`
    );
    process.exit(0);
  }

  console.error(
    `content-linter: BLOCKED — ${findings.length} match(es) in ${files.length} file(s):`
  );
  for (const f of findings) {
    const rel = relative(PROJECT_ROOT, f.file);
    console.error(`  ${f.category} · ${rel} · ${f.line} · ${f.ruleId}`);
  }
  process.exit(1);
}

// Run as CLI only when invoked directly (not when imported by test.mjs).
if (resolve(process.argv[1] ?? '') === resolve(fileURLToPath(import.meta.url))) {
  main();
}
