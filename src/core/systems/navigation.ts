import { geo } from '@/core/systems/geoWorld';
import { LANDMARKS } from '@/domain/landmarks';

// Lightweight orientation helpers: nearest named street and nearest landmark.
// Both scan flat point arrays built once from the OSM snapshot, cheap enough to
// query a few times per second from the systems loop.

interface NamedPt {
  readonly n: string;
  readonly x: number;
  readonly z: number;
}

let streetPts: NamedPt[] | null = null;

function ensureStreets(): NamedPt[] {
  if (streetPts) return streetPts;
  const pts: NamedPt[] = [];
  for (const r of geo().snapshot.roads) {
    if (!r.n) continue;
    for (let i = 0; i < r.p.length; i++) {
      const p = r.p[i]!;
      pts.push({ n: r.n, x: p[0], z: p[1] });
    }
  }
  streetPts = pts;
  return pts;
}

/** Name of the closest tagged street within ~70 m, or '' when none is near. */
export function nearestStreet(x: number, z: number): string {
  const pts = ensureStreets();
  let best = '';
  let bd = Infinity;
  for (const p of pts) {
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < bd) {
      bd = d;
      best = p.n;
    }
  }
  return bd < 70 * 70 ? best : '';
}

export interface NearLandmark {
  readonly name: string;
  readonly dist: number;
}

/** Closest landmark and its straight-line distance in metres. */
export function nearestLandmark(x: number, z: number): NearLandmark | null {
  let best: NearLandmark | null = null;
  let bd = Infinity;
  for (const l of LANDMARKS) {
    const d = (l.x - x) ** 2 + (l.z - z) ** 2;
    if (d < bd) {
      bd = d;
      best = { name: l.name, dist: Math.sqrt(d) };
    }
  }
  return best;
}
