# Architecture

## Big picture

The game is a **React Three Fiber** app. React owns the scene graph and HUD;
per-frame simulation runs inside R3F's `useFrame` loop (which is a
`requestAnimationFrame` loop under the hood). Hot, per-frame state is kept
**out** of React to avoid re-renders — see [State & systems](./state-and-systems.md).

```
                 ┌────────────────────────────────────────────┐
                 │  public/geo/gothenburg.json (OSM snapshot)  │
                 └───────────────────────┬────────────────────┘
                                         │ loadSnapshot()
                                         ▼
   domain/geo/snapshot.ts  ──►  core/systems/geoWorld.ts  ──►  GeoWorld
   (typed view + fetch)         (stitch routes, build            • blocked(x,z,r)
                                 collision grid, hoods)           • nearestHood()
                                                                  • tramRoutes / ferryRoutes
                                         │
                     ┌───────────────────┼─────────────────────────┐
                     ▼                   ▼                         ▼
             features/world/*     features/transit/*         features/systems/Systems.tsx
             (render the city)    (trams, ferries, stops)    (per-frame gameplay loop)
                     │                   │                         │
                     └─────────► reads geo(), registry, `player` transform ◄────────┘
                                         │
                                         ▼
                                 state/store.ts (zustand `useGame`)  ──►  features/hud/*
```

## Boot sequence (`src/app/App.tsx`)

1. `input.attach()` — start listening for keyboard input (`core/systems/input.ts`).
2. `startWeather()` — begin the live-ish weather feed (`state/weather.ts`).
3. `loadGeoWorld()` (async) — fetch + build the derived `GeoWorld` singleton.
4. On resolve: `resolveSpawn()` snaps the player to a walkable spot near
   Brunnsparken, then `setReady(true)`.
5. The R3F `<Canvas>` renders `<WorldScene>` once `ready` (or `<InteriorScene>`
   when `scene === 'interior'`), plus the always-on `<Hud>`.

The `<Canvas>` sets shadows on, `dpr={[1, 1.75]}`, tone-mapping exposure `1.25`,
a `fov: 55` camera, a dark background, and fog (`320…1100 m`).

## The four conceptual managers

The task brief's engine roles map onto the code like this:

| Role                                              | Where it lives                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **GameEngine** (loop, delta time, state)          | R3F `useFrame` + `features/systems/Systems.tsx` + `state/store.ts`                                 |
| **MapManager** (grid, collision, path nodes)      | `core/systems/geoWorld.ts` (collision spatial hash, tram routes) + `core/math/path.ts`             |
| **EntityManager** (player, NPCs, vehicles, birds) | `features/player`, `features/npcs`, `features/transit`, coordinated via `core/systems/registry.ts` |
| **UIManager** (HUD, inventory, overlays)          | `features/hud/*` reading `useGame`                                                                 |

## Time & determinism

- The in-game clock is **not** a free-running timer: it is slaved to real
  **Europe/Stockholm** wall-clock time via `core/systems/time.ts` (`realDayT()`),
  so day/night and the transit timetable match reality (including DST).
- The world itself is **deterministic**: it is rebuilt identically from the
  committed snapshot on every load (no runtime network dependency).

## Two render scenes

- `scene === 'city'` → `features/world/WorldScene.tsx` (the open city).
- `scene === 'interior'` → `features/interiors/InteriorScene.tsx` (inside a
  venue). Transitions are driven by `enterInterior` / `exitInterior` in the store.

See [Rendering & HUD](./rendering-and-hud.md) for the full scene graph.
