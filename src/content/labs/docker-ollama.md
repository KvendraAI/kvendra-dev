---
number: 2
slug: docker-ollama
title: Kvendra Platform with Docker and Ollama
result: The self-hosted engine, Ollama and a local agent connected. An 8B model on a laptop CPU was too slow for the agent; the full stack and embeddings work on a CPU.
status: partial
tools: ["Ollama", "Docker", "Self-hosted"]
versions: Ollama 0.24.0 · Llama 3.1 8B · mxbai-embed-large · Kvendra Platform 0.1.0-alpha.2
datePublished: 2026-05-21
dateModified: 2026-11-17
description: "The self-hosted engine, Ollama and a local agent connected. An 8B model on a laptop CPU was too slow for the agent; the full stack and embeddings work on a CPU."
---

## Question

Can you run Kvendra fully on your own machine (the open-source engine, Ollama for the models, a local agent) with nothing sent to a cloud?

## Setup

Kvendra Platform running locally, Ollama 0.24.0 with Llama 3.1 8B (Q4), the open-source agent cline 3.0.9 connected to the engine over MCP, on a laptop with an Intel CPU and no dedicated GPU. 2026-05-21.

## What we did

1. Started the engine locally and checked its health endpoint.
2. Pointed the agent at Ollama through its OpenAI-compatible endpoint and connected it to the engine's MCP server.
3. Asked the agent to create a new Kvendra project. We planned three runs on macOS and Linux; we stopped after the first one, for the reason below.

## Result: partial.

- **What worked:**
  - The pieces connected: the engine answered its health check, the agent showed the Kvendra MCP server as connected, Ollama accepted the configuration and the model was pulled.
  - The agent loaded the Kvendra skill.
- **What didn't:**
  - On this laptop, Llama 3.1 8B could not generate in time. The agent's run timed out after 5 minutes 15 seconds without a single tool call.
  - A direct test asking the model for one word got no answer within 60 seconds.
  - Ollama's default context (2,048 tokens) was also too small for the agent's instructions plus the tool descriptions. A 16k-context variant made the speed worse.
- **Not run yet:**
  - The engine's embeddings test against a real Ollama, with mxbai-embed-large (1024 dimensions). It is a much lighter model than Llama 8B and should run on a CPU.
  - A full start of the Docker Compose stack with the Ollama profile. Its configuration was checked; the live start was not.

## What we learned

- The architecture works locally: engine, MCP and an OpenAI-compatible model server talk to each other with no cloud involved.
- An 8B generation model on a CPU-only laptop is not enough for an agent that has to read tool descriptions and call tools. You need a GPU or a machine with much more headroom.
- Embeddings are a different job: a small embeddings model is the realistic first step on modest hardware.

## Update — 2026-11-17: the two items we had not run

**Setup.** The Kvendra reference stack (commit `1995bd0`; the current commit `1d0fc8d` only fixes the container health check) with engine `kvendra/kvendra-platform:0.1.0-alpha.2`, the current release (signature and SBOM verified with cosign). A different machine from May: an Apple M5 laptop with 24 GB of RAM, macOS 26.6 and Docker Desktop 29.7.2 (a Linux VM with 10 vCPUs and 5.8 GB). Ollama 0.24.0 runs inside Docker, so on the CPU only, with no GPU. Embeddings model `mxbai-embed-large` (334M parameters, 1024 dimensions, 670 MB).

**1. Full start of the Docker Compose stack with Ollama. Result: works.**
Since October, Ollama is part of the stack by default; there is no separate profile any more (`--no-ollama` leaves it out). From a fresh clone: `cp .env.example .env`, then `./scripts/up.sh`. It pulled the images and the model and brought up four containers (database, engine, Ollama, backups) in 73 seconds. Memory after the tests: Ollama about 760 MB, engine about 28 MB, database about 37 MB.

**2. The engine's embeddings against a real Ollama. Result: works.** <!-- linter-allow: paid-service billing is one of the six test-entity topics, not a service -->
`./scripts/smoke.sh` passed in 1.05 s. Ollama returned 1024-dimension embeddings, as the engine expects. A warm embedding took 34–80 ms, creating an entity with its embedding 50–102 ms, and a search 23–28 ms. We stored 6 entities on different topics (sign-in, storage, deploy, billing, UI theme, backups) and asked 8 questions in other words, such as “how do people log in?” and “restore data after a disaster”. The right entity came first in 8 of 8.

**What this changes.** Once the images and the model are downloaded, the engine, its semantic search and the embeddings model run on a laptop CPU with no cloud service involved. The open part is still the agent: a local generation model that has to read tool descriptions and call tools needs more hardware than a CPU-only laptop. We did not repeat that run.

## Limits

May: one Intel laptop, one model size, one run. November: one Apple laptop with a much faster CPU, one run, one embeddings model, 6 entities. Don't compare the two sets of timings directly; on an Intel CPU-only laptop expect it to be slower.

## Next

- Repeat the agent run on GPU hardware.

## Reproduce it

The quickest path is the reference stack: `git clone https://github.com/KvendraAI/kvendra-reference-stack`, `cp .env.example .env`, `./scripts/up.sh`, then `./scripts/smoke.sh`.

Install Kvendra Platform with Docker Compose: see the Platform manual on the hub, chapter “[Installation with Docker Compose](https://app.kvendra.cloud/hub/kvendra-platform/)”, and chapter “[Embeddings providers](https://app.kvendra.cloud/hub/kvendra-platform/)” for Ollama.

## Links

[Kvendra Platform publication on the hub](https://app.kvendra.cloud/hub/kvendra-platform/) · [Lab 01 (Codex CLI)](/labs/codex-cli/)
