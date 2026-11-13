---
number: 1
slug: codex-cli
title: Kvendra from Codex CLI
result: Codex CLI connected, bootstrapped from a 30-line AGENTS.md and wrote decisions to the knowledge base.
status: works
tools: ["Codex"]
versions: Codex CLI 0.167.2
datePublished: 2026-11-12
dateModified: 2026-11-12
description: "Can an agent that isn't Claude Code use the same Kvendra knowledge base? Codex CLI connected over MCP, bootstrapped from a 30-line AGENTS.md and wrote decisions to the knowledge base."
---

## Question

Kvendra is an MCP server, and the Claude Code skills sit on top of it. Can an agent that isn't Claude Code use the same knowledge base, and what does it lose?

## Setup

Codex CLI 0.167.2 with the tester's own OpenAI account, the hosted Kvendra MCP, a clean Codex home, 2026-11-12.

## What we did

1. Added the server to Codex's config and signed in with `codex mcp login`. The sign-in needed only the server URL: no token and no client id.
2. Wrote a 30-line AGENTS.md: where the memory lives, how to start a session, how to write safely, what to do if Kvendra doesn't answer.
3. Asked Codex to start a session and then to record two decisions in one transaction, update one of them safely, mark the other as replaced and search for both.

## Result: it works.

- Codex loaded the project context from the boot file: project, active roadmap, recent releases, open issues.
- It read the rules for transactions and naming before writing.
- It created both decisions in one transaction and updated one with a version check.
- It found both decisions at the top of a search.
- Every write was checked in the knowledge base afterwards.
- When it tried to mark a decision as replaced, its first attempts failed: the way to record “replaced by” was not clear from the tool descriptions. It then fell back to setting the status and the reference correctly. We opened an issue to make that clearer.
- On the first run, before its Kvendra calls were approved, Codex stopped at the first call and wrote nothing. The fail-safe in the boot file did its job.

## What's different from Claude Code

| | Claude Code + Kvendra plugin | Codex CLI |
|---|---|---|
| Knowledge-base tools | all | all, the same |
| Session start | CLAUDE.md + bootstrap | AGENTS.md + bootstrap |
| One-command workflows (`/kvendra`, `/new-feature`, `/bug`) | yes | no; the boot file and the procedures in the KB guide the agent |
| Code work through the cloud pipeline | yes | yes: an issue marked ready runs whoever wrote it |
| Answer-format hook | yes | no; a line in AGENTS.md instead |
| Protection hook for unsafe operations | yes | **no**: see Limits |

## Limits and safety

- Only Codex CLI was tested. Cursor and Gemini CLI are next; we don't claim “any MCP client” yet.
- Codex doesn't get the Kvendra protection hook. If it has shell access, keep it in a read-only sandbox until we test the Kvendra broker with it.
- For `codex exec` (non-interactive) you must allow Kvendra calls in config; otherwise every call stops for approval.

## Reproduce it

Follow the [guide](/docs/codex/). The AGENTS.md template is there.

## Links

<!-- commercial-pointer:start lab-links -->
[Guide](/docs/codex/) · [What's new entry](https://kvendra.com/whats-new/) · Kvendra Platform publication on the hub: <https://app.kvendra.cloud/hub/kvendra-platform/>
<!-- commercial-pointer:end -->
