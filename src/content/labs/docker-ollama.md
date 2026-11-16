---
number: 2
slug: docker-ollama
title: Kvendra Platform with Docker and Ollama
result: The self-hosted engine, Ollama and a local agent connected; an 8B model on a laptop CPU was too slow to finish, and the embeddings run is still pending.
status: partial
tools: ["Ollama", "Docker", "Self-hosted"]
versions: Ollama 0.24.0 · Llama 3.1 8B
datePublished: 2026-05-21
dateModified: 2026-05-21
description: "The self-hosted engine, Ollama and a local agent connected; an 8B model on a laptop CPU was too slow to finish, and the embeddings run is still pending."
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

## Limits

One laptop, one model size, one run, May 2026. Results on a machine with a GPU, or with a smaller or better tool-calling model, will be different.

## Next

- Run the embeddings test with mxbai-embed-large.
- Start the Docker Compose stack with the Ollama profile.
- Repeat the agent run on GPU hardware.

This lab will be updated with those results.

## Reproduce it

Install Kvendra Platform with Docker Compose: see the Platform manual on the hub, chapter “[Installation with Docker Compose](https://app.kvendra.cloud/hub/kvendra-platform/)”, and chapter “[Embeddings providers](https://app.kvendra.cloud/hub/kvendra-platform/)” for Ollama.

## Links

[Kvendra Platform publication on the hub](https://app.kvendra.cloud/hub/kvendra-platform/) · [Lab 01 (Codex CLI)](/labs/codex-cli/)
