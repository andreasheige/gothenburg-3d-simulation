import * as THREE from 'three';

/** A sampled world-space polyline with cumulative arc-lengths for constant-speed traversal. */
export interface Path {
  readonly points: readonly THREE.Vector3[];
  readonly length: number;
  readonly cumulative: readonly number[];
}

/** A position + unit tangent sampled from a {@link Path}. */
export interface PathSample {
  readonly pos: THREE.Vector3;
  readonly tangent: THREE.Vector3;
}

/**
 * Build a world-space polyline from metric `[x, z]` waypoints, resampling long
 * segments so traversal stays smooth. Coordinates are already in world metres.
 */
export function buildPathXZ(waypoints: readonly (readonly [number, number])[], y = 0.3, step = 12): Path {
  const raw = waypoints.map(([x, z]) => new THREE.Vector3(x, y, z));
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < raw.length - 1; i++) {
    const a = raw[i]!;
    const b = raw[i + 1]!;
    const steps = Math.max(1, Math.round(a.distanceTo(b) / step));
    for (let s = 0; s < steps; s++) pts.push(a.clone().lerp(b, s / steps));
  }
  const last = raw[raw.length - 1];
  if (last) pts.push(last.clone());

  let length = 0;
  const cumulative: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    length += pts[i]!.distanceTo(pts[i - 1]!);
    cumulative.push(length);
  }
  return { points: pts, length, cumulative };
}

/** Sample a path at arc-length distance `d` (clamped). */
export function samplePath(path: Path, d: number): PathSample {
  const { points, cumulative, length } = path;
  const dist = THREE.MathUtils.clamp(d, 0, length);
  // binary search the segment
  let lo = 0;
  let hi = cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid]! < dist) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const segLen = (cumulative[i]! - cumulative[i - 1]!) || 1;
  const t = (dist - cumulative[i - 1]!) / segLen;
  const a = points[i - 1]!;
  const b = points[i]!;
  const pos = a.clone().lerp(b, t);
  const tangent = b.clone().sub(a).normalize();
  return { pos, tangent };
}

/** Nearest arc-length position of a world point onto a path (coarse, sample-based). */
export function nearestOnPath(path: Path, x: number, z: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < path.points.length; i++) {
    const p = path.points[i]!;
    const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return path.cumulative[best]!;
}
