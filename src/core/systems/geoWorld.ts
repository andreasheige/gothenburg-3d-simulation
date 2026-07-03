import { loadSnapshot } from '@/domain/geo/snapshot';
import type { GeoSnapshot, Pt } from '@/domain/geo/snapshot';
import { WORLD_HALF_X, WORLD_HALF_Z } from '@/domain/geo/meta';

// Authentic-ish Gothenburg tram line colours, keyed by line ref.
const TRAM_COLORS: Record<string, string> = {
  '1': '#8f9296',
  '2': '#f2c200',
  '3': '#1fa0e0',
  '4': '#009e49',
  '5': '#e4002b',
  '6': '#f58220',
  '7': '#8b5e3c',
  '8': '#7a3f9e',
  '9': '#007c8a',
  '10': '#a0c000',
  '11': '#111318',
  '13': '#e5007e',
};

function eq(a: Pt, b: Pt): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

// Stitch unordered track ways into connected polyline chains by matching endpoints.
function stitch(ways: readonly (readonly Pt[])[]): Pt[][] {
  const segs = ways.filter((w) => w.length > 1).map((w) => w.slice() as Pt[]);
  const used = new Array(segs.length).fill(false);
  const chains: Pt[][] = [];
  for (let s = 0; s < segs.length; s++) {
    if (used[s]) continue;
    used[s] = true;
    let chain = segs[s]!.slice();
    let grew = true;
    while (grew) {
      grew = false;
      const tail = chain[chain.length - 1]!;
      const head = chain[0]!;
      for (let i = 0; i < segs.length; i++) {
        if (used[i]) continue;
        const w = segs[i]!;
        const a = w[0]!;
        const b = w[w.length - 1]!;
        if (eq(a, tail)) {
          chain = chain.concat(w.slice(1));
          used[i] = true;
          grew = true;
          break;
        }
        if (eq(b, tail)) {
          chain = chain.concat(w.slice(0, -1).reverse());
          used[i] = true;
          grew = true;
          break;
        }
        if (eq(b, head)) {
          chain = w.slice(0, -1).concat(chain);
          used[i] = true;
          grew = true;
          break;
        }
        if (eq(a, head)) {
          chain = w.slice(1).reverse().concat(chain);
          used[i] = true;
          grew = true;
          break;
        }
      }
    }
    chains.push(chain);
  }
  return chains;
}

function polylineLength(p: readonly Pt[]): number {
  let d = 0;
  for (let i = 1; i < p.length; i++) d += Math.hypot(p[i]![0] - p[i - 1]![0], p[i]![1] - p[i - 1]![1]);
  return d;
}

export interface TramRoute {
  readonly ref: string;
  readonly name: string;
  readonly color: string;
  readonly path: readonly Pt[];
}

export interface AABB {
  minx: number;
  minz: number;
  maxx: number;
  maxz: number;
}

const CELL = 40;
const HALF = 100000; // spatial-hash key spread

function cellKey(cx: number, cz: number): number {
  return (cx + HALF) * (2 * HALF) + (cz + HALF);
}

/** Derived, ready-to-query world built once from the OSM snapshot. */
export interface GeoWorld {
  readonly snapshot: GeoSnapshot;
  readonly tramRoutes: readonly TramRoute[];
  readonly ferryRoutes: readonly (readonly Pt[])[];
  readonly halfX: number;
  readonly halfZ: number;
  /** Flat list of building footprint boxes — the collision volumes (debug view). */
  readonly colliders: readonly AABB[];
  blocked(x: number, z: number, r?: number): boolean;
  nearestHood(x: number, z: number): string;
}

let world: GeoWorld | null = null;

/** The loaded world. Throws if accessed before {@link loadGeoWorld} resolves. */
export function geo(): GeoWorld {
  if (!world) throw new Error('geo world not loaded yet');
  return world;
}

export function isGeoLoaded(): boolean {
  return world !== null;
}

function buildTramRoutes(snap: GeoSnapshot): TramRoute[] {
  const byRef = new Map<string, TramRoute>();
  for (const line of snap.tramLines) {
    const ref = line.ref.split(':')[0]!.trim();
    if (!/^\d+$/.test(ref)) continue; // skip named specials like "Lisebergslinjen"
    if (byRef.has(ref)) continue;
    const chains = stitch(line.ways);
    let best: Pt[] = [];
    for (const c of chains) if (polylineLength(c) > polylineLength(best)) best = c;
    if (best.length < 2) continue;
    byRef.set(ref, {
      ref,
      name: `Spårvagn ${ref}`,
      color: TRAM_COLORS[ref] ?? line.colour ?? '#cccccc',
      path: best,
    });
  }
  return [...byRef.values()].sort((a, b) => Number(a.ref) - Number(b.ref));
}

function buildCollision(snap: GeoSnapshot): { grid: Map<number, AABB[]>; boxes: AABB[] } {
  const grid = new Map<number, AABB[]>();
  const boxes: AABB[] = [];
  for (const b of snap.buildings) {
    let minx = Infinity;
    let minz = Infinity;
    let maxx = -Infinity;
    let maxz = -Infinity;
    for (const [x, z] of b.p) {
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (z < minz) minz = z;
      if (z > maxz) maxz = z;
    }
    const box: AABB = { minx, minz, maxx, maxz };
    boxes.push(box);
    const cx0 = Math.floor(minx / CELL);
    const cx1 = Math.floor(maxx / CELL);
    const cz0 = Math.floor(minz / CELL);
    const cz1 = Math.floor(maxz / CELL);
    for (let cx = cx0; cx <= cx1; cx++)
      for (let cz = cz0; cz <= cz1; cz++) {
        const k = cellKey(cx, cz);
        let arr = grid.get(k);
        if (!arr) {
          arr = [];
          grid.set(k, arr);
        }
        arr.push(box);
      }
  }
  return { grid, boxes };
}

export async function loadGeoWorld(): Promise<GeoWorld> {
  if (world) return world;
  const snapshot = await loadSnapshot();
  const { grid, boxes } = buildCollision(snapshot);
  const tramRoutes = buildTramRoutes(snapshot);
  const ferryRoutes = snapshot.ferries
    .filter((f) => polylineLength(f.p) > 60)
    .map((f) => f.p)
    .sort((a, b) => polylineLength(b) - polylineLength(a))
    .slice(0, 6);

  world = {
    snapshot,
    tramRoutes,
    ferryRoutes,
    halfX: WORLD_HALF_X,
    halfZ: WORLD_HALF_Z,
    colliders: boxes,
    blocked(x, z, r = 0.8) {
      if (Math.abs(x) > WORLD_HALF_X - r || Math.abs(z) > WORLD_HALF_Z - r) return true;
      const cx = Math.floor(x / CELL);
      const cz = Math.floor(z / CELL);
      const arr = grid.get(cellKey(cx, cz));
      if (!arr) return false;
      for (const b of arr) {
        if (x > b.minx - r && x < b.maxx + r && z > b.minz - r && z < b.maxz + r) return true;
      }
      return false;
    },
    nearestHood(x, z) {
      let best = 'Göteborg';
      let bestD = Infinity;
      for (const h of snapshot.hoods) {
        const d = (h.p[0] - x) ** 2 + (h.p[1] - z) ** 2;
        if (d < bestD) {
          bestD = d;
          best = h.n;
        }
      }
      return best;
    },
  };
  return world;
}
