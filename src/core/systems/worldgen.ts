import { COLS, ROWS, TILE, RIVER_ROW0, RIVER_ROW1 } from '@/core/config/world';
import { DISTRICTS } from '@/domain/districts';
import { TRAM_LINES, BUS_LINES } from '@/domain/transit';
import { ROADS } from '@/domain/streets';
import type { Building, District, DistrictKind, TilePoint } from '@/core/types';

// Deterministic RNG so the Buildings renderer and collision agree on the same layout.
function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bridge corridor over the river (Hisingsbron): tiles the player/traffic can cross.
const BRIDGE_X0 = 29;
const BRIDGE_X1 = 34;

// --- reserve tiles occupied by roads / tracks so buildings never block them ---
function key(cx: number, cy: number): number {
  return cy * COLS + cx;
}

function rasterizeInto(set: Set<number>, waypoints: readonly TilePoint[]): void {
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [ax, ay] = waypoints[i]!;
    const [bx, by] = waypoints[i + 1]!;
    const steps = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay)));
    for (let s = 0; s <= steps; s++) {
      const cx = Math.round(ax + (bx - ax) * (s / steps));
      const cy = Math.round(ay + (by - ay) * (s / steps));
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) set.add(key(cx + dx, cy + dy));
      }
    }
  }
}

const reserved = new Set<number>();
for (const l of TRAM_LINES) rasterizeInto(reserved, l.waypoints);
for (const l of BUS_LINES) rasterizeInto(reserved, l.waypoints);
for (const r of ROADS) rasterizeInto(reserved, r.pts);

function districtAt(cx: number, cy: number): District | null {
  for (const d of DISTRICTS) {
    const [x0, y0, x1, y1] = d.rect;
    if (cx >= x0 && cx < x1 && cy >= y0 && cy < y1) return d;
  }
  return null;
}

interface Profile {
  readonly prob: number;
  readonly hMin: number;
  readonly hMax: number;
  readonly palette: readonly string[];
}

// Height + density profile per district kind.
const PROFILE: Record<DistrictKind, Profile> = {
  urban: { prob: 0.72, hMin: 6, hMax: 20, palette: ['#b7a98f', '#a89a80', '#9d8f76', '#c2b291', '#8f8368'] },
  industrial: { prob: 0.5, hMin: 5, hMax: 12, palette: ['#8a94a0', '#7c8894', '#95a0ab'] },
  suburb: { prob: 0.45, hMin: 5, hMax: 11, palette: ['#c9b79a', '#b6a97f', '#a99a7f'] },
  park: { prob: 0.05, hMin: 4, hMax: 8, palette: ['#9db089'] },
};

export function generateBuildings(): Building[] {
  const rng = mulberry32(1337);
  const out: Building[] = [];
  for (let cy = 0; cy < ROWS; cy++) {
    if (cy >= RIVER_ROW0 && cy < RIVER_ROW1) continue; // river
    for (let cx = 0; cx < COLS; cx++) {
      const d = districtAt(cx, cy);
      if (!d) continue;
      if (reserved.has(key(cx, cy))) continue;
      const prof = PROFILE[d.kind];
      if (rng() > prof.prob) continue;
      // shrink footprint a bit + jitter so blocks look organic
      const pad = 0.14 + rng() * 0.14;
      const w = (1 - pad) * TILE;
      const dd = (1 - pad) * TILE;
      const h = prof.hMin + rng() * (prof.hMax - prof.hMin);
      const color = prof.palette[(rng() * prof.palette.length) | 0] ?? prof.palette[0]!;
      const jx = (rng() - 0.5) * TILE * 0.15;
      const jz = (rng() - 0.5) * TILE * 0.15;
      out.push({
        x: cx * TILE + TILE / 2 + jx,
        z: cy * TILE + TILE / 2 + jz,
        w,
        d: dd,
        h,
        color,
        roof: rng() < 0.5,
        cx,
        cy,
      });
    }
  }
  return out;
}

export const BUILDINGS: readonly Building[] = generateBuildings();

// Spatial hash of building AABBs by tile for fast collision.
const grid = new Map<number, Building[]>();
for (const b of BUILDINGS) {
  const k = key(b.cx, b.cy);
  let arr = grid.get(k);
  if (!arr) {
    arr = [];
    grid.set(k, arr);
  }
  arr.push(b);
}

export function isWater(x: number, z: number): boolean {
  const cy = Math.floor(z / TILE);
  const cx = Math.floor(x / TILE);
  if (cy < RIVER_ROW0 || cy >= RIVER_ROW1) return false;
  // bridge corridor is walkable
  if (cx >= BRIDGE_X0 && cx < BRIDGE_X1) return false;
  return true;
}

export function outOfBounds(x: number, z: number, r = 0.6): boolean {
  return x < r || z < r || x > COLS * TILE - r || z > ROWS * TILE - r;
}

/** True if a disc of radius `r` at (x,z) collides with a building. */
export function hitsBuilding(x: number, z: number, r = 0.7): boolean {
  const cx = Math.floor(x / TILE);
  const cy = Math.floor(z / TILE);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const arr = grid.get(key(cx + dx, cy + dy));
      if (!arr) continue;
      for (const b of arr) {
        const hw = b.w / 2 + r;
        const hd = b.d / 2 + r;
        if (Math.abs(x - b.x) < hw && Math.abs(z - b.z) < hd) return true;
      }
    }
  }
  return false;
}

export function blocked(x: number, z: number, r = 0.7): boolean {
  return outOfBounds(x, z, r) || isWater(x, z) || hitsBuilding(x, z, r);
}
