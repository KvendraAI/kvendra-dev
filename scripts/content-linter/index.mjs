#!/usr/bin/env node
/**
 * Content security linter (AC-6) — BLOCKING.
 *
 * Scans the public content of kvendra.dev for two categories of forbidden
 * material:
 *   (a) operational secrets   — rules/secrets.js   — NEVER escapable
 *   (b) enterprise/business    — rules/business.js  — escapable per-line for
 *                                                     generic false positives
 *
 * Escape syntax (category b only, outside commercial pointers):
 *   <!-- linter-allow: <rule-id> reason -->
 * placed on the line immediately before the offending line. The escape must
 * name the exact rule id. Category (a) escapes are rejected and reported.
 *
 * Commercial pointers (ADR-KVD-A24AB7 carve-out): a short, link-only pointer
 * to kvendra.com is allowed when wrapped in a marked block:
 *   <!-- commercial-pointer:start <context> -->
 *   ...one sentence and one link to https://kvendra.com/...
 *   <!-- commercial-pointer:end -->
 * Inside the block only the `commercial-link` rule is lifted. Every other
 * category (b) rule (pricing, tiers, paid services...) still blocks and
 * linter-allow escapes are NOT honoured there. At most one pointer per file
 * (one per context), at most POINTER_MAX_LINES lines, links only (no forms,
 * buttons or mailto), and the block must actually link to kvendra.com.
 *
 * Exit code: 0 if clean, 1 if any blocking match remains.
 * Output per finding: `<category> · <file> · <line> · <rule-id>`.
 *
 * Usage:
 *   node scripts/content-linter/index.mjs [dir-or-file ...]
 * Default scan roots: src/content, src/pages, src/layouts, src/components,
 * src/styles, public (*.txt, *.svg, *.js — shipped verbatim) and the committed
 * KB dump (src/content/.kb-cache/kb-dump.json). Walked extensions: .md .mdx
 * .astro .txt .svg .js .ts .css.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as secrets from './rules/secrets.js';
import * as business from './rules/business.js';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = resolve(HERE, '..', '..');

const ALLOW_RE = /<!--\s*linter-allow:\s*([A-Za-z0-9_-]+)\s+(.+?)\s*-->/;
const POINTER_START_RE = /<!--\s*commercial-pointer:start\b/;
const POINTER_END_RE = /<!--\s*commercial-pointer:end\s*-->/;
const POINTER_LINK_RE = /https:\/\/kvendra\.com\b/;
const POINTER_NOT_LINK_ONLY_RE = /<(form|input|button|select|textarea)\b|mailto:/i;
// Catalog terms that are legitimate elsewhere on the site (e.g. SLA is a KB
// entity type) but never inside a commercial pointer: tier names sold as
// SKUs and service-level promises (ADR-KVD-A24AB7 amendment, point 3).
const POINTER_CATALOG_RE = /\b(Free|Pro|Team|Business|Enterprise)\b|\bSLAs?\b|\buptime\b|\bguarantee/;
const POINTER_MAX_LINES = 8;
const POINTER_LIFTED_RULE = 'commercial-link';

/** Extensions collected when walking a directory. */
const WALK_EXTS = ['.md', '.mdx', '.astro', '.txt', '.svg', '.js', '.ts', '.css'];
/** Extensions accepted when a file is named explicitly. */
const FILE_EXTS = [...WALK_EXTS, '.json'];

const DEFAULT_ROOTS = [
  join(PROJECT_ROOT, 'src', 'content'),
  join(PROJECT_ROOT, 'src', 'pages'),
  join(PROJECT_ROOT, 'src', 'layouts'),
  join(PROJECT_ROOT, 'src', 'components'),
  join(PROJECT_ROOT, 'src', 'styles'),
  join(PROJECT_ROOT, 'public'),
  join(PROJECT_ROOT, 'src', 'content', '.kb-cache', 'kb-dump.json'),
];

const CATEGORIES = [
  { mod: secrets, escapable: false },
  { mod: business, escapable: true },
];

/** Recursively collect lintable files under a path. */
function collect(target) {
  const out = [];
  if (!existsSync(target)) return out;
  const st = statSync(target);
  if (st.isFile()) {
    if (FILE_EXTS.includes(extname(target))) out.push(target);
    return out;
  }
  for (const name of readdirSync(target)) {
    if (name.startsWith('.')) continue; // skip .kb-cache etc. (dump is listed explicitly)
    const child = join(target, name);
    if (statSync(child).isDirectory()) {
      out.push(...collect(child));
    } else if (WALK_EXTS.includes(extname(child))) {
      out.push(child);
    }
  }
  return out;
}

/** Lint a single file; returns array of findings. */
function lintFile(file) {
  const findings = [];
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const push = (category, line, ruleId) =>
    findings.push({ category, file, line, ruleId });

  let pointerStart = null; // line index of the open pointer block, if any
  let pointerHasLink = false;
  let pointerCount = 0;

  const closePointer = (endIdx) => {
    const len = endIdx - pointerStart + 1;
    if (len > POINTER_MAX_LINES) {
      push(business.CATEGORY, pointerStart + 1, 'pointer-too-long');
    }
    if (!pointerHasLink) {
      push(business.CATEGORY, pointerStart + 1, 'pointer-without-link');
    }
    pointerStart = null;
    pointerHasLink = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (POINTER_START_RE.test(line)) {
      if (pointerStart !== null) {
        push(business.CATEGORY, i + 1, 'pointer-nested');
      } else {
        pointerStart = i;
        pointerCount += 1;
        if (pointerCount > 1) {
          push(business.CATEGORY, i + 1, 'pointer-limit (max one per context)');
        }
      }
    }

    const inPointer = pointerStart !== null;
    if (inPointer) {
      if (POINTER_LINK_RE.test(line)) pointerHasLink = true;
      if (POINTER_NOT_LINK_ONLY_RE.test(line)) {
        push(business.CATEGORY, i + 1, 'pointer-not-link-only');
      }
      if (POINTER_CATALOG_RE.test(line)) {
        push(business.CATEGORY, i + 1, 'pointer-catalog-term');
      }
    }

    const prev = i > 0 ? lines[i - 1] : '';
    const allowMatch = prev.match(ALLOW_RE);
    const allowedRuleId = allowMatch ? allowMatch[1] : null;

    for (const { mod, escapable } of CATEGORIES) {
      for (const rule of mod.rules) {
        if (!rule.regex.test(line)) continue;

        // Category (a) is never escapable. If someone tries to escape it,
        // emit an extra finding flagging the illegal escape attempt.
        if (!escapable) {
          push(mod.CATEGORY, i + 1, rule.id);
          if (allowedRuleId === rule.id) {
            push(
              mod.CATEGORY,
              i + 1,
              `${rule.id} (illegal-escape: category-a is never escapable)`
            );
          }
          continue;
        }

        // Inside a commercial pointer only the link itself is lifted; any
        // other category (b) match blocks and escapes are ignored.
        if (inPointer) {
          if (rule.id === POINTER_LIFTED_RULE) continue;
          push(mod.CATEGORY, i + 1, `${rule.id} (inside commercial pointer)`);
          continue;
        }

        // Category (b) outside pointers: honour a matching, well-formed escape,
        // except for rules marked `escapable: false` (the commercial-link
        // rules: the only way to mention kvendra.com is a marked pointer).
        if (allowedRuleId === rule.id && rule.escapable !== false) continue;

        push(mod.CATEGORY, i + 1, rule.id);
      }
    }

    if (inPointer && POINTER_END_RE.test(line)) closePointer(i);
  }

  if (pointerStart !== null) {
    push(business.CATEGORY, pointerStart + 1, 'pointer-unclosed');
  }
  return findings;
}

export function lint(targets) {
  const roots =
    targets && targets.length ? targets.map((t) => resolve(t)) : DEFAULT_ROOTS;

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
