# Getting started

## Prerequisites

- **Node.js** (the repo uses the npm global toolchain; Node 24 is known-good).
- No API keys or network access are needed at runtime — the world data is a
  committed snapshot (`public/geo/gothenburg.json`).

## Install

```sh
npm install
```

## Run the dev server

```sh
npm run dev
```

Opens Vite on **`http://127.0.0.1:8100`**. The first load fetches the geo
snapshot, builds the derived world, resolves a walkable spawn at Brunnsparken,
then renders the city.

## Commands

| Task                      | Command                                   | Notes                                                               |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Dev server                | `npm run dev`                             | Vite, port 8100                                                     |
| **Type check (the gate)** | `npm run typecheck`                       | `tsgo --noEmit` on `tsconfig.app.json` **and** `tsconfig.node.json` |
| Lint                      | `npm run lint` / `npm run lint:fix`       | `eslint .`                                                          |
| Format                    | `npm run format` / `npm run format:check` | Prettier                                                            |
| Production build          | `npm run build`                           | `vite build` (a >500 kB chunk warning is expected/harmless)         |
| Preview build             | `npm run preview`                         | serves `dist/` on port 8100                                         |
| **Full gate**             | `npm run check`                           | `typecheck → lint → build`                                          |

> `npm run check` **must pass with zero errors and zero warnings** before any
> commit. The type gate is **`tsgo`** (TypeScript 7 native preview via
> `@typescript/native-preview`), not `tsc`.

## Regenerating the world data (optional)

The OSM snapshot and the projection metadata (`src/domain/geo/meta.ts`) are
generated — do not hand-edit them:

```sh
node scripts/fetch-osm.mjs
```

This queries OpenStreetMap/Overpass for central Gothenburg, projects everything
to local metres, and writes `public/geo/gothenburg.json` + `meta.ts`.

## Debugging aids

In dev builds, `src/main.tsx` exposes the store on `window`:

- `window.__game` — the zustand `useGame` store (`window.__game.getState()`).
- `window.__player` — the live non-reactive player transform (`x`, `z`, `camYaw`, …).

These are the hooks used for manual testing and headless (puppeteer) checks.
