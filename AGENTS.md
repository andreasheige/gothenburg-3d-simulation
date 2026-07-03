# Repository guide for coding agents

This repository ships a maintained wiki for agents in **[`openwiki/`](./openwiki/README.md)**.

**Before answering questions or making changes, consult the wiki** — it is the
fastest accurate source of context on architecture, conventions, and where things
live:

- [openwiki/README.md](./openwiki/README.md) — index + quick facts
- [Architecture](./openwiki/architecture.md) · [World & geo](./openwiki/world-and-geo.md) ·
  [State & systems](./openwiki/state-and-systems.md) · [Transit](./openwiki/transit.md) ·
  [Rendering & HUD](./openwiki/rendering-and-hud.md)
- [Getting started](./openwiki/getting-started.md) · [Directory structure](./openwiki/directory-structure.md) ·
  [Conventions](./openwiki/conventions.md)

## Essentials

- **Stack:** React 19 + React Three Fiber v9 + three 0.185 + zustand v4 + Vite 5.
- **Type gate:** `tsgo` (TypeScript 7 native preview), **not** `tsc`.
- **Before committing:** `npm run check` (typecheck → lint → build) must pass
  with zero errors and zero warnings.
- **Dev server:** `npm run dev` → http://127.0.0.1:8100
- **Path alias:** `@/*` → `src/*`.

Repo-specific rules are canonical in
[`.github/copilot-instructions.md`](./.github/copilot-instructions.md).

_The wiki is generated with [OpenWiki](https://github.com/langchain-ai/openwiki)
conventions; refresh it with `owiki --update` (local Ollama) after changes._
