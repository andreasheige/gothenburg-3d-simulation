# World & geo pipeline

The city is **not** hand-placed — it is derived from a committed OpenStreetMap
snapshot of central Gothenburg and turned into a queryable world at load time.

## 1. Projection & extents — `src/domain/geo/meta.ts`

**Auto-generated** by `scripts/fetch-osm.mjs` (do not hand-edit). Uses an
equirectangular projection around a Gothenburg origin. `1 unit == 1 metre`,
**x = east, z = south (North is −Z)**.

- `project(lon, lat) -> { x, z }` — WGS84 → local metres.
- `WORLD_HALF_X`, `WORLD_HALF_Z` — half-extents of the playable box, derived from
  the bbox (`s 57.68, w 11.915, n 57.725, e 12.015`).

## 2. The snapshot — `src/domain/geo/snapshot.ts`

A typed view over `public/geo/gothenburg.json` (~6.4 MB) plus `loadSnapshot()`,
which `fetch`es the asset (offline-capable, deterministic). Coordinates are
already projected to `[x, z]` metres (`type Pt = readonly [number, number]`).

`GeoSnapshot` contains: `roads`, `tramTracks`, `tramLines`, `ferries`, `water`,
`parks`, `squares`, `hoods` (neighbourhood label points), and `buildings`
(footprint polygon + height).

## 3. The derived world — `src/core/systems/geoWorld.ts`

`loadGeoWorld()` builds a single `GeoWorld` from the snapshot (memoised in a
module-level `world`). Access it anywhere with **`geo()`** (throws if called
before the async load resolves; guard with `isGeoLoaded()`).

`GeoWorld` exposes:

| Member                    | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `snapshot`                | the raw typed snapshot                                      |
| `tramRoutes: TramRoute[]` | numbered lines with a single stitched `path` + brand colour |
| `ferryRoutes: Pt[][]`     | the longest few ferry polylines                             |
| `halfX`, `halfZ`          | world half-extents                                          |
| `blocked(x, z, r=0.8)`    | true if inside a building footprint (or out of bounds)      |
| `nearestHood(x, z)`       | nearest neighbourhood name (district readout)               |

### Tram route stitching (`buildTramRoutes`)

OSM relations store a line as many **unordered** track ways. `stitch()` joins
them into connected polyline chains by endpoint matching, then the **longest**
chain becomes the route `path`. Only numeric refs are kept (named specials like
_Lisebergslinjen_ are skipped); colours come from a curated `TRAM_COLORS` map
keyed by line ref, falling back to the OSM `colour`.

### Collision (`buildCollision`)

Building footprints are reduced to axis-aligned bounding boxes (AABBs) and
indexed into a **spatial hash grid** (`CELL = 40 m`). `blocked()` looks up only
the player's cell, so collision is O(boxes-in-cell), not O(all buildings). This
powers walk collision, spawn resolution, and fast-travel landing (see
`resolveSpawn` / `teleport` in `state/store.ts`).

## 4. Path sampling — `src/core/math/path.ts`

`buildPathXZ(points, spacing)` resamples a polyline to even spacing and
precomputes arc-length; `samplePath(path, d)` returns the position (and tangent)
at distance `d`. Trams, ferries, and transit-stop placement all move/measure
along these paths. See [Transit](./transit.md).

## 5. Orientation — `src/core/systems/navigation.ts`

`nearestStreet(x, z)` and `nearestLandmark(x, z)` scan flat point arrays built
once from the snapshot — cheap enough to query a few times per second from the
systems loop to drive the HUD's street/landmark readouts.
