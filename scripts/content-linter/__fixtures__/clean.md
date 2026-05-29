# Fixture — clean open-core content (MUST pass)

This file contains only open-core, conceptual material and must pass the linter
with zero findings.

The Kvendra CLI is a Rust binary that runs a zero-knowledge vault and an MCP
capability broker. It exposes primitives like git, npm, pypi, http and shell,
each gated by an HMAC-signed allowlist so the language model never sees raw
tokens.

The Platform engine stores entities in PostgreSQL with pgvector and ranks
search results by cosine similarity over 1024-dimension embeddings.

Skills orchestrate the CLI and the knowledge base from inside Claude Code.
