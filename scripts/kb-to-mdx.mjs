#!/usr/bin/env node
/**
 * kb-to-mdx (AC-4) — transform the resolved KB cache into MDX content.
 *
 * Reads src/content/.kb-cache/kb-resolved.json (produced by kb-fetch.mjs) and
 * emits committed-shaped MDX files under src/content/generated/. These files
 * are the KB-DERIVED bodies that the content linter scans and that the Astro
 * pages import/render. Pruning of any commercial/tier dimension is already done
 * in the dump (DOC-KVD-A2AC97 carries only its open-core sections); this script
 * is purely a deterministic render of the allowlisted payload.
 *
 * Deterministic: same kb-resolved.json -> byte-identical MDX output.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const RESOLVED = join(ROOT, 'src', 'content', '.kb-cache', 'kb-resolved.json');
const OUT_DIR = join(ROOT, 'src', 'content', 'generated');

function load() {
  if (!existsSync(RESOLVED)) {
    console.error(`kb-to-mdx: ${RESOLVED} not found. Run kb:fetch first.`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(RESOLVED, 'utf8'));
}

/**
 * Escape characters that MDX would otherwise interpret as JSX/expressions when
 * a KB string is rendered as prose. Angle-bracket placeholders such as
 * `<PROJECT>` or `<6HEX>` in the naming/txn help topics would be parsed as JSX
 * tags, so they are wrapped in inline code; stray braces are escaped too.
 */
function mdxText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

/** Render the CLI primitive table from the CMP-KVD-CLI entity. */
function renderPrimitives(cli) {
  const rows = cli.primitives
    .map((p) => `| \`${p.id}\` | ${p.ops.join(', ')} | ${mdxText(p.note)} |`)
    .join('\n');
  return [
    '| Primitive | Operations | Notes |',
    '| --- | --- | --- |',
    rows,
  ].join('\n');
}

function renderCliFacts(cli) {
  return [
    `{/* generated from ${cli.entity_id} — do not edit by hand */}`,
    '',
    `The **${cli.title}** is the foundational piece of Kvendra: a ${cli.language} binary (\`${cli.binary}\`, ${cli.license}).`,
    '',
    mdxText(cli.summary),
    '',
    '## The open-core primitives',
    '',
    `The broker exposes ${cli.primitives_open_core_count} open-core primitives. Each primitive receives an injected secret resolved by the vault — the model issuing the call never sees the raw value.`,
    '',
    renderPrimitives(cli),
    '',
    `Beyond these, an audit-marked escape hatch exists: ${mdxText(cli.escape_hatch)}`,
    '',
    '## Introspection',
    '',
    mdxText(cli.introspection),
    '',
    '## The vault',
    '',
    mdxText(cli.vault_layout),
    '',
    `Cryptography: ${mdxText(cli.crypto)}`,
    '',
    `Modes of operation: ${mdxText(cli.modes)}`,
    '',
  ].join('\n');
}

function renderPlatformFacts(p) {
  return [
    `{/* generated from ${p.entity_id} — do not edit by hand */}`,
    '',
    `**${p.title}** (${p.license}) is written in ${p.language} on a stack of ${p.stack}.`,
    '',
    mdxText(p.summary),
    '',
    '## What the engine gives you',
    '',
    p.scope.map((s) => `- ${mdxText(s)}`).join('\n'),
    '',
    '## Embeddings and semantic search',
    '',
    mdxText(p.embeddings),
    '',
    mdxText(p.search),
    '',
  ].join('\n');
}

function renderSkillsFacts(s) {
  const cat = s.catalog_v1;
  const catLines = [
    `- **Pipelines**: ${cat.pipelines.join(', ')}.`,
    `- **Subagents**: ${cat.subagents.join(', ')}.`,
    `- **Documentation**: ${cat.documentation.join(', ')}.`,
    `- **Setup & meta**: ${cat.setup_meta.join(', ')}.`,
    `- **Deploy**: ${cat.deploy.join(', ')}.`,
  ].join('\n');
  return [
    `{/* generated from ${s.entity_id} — do not edit by hand */}`,
    '',
    `**${s.title}** (${s.license}) is a ${s.format}.`,
    '',
    mdxText(s.summary),
    '',
    `> ${mdxText(s.design_principle)}`,
    '',
    '## Direction',
    '',
    s.v2_direction.map((d) => `- ${mdxText(d)}`).join('\n'),
    '',
    '## The skill catalogue',
    '',
    catLines,
    '',
    `LLM target: ${mdxText(s.llm_target)}`,
    '',
  ].join('\n');
}

function renderEntityTypes(help) {
  return [
    '{/* generated from help topic: entity_types */}',
    '',
    mdxText(help.entity_types),
    '',
  ].join('\n');
}

function renderPipelines(help) {
  return [
    '{/* generated from help topics: txn, naming */}',
    '',
    '## The transaction (TXN) flow',
    '',
    mdxText(help.txn),
    '',
    '## Naming and identifiers',
    '',
    mdxText(help.naming),
    '',
    '## Validation',
    '',
    mdxText(help.validation),
    '',
  ].join('\n');
}

function main() {
  const data = load();
  const e = data.entities;
  const h = data.helpTopics;

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const files = {
    'cli-facts.mdx': renderCliFacts(e['CMP-KVD-CLI']),
    'platform-facts.mdx': renderPlatformFacts(e['CMP-KVD-PLATFORM']),
    'skills-facts.mdx': renderSkillsFacts(e['CMP-KVD-SKILLS']),
    'entity-types.mdx': renderEntityTypes(h),
    'pipelines-facts.mdx': renderPipelines(h),
  };

  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(OUT_DIR, name), body + '\n');
  }
  console.log(
    `kb-to-mdx: wrote ${Object.keys(files).length} generated MDX file(s) → ${OUT_DIR}`
  );
}

main();
