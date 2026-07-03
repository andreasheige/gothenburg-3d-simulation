import type { GeoArea, GeoRoad, GeoSnapshot, Pt } from '@/domain/geo/snapshot';

// Deterministic procedural placement of street furniture (streetlights, trees,
// benches, waste bins) derived from the OSM snapshot. Everything is seeded off
// world coordinates so the layout is stable across reloads.

export interface Placement {
  /** World position. */
  readonly x: number;
  readonly z: number;
  /** Y rotation in radians. */
  readonly r: number;
  /** Uniform-ish scale factor. */
  readonly s: number;
}

export interface Furniture {
  readonly streetlights: readonly Placement[];
  readonly trees: readonly Placement[];
  readonly benches: readonly Placement[];
  readonly bins: readonly Placement[];
}

export type Blocked = (x: number, z: number, r?: number) => boolean;

const MAJOR = new Set(['motorway', 'trunk', 'primary', 'secondary']);
const MINOR = new Set(['tertiary', 'unclassified', 'residential', 'living_street']);

// Caps keep instance counts (and build time) bounded on the densest snapshots.
const CAP_LIGHTS = 750;
const CAP_TREES = 3200;
const CAP_BENCHES = 300;
const CAP_BINS = 420;

function hash(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

interface SamplePt {
  x: number;
  z: number;
  nx: number;
  nz: number;
  ang: number;
}

// Walk a polyline at a fixed arc-length step, yielding evenly-spaced points with
// the left-hand unit normal and the segment heading.
function sampleAlong(p: readonly Pt[], step: number, startOffset: number): SamplePt[] {
  const out: SamplePt[] = [];
  let next = startOffset;
  let acc = 0;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i]!;
    const b = p[i + 1]!;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    if (len < 1e-3) continue;
    const ux = dx / len;
    const uz = dz / len;
    const nx = -uz;
    const nz = ux;
    const ang = Math.atan2(ux, uz);
    const segEnd = acc + len;
    while (next <= segEnd) {
      const d = next - acc;
      out.push({ x: a[0] + ux * d, z: a[1] + uz * d, nx, nz, ang });
      next += step;
    }
    acc = segEnd;
  }
  return out;
}

function openRing(p: readonly Pt[]): Pt[] {
  const r = p.slice();
  const a = r[0];
  const b = r[r.length - 1];
  if (r.length > 1 && a && b && a[0] === b[0] && a[1] === b[1]) r.pop();
  return r;
}

function pointInPoly(ring: readonly Pt[], x: number, z: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    const intersect =
      a[1] > z !== b[1] > z && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0];
    if (intersect) inside = !inside;
  }
  return inside;
}

function areaCentroidBounds(ring: readonly Pt[]): {
  minx: number;
  minz: number;
  maxx: number;
  maxz: number;
} {
  let minx = Infinity;
  let minz = Infinity;
  let maxx = -Infinity;
  let maxz = -Infinity;
  for (const [x, z] of ring) {
    if (x < minx) minx = x;
    if (x > maxx) maxx = x;
    if (z < minz) minz = z;
    if (z > maxz) maxz = z;
  }
  return { minx, minz, maxx, maxz };
}

// --- streetlights: line the arterials, alternating sides -------------------

function buildStreetlights(roads: readonly GeoRoad[], blocked: Blocked): Placement[] {
  const out: Placement[] = [];
  for (const road of roads) {
    const isMajor = MAJOR.has(road.k);
    if (!isMajor && !MINOR.has(road.k)) continue;
    const kerbHalf = isMajor ? 7.4 : 4.6;
    const step = isMajor ? 30 : 44;
    const pts = sampleAlong(road.p, step, step * 0.5);
    let flip = false;
    for (const pt of pts) {
      flip = !flip;
      const side = flip ? 1 : -1;
      const x = pt.x + pt.nx * kerbHalf * side;
      const z = pt.z + pt.nz * kerbHalf * side;
      if (blocked(x, z, 0.5)) continue;
      // face the lamp arm towards the carriageway
      out.push({ x, z, r: Math.atan2(-pt.nx * side, -pt.nz * side), s: 1 });
      if (out.length >= CAP_LIGHTS) return out;
    }
  }
  return out;
}

// --- trees: avenue rows plus park scatter ----------------------------------

function buildTrees(snap: GeoSnapshot, blocked: Blocked): Placement[] {
  const out: Placement[] = [];

  // avenue rows along the major streets, both sides
  for (const road of snap.roads) {
    if (!MAJOR.has(road.k)) continue;
    const pts = sampleAlong(road.p, 24, 12);
    for (const pt of pts) {
      for (const side of [1, -1] as const) {
        const off = 9.2;
        const x = pt.x + pt.nx * off * side + (hash(pt.x, pt.z) - 0.5) * 1.5;
        const z = pt.z + pt.nz * off * side + (hash(pt.z, pt.x) - 0.5) * 1.5;
        if (blocked(x, z, 1.2)) continue;
        out.push({ x, z, r: hash(x, z) * Math.PI * 2, s: 0.85 + hash(z, x) * 0.4 });
        if (out.length >= CAP_TREES) return out;
      }
    }
  }

  // park scatter on a jittered grid clipped to each park polygon
  const spacing = 15;
  for (const park of snap.parks) {
    const ring = openRing(park.p);
    if (ring.length < 3) continue;
    const bb = areaCentroidBounds(ring);
    for (let gx = bb.minx; gx <= bb.maxx; gx += spacing) {
      for (let gz = bb.minz; gz <= bb.maxz; gz += spacing) {
        const jx = gx + (hash(gx, gz) - 0.5) * spacing * 0.7;
        const jz = gz + (hash(gz, gx) - 0.5) * spacing * 0.7;
        if (hash(jx * 3.1, jz * 2.7) > 0.62) continue; // thin the canopy
        if (!pointInPoly(ring, jx, jz)) continue;
        if (blocked(jx, jz, 1.2)) continue;
        out.push({ x: jx, z: jz, r: hash(jx, jz) * Math.PI * 2, s: 0.95 + hash(jz, jx) * 0.7 });
        if (out.length >= CAP_TREES) return out;
      }
    }
  }
  return out;
}

// --- benches + bins: around the paved squares ------------------------------

function buildSquareFurniture(
  squares: readonly GeoArea[],
  blocked: Blocked,
): { benches: Placement[]; bins: Placement[] } {
  const benches: Placement[] = [];
  const bins: Placement[] = [];
  for (const sq of squares) {
    const ring = openRing(sq.p);
    if (ring.length < 3) continue;
    const pts = sampleAlong([...ring, ring[0]!], 15, 6);
    let n = 0;
    for (const pt of pts) {
      // pull slightly inward off the perimeter
      const x = pt.x - pt.nx * 3;
      const z = pt.z - pt.nz * 3;
      if (blocked(x, z, 0.6)) continue;
      if (n % 2 === 0 && benches.length < CAP_BENCHES) {
        benches.push({ x, z, r: pt.ang, s: 1 });
      } else if (bins.length < CAP_BINS) {
        bins.push({ x, z, r: pt.ang, s: 1 });
      }
      n++;
    }
  }
  return { benches, bins };
}

/** Generate all street furniture placements from the world snapshot. */
export function buildFurniture(snap: GeoSnapshot, blocked: Blocked): Furniture {
  const streetlights = buildStreetlights(snap.roads, blocked);
  const trees = buildTrees(snap, blocked);
  const { benches, bins } = buildSquareFurniture(snap.squares, blocked);

  // scatter a few extra bins beside every sixth streetlight
  for (let i = 0; i < streetlights.length && bins.length < CAP_BINS; i += 6) {
    const l = streetlights[i]!;
    bins.push({ x: l.x + 1.4, z: l.z, r: 0, s: 1 });
  }

  return { streetlights, trees, benches, bins };
}
