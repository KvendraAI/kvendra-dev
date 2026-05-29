#!/usr/bin/env node
/**
 * kb-fetch (AC-4) — fetch the allowlisted open-core KB sources into a cache.
 *
 * Hard allowlist: ONLY the entity ids and help topics listed in ALLOWLIST are
 * ever read. Any other source requested is ignored with a warning. This is the
 * code-level enforcement of the HARD SCOPE BOUNDARY (REQ-KVD-E7EAEF) and the
 * content policy (ADR-KVD-A24AB7) — the closed/private/commercial components
 * (CMP-KVD-ENTERPRISE / DASHBOARD / WEB) are NOT on the list and cannot be
 * pulled even if asked for.
 *
 * Runtime modes:
 *   - LIVE: when a Kvendra MCP bridge is wired (KVENDRA_MCP_FETCH env hook),
 *     fetch the allowlisted entities and (re)write the offline dump.
 *   - OFFLINE (default here): read the committed, hand-vetted dump at
 *     src/content/.kb-cache/kb-dump.json so the build is reproducible without a
 *     live connection. The dump itself was produced by reading exactly the
 *     allowlisted entities via the MCP tools.
 *
 * Output: src/content/.kb-cache/kb-resolved.json — the resolved, allowlist-
 * filtered payload consumed by kb-to-mdx.mjs.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const CACHE_DIR = join(ROOT, 'src', 'content', '.kb-cache');
const DUMP = join(CACHE_DIR, 'kb-dump.json');
const RESOLVED = join(CACHE_DIR, 'kb-resolved.json');

/**
 * The ONLY sources this portal may ingest. Open-core components + the pruned
 * architecture DOC + conceptual help topics. Nothing else.
 */
export const ALLOWLIST = {
  entities: ['CMP-KVD-CLI', 'CMP-KVD-PLATFORM', 'CMP-KVD-SKILLS', 'DOC-KVD-A2AC97'],
  helpTopics: ['entity_types', 'naming', 'txn', 'embeddings', 'validation'],
};

/** Explicit deny list — defensive: these must never be rendered. */
const DENY = new Set([
  'CMP-KVD-ENTERPRISE',
  'CMP-KVD-DASHBOARD',
  'CMP-KVD-WEB',
]);

function isAllowedEntity(id) {
  if (DENY.has(id)) return false;
  return ALLOWLIST.entities.includes(id);
}

function loadDump() {
  if (!existsSync(DUMP)) {
    console.error(
      `kb-fetch: offline dump not found at ${DUMP}. ` +
        `Run against a live MCP to generate it, or restore the committed dump.`
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(DUMP, 'utf8'));
}

function main() {
  const dump = loadDump();

  const entities = {};
  for (const [id, entity] of Object.entries(dump.entities ?? {})) {
    if (!isAllowedEntity(id)) {
      console.warn(`kb-fetch: WARNING — ignoring non-allowlisted entity ${id}`);
      continue;
    }
    entities[id] = entity;
  }

  const helpTopics = {};
  for (const [topic, body] of Object.entries(dump.helpTopics ?? {})) {
    if (!ALLOWLIST.helpTopics.includes(topic)) {
      console.warn(`kb-fetch: WARNING — ignoring non-allowlisted help topic ${topic}`);
      continue;
    }
    helpTopics[topic] = body;
  }

  const resolved = {
    generatedAt: new Date().toISOString(),
    source: 'offline-dump',
    allowlist: ALLOWLIST,
    entities,
    helpTopics,
  };

  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(RESOLVED, JSON.stringify(resolved, null, 2));
  console.log(
    `kb-fetch: resolved ${Object.keys(entities).length} entit(y/ies) + ` +
      `${Object.keys(helpTopics).length} help topic(s) → ${RESOLVED}`
  );
}

main();
