# CLAUDE.md

See **[AGENTS.md](./AGENTS.md)** and the maintained wiki in
**[`openwiki/`](./openwiki/README.md)** for full context before making changes.

Quick pointers:

- **Architecture & data flow:** [openwiki/architecture.md](./openwiki/architecture.md)
- **World from OpenStreetMap:** [openwiki/world-and-geo.md](./openwiki/world-and-geo.md)
- **State split (useGame / player / registry) & the per-frame loop:** [openwiki/state-and-systems.md](./openwiki/state-and-systems.md)
- **Trams, stops, timetable, fast-travel:** [openwiki/transit.md](./openwiki/transit.md)
- **Scene graph, camera, HUD:** [openwiki/rendering-and-hud.md](./openwiki/rendering-and-hud.md)
- **Strict-TS & performance conventions:** [openwiki/conventions.md](./openwiki/conventions.md)

Non-negotiables:

- Type gate is **`tsgo`**, not `tsc`. Run **`npm run check`** (typecheck → lint →
  build) before committing — it must be green with zero warnings.
- Never put per-frame values in the zustand store; mutate the non-reactive
  `player`/`registry` objects instead.
- `public/geo/gothenburg.json` and `src/domain/geo/meta.ts` are generated — do
  not hand-edit.

Repo-specific rules are canonical in
[`.github/copilot-instructions.md`](./.github/copilot-instructions.md).
