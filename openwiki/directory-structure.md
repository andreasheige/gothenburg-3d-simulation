# Directory structure

Feature-first layout under `src/`. The `@/*` path alias maps to `src/*`.

```
src/
├── main.tsx                 # React root; mounts <App>; exposes window.__game/__player in DEV
├── styles.css               # global CSS (HUD, minimap, menus)
├── app/
│   └── App.tsx              # R3F <Canvas>, scene switch (city|interior), async world boot
│
├── core/                    # engine-level, framework-light building blocks
│   ├── config/
│   │   ├── items.ts         # ITEMS catalogue (price, icon, sellable…)
│   │   └── world.ts         # world-tuning constants
│   ├── math/
│   │   └── path.ts          # buildPathXZ / samplePath — arc-length polyline sampling
│   ├── systems/
│   │   ├── geoWorld.ts      # GeoWorld: derived, queryable world (collision, tram routes, hoods)
│   │   ├── input.ts         # keyboard input singleton (input.attach())
│   │   ├── navigation.ts    # nearestStreet / nearestLandmark orientation helpers
│   │   ├── registry.ts      # non-reactive runtime registries (trams, tourists)
│   │   └── time.ts          # realDayT / realWeekday — Europe/Stockholm wall clock
│   └── types/               # shared domain types + branded ids (index re-exports)
│
├── domain/                  # pure data + typed views over the OSM snapshot
│   ├── geo/
│   │   ├── meta.ts          # AUTO-GENERATED projection + world half-extents
│   │   └── snapshot.ts      # GeoSnapshot types + loadSnapshot() fetch
│   ├── transit/
│   │   ├── schedule.ts      # synthetic Västtrafik timetable (headways, service bands)
│   │   └── stops.ts         # shared stop math (dwell distances + deduped stop markers)
│   ├── interiors.ts         # interior room definitions
│   ├── landmarks.ts         # LANDMARKS (Liseberg, Feskekörka, …)
│   ├── portals.ts           # PORTALS fast-travel hubs (projected lon/lat)
│   └── venues.ts            # VENUES (bars/clubs) + SHOPS
│
├── features/                # R3F components + gameplay, grouped by concern
│   ├── world/               # the city: Ground, Water, Roads, Buildings, Landmarks,
│   │   ├── WorldScene.tsx    #   StreetFurniture, Portals, StreetLabels, VenueDoors…
│   │   ├── components/       # one component per world layer
│   │   └── *.ts              # facadeTexture / groundTexture / geometry / furniture helpers
│   ├── transit/             # TramSystem.tsx (+ components/TransitStops.tsx)
│   ├── npcs/                # Pedestrians.tsx, Seagulls.tsx (boids)
│   ├── player/              # Player.tsx (movement + orbit camera)
│   ├── weather/             # Rain.tsx
│   ├── interiors/           # InteriorScene.tsx (inside venues)
│   ├── hud/                 # Hud, Compass, Minimap, TravelMenu
│   └── systems/             # Systems.tsx — the per-frame gameplay loop (renders null)
│
├── shared/                  # cross-feature reusables
│   ├── hooks/useKeyPress.ts
│   ├── three/               # BillboardLabel, Character
│   └── ui/Loader.tsx
│
└── state/
    ├── store.ts             # zustand useGame store + non-reactive `player` transform
    └── weather.ts           # startWeather() — live-ish weather feed
```

## Where things live (rules of thumb)

- **Pure data / constants** → `domain/` or `core/config/`.
- **Queryable engine services** (collision, time, input, navigation) → `core/systems/`.
- **Anything that renders** (a `THREE`/R3F component) → `features/<area>/`.
- **Per-frame gameplay logic that renders nothing** → `features/systems/Systems.tsx`.
- **Reused UI/three helpers** → `shared/`.
