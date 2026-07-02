# Copilot Instructions — Göteborgs-simulatorn 3D

A browser 3D Gothenburg sandbox built with **React 19 + React Three Fiber (R3F) v9 + Three.js**,
written in **super-strict TypeScript** type-checked by **`tsgo`** (the TypeScript 7 native compiler).
Follow the architecture and conventions below for every change.

## Stack

- **React 19** + **@react-three/fiber v9** + **@react-three/drei v10** + **three 0.185**.
- **zustand v4** for state (curried `create<T>()(...)`).
- **Vite 5** dev/build. Dev server: `http://127.0.0.1:8100`.
- Type gate is **`tsgo`**, not `tsc`. ESLint type-aware rules are OFF until typescript-eslint
  supports the TS 7.x API — do not enable them.

## Commands (verified)

| Task | Command |
| --- | --- |
| Dev server (port 8100) | `npm run dev` |
| Type check (the gate) | `npm run typecheck` → `tsgo --noEmit` on app + node tsconfigs |
| Lint | `npm run lint` (`eslint .`) / `npm run lint:fix` |
| Format | `npm run format` / `npm run format:check` (Prettier) |
| Production build | `npm run build` |
| **Full gate before commit** | `npm run check` (typecheck → lint → build) |

`npm run check` **must pass with zero errors and zero warnings** before any commit.

## Directory structure (feature-first)

```
src/
├── app/               # App shell (Canvas, Suspense, scene routing)
├── main.tsx           # Entry point; mounts <App>, imports styles.css
├── core/              # Stack-agnostic engine foundations
│   ├── config/        # world.ts (COLORS palette, DAY_LENGTH), items.ts
│   ├── types/         # ids.ts (string-literal unions), domain.ts (interfaces), index.ts barrel
│   ├── math/          # path.ts (build/sample/nearest on metric [x,z] polylines)
│   └── systems/       # input.ts, registry.ts, geoWorld.ts (OSM-derived collision + routes)
├── domain/            # Pure typed game data (no React): venues, landmarks, interiors, geo/ (OSM snapshot)
├── state/             # store.ts — zustand store + non-reactive `player` transform
├── shared/            # Reusable, feature-agnostic building blocks
│   ├── three/         # Character, BillboardLabel (R3F primitives)
│   ├── hooks/         # useKeyPress
│   └── ui/            # Loader (DOM overlay)
└── features/          # One folder per concern; each owns its slice
    ├── world/         # WorldScene.tsx + components/ (Ground, Water, Roads, Buildings, Landmarks, StreetLabels, VenueDoors, Lighting)
    ├── player/        # Player controller
    ├── transit/       # TramSystem (trams on OSM routes + river ferries)
    ├── npcs/          # Pedestrians (instanced), Seagulls (boids)
    ├── interiors/     # InteriorScene (enterable bars/clubs)
    ├── systems/       # Systems (proximity, time, wanted, interaction keys)
    └── hud/           # Hud (DOM overlay)
```

### Where does new code go?

- **New reusable 3D mesh/primitive** used by 2+ features → `shared/three/`.
- **New game data** (a venue, tram line, landmark, district) → the matching `domain/*.ts` file only.
  Add its id to the relevant union in `core/types/ids.ts` first.
- **New self-contained gameplay concern** → a new `features/<name>/` folder with a top-level
  component; compose it into `features/world/WorldScene.tsx` (or `app/App.tsx` for a new scene).
- **New engine-level helper** (math, collision, input) → `core/`.
- Never import a `features/*` module from `core/`, `domain/`, `shared/`, or `state/` — dependencies
  flow **downward only**: `app → features → {shared, state, domain, core}`; `domain → core`.

## Import & module conventions

- Use the **`@/` path alias** for all `src` imports (`@/core/...`, `@/features/...`). No deep `../../`.
- `verbatimModuleSyntax` is on → **type-only imports MUST use `import type { … }`**.
- Prefer **named exports** for components (`export function Player()`), not default exports.
- Every React component returns `React.JSX.Element` (or `null`) with an explicit return type.

## Strict-TypeScript rules (these WILL fail the build if ignored)

The following flags are active (`tsconfig.app.json`): `strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`,
`noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`,
`noPropertyAccessFromIndexSignature`, `useUnknownInCatchVariables`, `allowUnreachableCode: false`.

Practical consequences:

- **`noUncheckedIndexedAccess`**: array/index access returns `T | undefined`. Guard with `!` in
  bounded loops (`arr[i]!`) or `?? fallback`. Prefer `Record<Union, T>` for finite-key tables
  (e.g. `ITEMS`, `STATIONS`, `THEMES`, `PROFILE`) — those do **not** add `undefined`.
- **`exactOptionalPropertyTypes`**: never pass explicit `undefined` to an optional prop. For
  optional R3F refs, use `ref={someRef ?? null}` (R3F accepts `null`, not `undefined`).
- **`noPropertyAccessFromIndexSignature`**: index-signature access uses brackets, not dots.
- **Ids are string-literal unions** in `core/types/ids.ts` — the single source of truth. Data files
  in `domain/` must conform. Add new ids there before using them.
- Coordinates are documentation-level `World = number` metres (not branded). **1 world unit = 1
  metre; North is `-Z`, East is `+X`.** Convert real lon/lat with `project(lon, lat)` from
  `@/domain/geo/meta`. There is no longer a tile grid.
- ESLint enforces `no-useless-assignment` — don't initialize a variable then immediately reassign it
  in a `do/while`; declare with a type annotation instead.

## R3F / rendering conventions

- Put transforms/animation in `useFrame`; clamp delta: `const dt = Math.min(dtRaw, 0.05)`.
- Keep per-frame simulation state (player position, tram runtime, tourists) **out of zustand** to
  avoid re-renders — use the non-reactive `player` object and `core/systems/registry.ts`.
- Only touch React state for HUD-facing values (wallet, score, wanted, nearby, toasts, scene).
- Many entities (pedestrians, seagulls) use `instancedMesh`; type refs as
  `useRef<THREE.InstancedMesh>(null)` and guard `if (!ref.current) return` in `useFrame`.
- Geometry elements must not take a `rotation` prop — rotate the parent `<mesh>` instead.
- Reuse the shared `<Character>` avatar (torso/head/beanie/legs) for any humanoid.

## Geo / OSM world (`domain/geo/` + `core/systems/geoWorld.ts`)

- The city is real OpenStreetMap data for central Gothenburg, fetched by
  `scripts/fetch-osm.mjs` (`node scripts/fetch-osm.mjs`) into a committed snapshot
  `public/geo/gothenburg.json` (~6.4 MB) plus an auto-generated `src/domain/geo/meta.ts`
  (projection constants + `project()`). **Do not hand-edit `meta.ts`**; re-run the script to refresh.
- `domain/geo/snapshot.ts` types the snapshot and loads it at runtime (`loadSnapshot()`).
  Coordinates in the JSON are already projected to world metres as `[x, z]`.
- `core/systems/geoWorld.ts` derives the queryable `GeoWorld` (building AABB collision `blocked()`,
  `nearestHood()`, stitched `tramRoutes`, `ferryRoutes`, world half-extents). Access it via `geo()`;
  it throws before `loadGeoWorld()` resolves.
- **App awaits `loadGeoWorld()` and gates `<WorldScene>` on it** (Loader shown meanwhile), so any
  component/system rendered inside the city scene may call `geo()` safely. `resolveSpawn()` snaps the
  player to a walkable spot near Brunnsparken once loaded.
- World rendering merges geometry for performance (`features/world/geometry.ts`): extruded building
  footprints, flat area polygons (parks/squares/water), and road ribbons — one mesh per layer.

## State store (`state/store.ts`)

- `useGame` is the zustand hook; read one slice per selector in components.
- Use `useGame.getState()` inside `useFrame`/event handlers (non-reactive reads).
- The mutable `player` transform and `registry` are shared singletons — mutate their fields directly.

## Workflow expectations

- **TDD-style for non-trivial logic**, surgical changes, match existing style, DRY via `shared/`.
- Run `npm run check` and make it green before finishing.
- **Conventional Commits**, structured by concern. Types: `feat`, `fix`, `chore`, `refactor`,
  `docs`, `style`, `test`, `perf`, `ci`, `build`. Scope with the feature/layer, e.g.
  `feat(transit): …`, `fix(player): …`, `chore(tooling): …`.
- Do **not** run `git commit`/`git push` unless explicitly asked.
- All user-facing copy is **Swedish** (see HUD, toasts, prompts) — keep it that way.
