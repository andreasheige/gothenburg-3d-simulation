import type { Pt } from '@/domain/geo/snapshot';
import type { GeoWorld } from '@/core/systems/geoWorld';
import { buildPathXZ, samplePath } from '@/core/math/path';
import type { Path } from '@/core/math/path';

/** A stop expressed as an arc-length distance along a route path. */
export interface StopDist {
  name: string;
  d: number;
}

/** A deduplicated transit stop in world metres, used for signage + the map. */
export interface TransitStop {
  x: number;
  z: number;
  name: string;
  /** Colours of the tram lines that call here (for the sign band + map dot). */
  colors: string[];
}

// Spacing between successive stops along a line (metres) and the first stop
// offset. Kept in one place so the dwell logic and the visible signs agree.
const FIRST = 300;
const SPACING = 340;
const END_MARGIN = 60;
const DEDUPE_RADIUS = 32;

/**
 * Longest contiguous run of a route polyline that stays inside the world box, so
 * trams (and their stops) travel the central city instead of disappearing
 * toward the suburbs. Shared by the tram fleet and the stop-marker builder.
 */
export function longestInBounds(path: readonly Pt[], hx: number, hz: number): Pt[] {
  const m = 150;
  let best: Pt[] = [];
  let cur: Pt[] = [];
  for (const p of path) {
    if (Math.abs(p[0]) < hx + m && Math.abs(p[1]) < hz + m) {
      cur.push(p);
      if (cur.length > best.length) best = cur;
    } else {
      cur = [];
    }
  }
  return best;
}

/** Stops for a single already-built path, as arc-length distances + names. */
export function buildStopDists(path: Path, nameAt: (x: number, z: number) => string): StopDist[] {
  const stops: StopDist[] = [];
  for (let d = FIRST; d < path.length - END_MARGIN; d += SPACING) {
    const { pos } = samplePath(path, d);
    stops.push({ name: nameAt(pos.x, pos.z), d });
  }
  return stops;
}

/**
 * Every tram stop in the world as a deduplicated set of world-space points.
 * Stops within {@link DEDUPE_RADIUS} of an existing one are merged (routes that
 * share a corridor call at the same platform), accumulating their line colours.
 */
export function buildTransitStops(w: GeoWorld): TransitStop[] {
  const out: TransitStop[] = [];
  for (const route of w.tramRoutes) {
    const clipped = longestInBounds(route.path, w.halfX, w.halfZ);
    if (clipped.length < 2) continue;
    const path = buildPathXZ(clipped, 0.6);
    for (let d = FIRST; d < path.length - END_MARGIN; d += SPACING) {
      const { pos } = samplePath(path, d);
      const hit = out.find((s) => Math.hypot(s.x - pos.x, s.z - pos.z) < DEDUPE_RADIUS);
      if (hit) {
        if (!hit.colors.includes(route.color)) hit.colors.push(route.color);
      } else {
        out.push({ x: pos.x, z: pos.z, name: w.nearestHood(pos.x, pos.z), colors: [route.color] });
      }
    }
  }
  return out;
}
