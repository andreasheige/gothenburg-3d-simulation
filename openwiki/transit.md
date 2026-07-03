# Transit

Public transport is the heart of the sim: numbered trams and ferries follow real
OSM geometry, stop at clearly-signed hållplatser on a time-of-day timetable, and
can be boarded and ridden from the inside.

## Vehicles — `src/features/transit/TramSystem.tsx`

- Builds a fleet from `geo().tramRoutes` (numbered lines with a stitched `path`
  and brand colour) plus ferries from `geo().ferryRoutes`.
- Each route's polyline is clipped to the longest run **inside the world box**
  (`longestInBounds`, from `domain/transit/stops.ts`) so trams stay central, then
  resampled with `buildPathXZ` and driven along it with `samplePath`.
- How many vehicles run on a line comes from the live timetable (denser at rush
  hour — see below). Vehicles register themselves in `registry.trams` as
  `TramRuntime` (`pos`, `doorsOpen`, `stationName`, `line`, …) so the systems
  loop and minimap can see them.
- **Dwell:** at each stop a tram decelerates, opens doors (`doorsOpen = true`),
  waits, then departs.

### Riding & interiors

- Boarding: when near an **open-door** tram, `E` calls `boardTram` — stamps a
  `ticket` if held, otherwise raises the wanted level (fare-dodging). Sets
  `player.onTram` and `riding = line.id`.
- The `Tram` component swaps to a **cutaway interior cabin** (`TramInterior`)
  when it is the ridden vehicle, so you see and sit inside.
- Disembarking: `E` at the next open-door stop places you beside the tram and
  calls `exitTram` (+6 score).

## Stops (hållplatser) — `src/domain/transit/stops.ts`

Single source of truth for stop positions, shared by three consumers (dwell
logic, the 3D signs, and the map):

- `buildStopDists(path, nameAt)` — stop **distances along one route** (every
  `SPACING = 340 m` from `FIRST = 300 m`, ending `END_MARGIN = 60 m` early); used
  by `TramSystem` for dwell.
- `buildTransitStops(world)` — every stop as **deduped world points**
  (`TransitStop { x, z, name, colors[] }`). Stops within `DEDUPE_RADIUS = 32 m`
  merge (routes sharing a corridor call at one platform) and accumulate the line
  colours. Yields ~40–70 unique stops. Used by the 3D markers and the map.

### 3D signage — `src/features/transit/components/TransitStops.tsx`

Renders a clear stop per `buildTransitStops` entry: an **instanced** raised
platform + glass shelter (roof + posts) + sign pole for bulk geometry, plus a
per-stop **camera-facing Västtrafik sign** (`drei` `Billboard` + `Text`) showing
the stop name, a "HÅLLPLATS" caption, and a coloured dot for each calling line.
Mounted in `WorldScene`. (Instancing uses `frustumCulled={false}` — required for
instances placed far from the origin.)

## Timetable — `src/domain/transit/schedule.ts`

A synthetic but realistic Västtrafik timetable driven by **real** Stockholm time
(`realDayT` / `realWeekday`):

- `BASE_HEADWAY` — daytime minutes between departures per line ref (trunk lines
  tighter, e.g. line 3 = 6 min); `DEFAULT_HEADWAY = 12`.
- `bandFor(hour, weekend)` — a service band + multiplier: _Nattrafik_ (×3),
  _Rusningstrafik_ (×0.7 on weekday peaks), _Dagtrafik_ (×1), _Kvällstrafik_,
  _Sen kväll_ (×1.8), etc.
- `currentService(lineId)` → `{ headwayMin, band, nextMin }`, shown in the board
  prompt (e.g. "avgång var 6 min") and used to scale the fleet size.

## Fast-travel — `src/domain/portals.ts` + `features/world/components/Portals.tsx`

`PORTALS` is a curated set of 12 central hubs (Brunnsparken, Nordstan,
Centralstationen, Järntorget, Haga, Avenyn, Götaplatsen, Liseberg, Slottskogen,
Feskekörka, Läppstiftet, Skansen Kronan), projected from real lon/lat. They are
reachable three ways:

1. Walking onto a portal pad in the world (`Portals.tsx`).
2. The **T** travel menu (`features/hud/TravelMenu.tsx`).
3. Clicking a portal on the **big map** (`features/hud/Minimap.tsx`).

All routes call `useGame.teleport(x, z, name)`, which is blocked while riding a
tram and spiral-snaps the destination to the nearest walkable spot before moving
the player.
