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

// --- extruded buildings --------------------------------------------------

const FACADES: [number, number, number][] = [
  [0.72, 0.66, 0.55],
  [0.66, 0.6, 0.5],
  [0.6, 0.56, 0.5],
  [0.76, 0.7, 0.6],
  [0.56, 0.52, 0.48],
  [0.68, 0.62, 0.54],
];

export function buildBuildingsGeometry(buildings: readonly GeoBuilding[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();

  function push(x: number, y: number, z: number, r: number, g: number, b: number): void {
    pos.push(x, y, z);
    col.push(r, g, b);
  }

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

    // roof
    const tris = triangulate(ring);
    for (const t of tris) {
      for (const idx of t) {
        const p = ring[idx]!;
        push(p[0], h, p[1], rr * 1.08, rg * 1.08, rb * 1.08);
      }
    }
    // walls (slightly darker)
    const wr = rr * 0.82;
    const wg = rg * 0.82;
    const wb = rb * 0.82;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % ring.length]!;
      // outward for CCW ring: two triangles a0,b0,b1 and a0,b1,a1
      push(a[0], 0, a[1], wr, wg, wb);
      push(b[0], 0, b[1], wr, wg, wb);
      push(b[0], h, b[1], wr, wg, wb);
      push(a[0], 0, a[1], wr, wg, wb);
      push(b[0], h, b[1], wr, wg, wb);
      push(a[0], h, a[1], wr, wg, wb);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
