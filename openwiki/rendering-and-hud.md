# Rendering & HUD

## The city scene graph — `src/features/world/WorldScene.tsx`

`WorldScene` mounts every world layer as a sibling R3F component (order matters
for draw/scene composition, not for logic):

```
<Lighting/>        directional sun + ambient, shadow-casting
<Ground/>          procedurally-textured terrain (features/world/groundTexture.ts)
<Water/>           the Göta älv river surface
<Roads/>           road ribbons from snapshot.roads (width by highway class)
<Buildings/>       extruded footprints with procedural facades (facadeTexture.ts)
<Landmarks/>       Liseberg, Feskekörka, Slottskogen, …
<StreetFurniture/> instanced trees / lamps / bins / benches (furniture.ts)
<Portals/>         fast-travel pads
<StreetLabels/>    camera-facing street-name Text
<VenueDoors/>      entrances that trigger enterInterior
<TramSystem/>      trams + ferries (+ enterable interiors)
<TransitStops/>    hållplats platforms, shelters and signs
<Pedestrians/>     commuters/tourists
<Seagulls/>        boids flocking; dive-bomb dropped food
<Rain/>            weather particles
<Player/>          the avatar + orbit-follow camera
<Systems/>         per-frame gameplay loop (renders null)
```

Helpers used by these components live alongside them in `features/world/`:
`geometry.ts`, `furniture.ts`, `facadeTexture.ts`, `groundTexture.ts`.

## Camera & movement — `src/features/player/Player.tsx`

A spherical **orbit-follow** camera around the avatar:

- **Move:** `WASD` / arrows (world-space, relative to camera yaw); `Shift` to run.
- **Look:** mouse-drag to orbit (yaw + pitch), mouse wheel to zoom (`dist`).
- **Nudge:** `Q`/`R` yaw, `Z`/`X` pitch (clamped to `PITCH_MIN…PITCH_MAX`).
- Publishes `player.camYaw` each frame for the compass/minimap; movement respects
  `geo().blocked()` collision.

## Interiors — `src/features/interiors/InteriorScene.tsx`

When `scene === 'interior'`, the city is replaced by a room built from
`domain/interiors.ts` for the entered venue. `exitInterior` returns you just
outside the door.

## HUD — `src/features/hud/`

All 2D overlay UI, reading `useGame`:

- **`Hud.tsx`** — the stat panel (place, street, nearest landmark, clock,
  weather, service band, wallet, score, wanted) plus the contextual `E`-prompt
  and toast stack.
- **`Compass.tsx`** — heading strip driven by `player.camYaw` (North = −Z).
- **`Minimap.tsx`** — a canvas map with two modes:
  - a small always-on minimap cropped around the player;
  - a full-city **big map** (`M`) showing tram lines, hållplats markers, landmark
    diamonds, live trams, a prominent pulsing **player marker**, and clickable
    **portal rings** (click → `teleport`). Rendered once to an offscreen base
    canvas, then cropped/scaled each frame.
- **`TravelMenu.tsx`** — the `T` fast-travel list of portals.

## Rendering conventions

- **Instancing** for anything bulk (furniture, stop platforms/poles): a shared
  `THREE.Object3D` writes matrices into an `instancedMesh`, with
  `frustumCulled={false}` because instances sit far from the local origin.
- **Labels/signs** that must face the camera use `drei`'s `Billboard` + `Text`
  (see `shared/three/BillboardLabel.tsx`) — these can't be instanced.
- Keep per-frame work off React: read/write `player` and `registry`, not
  `useGame`, inside `useFrame`.
