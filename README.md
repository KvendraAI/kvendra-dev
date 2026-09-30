# kvendra-dev

The open-core developer portal for [Kvendra](https://kvendra.com), served at
**kvendra.dev**. It is a static [Astro 4](https://astro.build) site whose
content is generated from the Kvendra knowledge base itself — the site is a
living demo of the product (dogfooding).

## What this site is

A public, educational reference for the three open-core Kvendra components:

- **Kvendra CLI** (Apache-2.0) — zero-knowledge vault + MCP capability broker.
- **Kvendra Platform** (AGPL-3.0) — single-tenant KB engine you self-host.
- **Kvendra Skills** (Apache-2.0) — the Claude Code plugin that orchestrates them.

Plus conceptual material: architecture, the security/threat model, embeddings
and semantic search, the entity model, the transaction (TXN) pipeline, and the
proposed SQL schemas of the open engine.

## What this site is NOT

It contains **only** open-core, conceptual, educational material. It never
publishes anything commercial, Enterprise, pricing/tiers, paid services, or any
operational secret. That boundary is enforced automatically by a blocking
content linter (`scripts/content-linter/`), not by manual review.

## Build pipeline (KB-driven)

```
kb:fetch   →  reads an allowlisted set of open-core KB entities/topics
              into a committed JSON cache (offline-reproducible)
kb:transform → renders the cache to MDX content collections, pruning any
               commercial/tier dimensions from mixed sources
lint:content → BLOCKING two-category security linter; a match aborts the build
astro build  → emits the static dist/
```

```sh
npm install
npm run build      # kb:fetch && kb:transform && lint:content && astro build
npm run dev        # local dev server
npm run test:linter # run the linter fixtures (secret-leak, enterprise-leak, clean)
```

### KB connectivity

`kb:fetch` runs against the Kvendra MCP at runtime when available. When there is
no live connection, it falls back to the committed offline dump at
`src/content/.kb-cache/kb-dump.json`, so the build is deterministic and
reproducible offline. Only allowlisted entity IDs / help topics are ever read;
any other source is ignored with a warning.

## Design system

The brand tokens, atoms (mark / wordmark / lockup / icons), SVGs and the
anti-FOUC theme script are **copied** (not submoduled) from the Kvendra brand
kit (v0.6.x). Each copied file carries a header noting its origin.

## Licensing

- **Site code** (Astro components, scripts, styles): **MIT** — see [`LICENSE`](./LICENSE).
- **Content** (articles, docs, MDX, rendered pages): **CC-BY-4.0** — see [`LICENSE-CONTENT`](./LICENSE-CONTENT).
