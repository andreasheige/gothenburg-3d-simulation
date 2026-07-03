import * as THREE from 'three';
import type { GeoArea, GeoBuilding, GeoRoad, Pt } from '@/domain/geo/snapshot';

// --- helpers -------------------------------------------------------------

function openRing(p: readonly Pt[]): Pt[] {
  const r = p.slice();
  const a = r[0];
  const b = r[r.length - 1];
  if (r.length > 1 && a && b && a[0] === b[0] && a[1] === b[1]) r.pop();
  return r;
}

function signedArea(r: readonly Pt[]): number {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i]!;
    const b = r[(i + 1) % r.length]!;
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

function hash(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// Triangulate a flat polygon ring into a list of triangle index triples.
function triangulate(ring: readonly Pt[]): number[][] {
  const contour = ring.map((p) => new THREE.Vector2(p[0], p[1]));
  try {
    return THREE.ShapeUtils.triangulateShape(contour, []);
  } catch {
    return [];
  }
}

// --- flat areas (water / parks / squares) --------------------------------

export function buildAreaGeometry(areas: readonly GeoArea[], y: number): THREE.BufferGeometry {
  const pos: number[] = [];
  for (const a of areas) {
    const ring = openRing(a.p);
    if (ring.length < 3) continue;
    const tris = triangulate(ring);
    for (const t of tris) {
      for (const idx of t) {
        const p = ring[idx]!;
        pos.push(p[0], y, p[1]);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// --- road / path ribbons -------------------------------------------------

export function buildRibbonGeometry(roads: readonly GeoRoad[], width: number, y: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const hw = width / 2;
  for (const road of roads) {
    const p = road.p;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i]!;
      const b = p[i + 1]!;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 1;
      const nx = (-dz / len) * hw;
      const nz = (dx / len) * hw;
      const ax = a[0];
      const az = a[1];
      const bx = b[0];
      const bz = b[1];
      // quad (a-left, a-right, b-right, b-left)
      pos.push(ax + nx, y, az + nz, ax - nx, y, az - nz, bx - nx, y, bz - nz);
      pos.push(ax + nx, y, az + nz, bx - nx, y, bz - nz, bx + nx, y, bz + nz);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// --- dashed lane markings -----------------------------------------------

// Centre-line dashes along each road polyline, spaced by arc length so dashes
// stay evenly sized regardless of segment lengths.
export function buildDashedGeometry(
  roads: readonly GeoRoad[],
  dashLen: number,
  gapLen: number,
  width: number,
  y: number,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const hw = width / 2;
  const period = dashLen + gapLen;
  for (const road of roads) {
    const p = road.p;
    let acc = 0; // arc length from the road start
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i]!;
      const b = p[i + 1]!;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 1;
      const ux = dx / len;
      const uz = dz / len;
      const nx = -uz * hw;
      const nz = ux * hw;
      let s = 0;
      let guard = 0;
      while (s < len && guard++ < 4000) {
        const phase = (acc + s) % period;
        if (phase < dashLen) {
          const end = Math.min(len, s + (dashLen - phase));
          const x0 = a[0] + ux * s;
          const z0 = a[1] + uz * s;
          const x1 = a[0] + ux * end;
          const z1 = a[1] + uz * end;
          pos.push(x0 + nx, y, z0 + nz, x0 - nx, y, z0 - nz, x1 - nx, y, z1 - nz);
          pos.push(x0 + nx, y, z0 + nz, x1 - nx, y, z1 - nz, x1 + nx, y, z1 + nz);
          s = end + 1e-4;
        } else {
          s += period - phase + 1e-4;
        }
      }
      acc += len;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// --- twin tram rails -----------------------------------------------------

// Two thin metal rails offset laterally from each track centreline by ±gauge/2.
export function buildRailsGeometry(
  tracks: readonly (readonly Pt[])[],
  gauge: number,
  width: number,
  y: number,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const half = width / 2;
  for (const p of tracks) {
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i]!;
      const b = p[i + 1]!;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len;
      const nz = dx / len;
      for (const off of [gauge / 2, -gauge / 2]) {
        const ox = nx * off;
        const oz = nz * off;
        const ax = a[0] + ox;
        const az = a[1] + oz;
        const bx = b[0] + ox;
        const bz = b[1] + oz;
        const lx = nx * half;
        const lz = nz * half;
        pos.push(ax + lx, y, az + lz, ax - lx, y, az - lz, bx - lx, y, bz - lz);
        pos.push(ax + lx, y, az + lz, bx - lx, y, bz - lz, bx + lx, y, bz + lz);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// Authentic central-Gothenburg palette: landshövdingehus earthy tones (ochre,
// terracotta, sage, dusty blue) mixed with muted "stenstaden" stone facades
// (beige, cream, pale grey). RGB in 0..1.
const FACADES: [number, number, number][] = [
  [0.82, 0.68, 0.44], // ochre / mustard
  [0.74, 0.47, 0.38], // terracotta
  [0.58, 0.63, 0.52], // muted sage green
  [0.57, 0.64, 0.68], // dusty blue
  [0.84, 0.77, 0.64], // warm beige
  [0.73, 0.72, 0.69], // pale stone grey
  [0.87, 0.81, 0.69], // cream
  [0.68, 0.44, 0.38], // brick red
  [0.79, 0.73, 0.58], // sandstone
  [0.5, 0.55, 0.58], // slate blue-grey
];

// Roofs get their own darker palette (slate, charcoal, verdigris copper,
// terracotta tile) so the city reads well from above and from the minimap.
const ROOFS: [number, number, number][] = [
  [0.33, 0.35, 0.39], // slate grey
  [0.25, 0.26, 0.29], // charcoal
  [0.27, 0.3, 0.33], // dark blue-slate
  [0.4, 0.53, 0.49], // verdigris copper
  [0.58, 0.35, 0.28], // terracotta tile
];

// Metres covered by one texture tile (an 8×8 window grid) horizontally and
// vertically — controls apparent window size on the facades.
const TILE_W = 24;
const TILE_H = 26;

export interface BuildingGeometry {
  readonly walls: THREE.BufferGeometry;
  readonly roofs: THREE.BufferGeometry;
}

export function buildBuildingsGeometry(buildings: readonly GeoBuilding[]): BuildingGeometry {
  const wpos: number[] = [];
  const wcol: number[] = [];
  const wuv: number[] = [];
  const rpos: number[] = [];
  const rcol: number[] = [];
  const c = new THREE.Color();

  for (const bld of buildings) {
    let ring = openRing(bld.p);
    if (ring.length < 3) continue;
    // normalise to counter-clockwise for consistent outward faces
    if (signedArea(ring) < 0) ring = ring.slice().reverse();

    const first = ring[0]!;
    const h = bld.h > 0 ? bld.h : 8 + hash(first[0], first[1]) * 14;
    const pal = FACADES[Math.floor(hash(first[1], first[0]) * FACADES.length)]!;
    const [pr, pg, pb] = pal;
    // slight per-building tint variation
    c.setRGB(pr, pg, pb).offsetHSL(0, 0, (hash(first[0], first[1]) - 0.5) * 0.06);
    const rr = c.r;
    const rg = c.g;
    const rb = c.b;

    // roof colour: mostly slate/charcoal, occasionally verdigris or terracotta,
    // biased so darker roofs dominate the skyline.
    const rk = hash(first[0] * 1.7, first[1] * 0.9);
    const roofIdx = rk < 0.4 ? 0 : rk < 0.68 ? 1 : rk < 0.82 ? 2 : rk < 0.92 ? 3 : 4;
    const roof = ROOFS[roofIdx]!;
    c.setRGB(roof[0], roof[1], roof[2]).offsetHSL(0, 0, (hash(first[1], first[0]) - 0.5) * 0.05);
    const fr = c.r;
    const fg = c.g;
    const fb = c.b;

    // roof (no window texture)
    const tris = triangulate(ring);
    for (const t of tris) {
      for (const idx of t) {
        const p = ring[idx]!;
        rpos.push(p[0], h, p[1]);
        rcol.push(fr, fg, fb);
      }
    }

    // walls, tinted a touch lighter than roof so the window map reads well
    const wr = rr * 0.96;
    const wg = rg * 0.96;
    const wb = rb * 0.96;
    const vTop = h / TILE_H;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % ring.length]!;
      const uEnd = Math.hypot(b[0] - a[0], b[1] - a[1]) / TILE_W;
      // outward for CCW ring: two triangles a0,b0,b1 and a0,b1,a1
      // corners: a0=(a,0) b0=(b,0) b1=(b,h) a1=(a,h)
      pushWall(a[0], 0, a[1], 0, 0);
      pushWall(b[0], 0, b[1], uEnd, 0);
      pushWall(b[0], h, b[1], uEnd, vTop);
      pushWall(a[0], 0, a[1], 0, 0);
      pushWall(b[0], h, b[1], uEnd, vTop);
      pushWall(a[0], h, a[1], 0, vTop);
    }

    function pushWall(x: number, y: number, z: number, u: number, v: number): void {
      wpos.push(x, y, z);
      wcol.push(wr, wg, wb);
      wuv.push(u, v);
    }
  }

  const walls = new THREE.BufferGeometry();
  walls.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3));
  walls.setAttribute('color', new THREE.Float32BufferAttribute(wcol, 3));
  walls.setAttribute('uv', new THREE.Float32BufferAttribute(wuv, 2));
  walls.computeVertexNormals();

  const roofs = new THREE.BufferGeometry();
  roofs.setAttribute('position', new THREE.Float32BufferAttribute(rpos, 3));
  roofs.setAttribute('color', new THREE.Float32BufferAttribute(rcol, 3));
  roofs.computeVertexNormals();

  return { walls, roofs };
}
