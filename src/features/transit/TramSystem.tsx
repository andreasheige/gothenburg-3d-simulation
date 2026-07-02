import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Pt } from '@/domain/geo/snapshot';
import { geo } from '@/core/systems/geoWorld';
import { buildPathXZ, samplePath } from '@/core/math/path';
import type { Path } from '@/core/math/path';
import { registry } from '@/core/systems/registry';
import { player } from '@/state/store';
import type { TramRuntime } from '@/core/types';

interface StopDist {
  name: string;
  d: number;
}

interface LineRef {
  id: string;
  name: string;
  color: string;
}

interface TramConfig {
  line: LineRef;
  path: Path;
  stops: readonly StopDist[];
}

// Longest contiguous run of a route polyline that stays inside the world box, so
// trams travel the central city instead of disappearing toward the suburbs.
function longestInBounds(path: readonly Pt[], hx: number, hz: number): Pt[] {
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

function TramMesh({ color, length }: { color: string; length: number }): React.JSX.Element {
  return (
    <group>
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.4, 1.7, length]} />
        <meshStandardMaterial color="#eef2f5" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow>
        <boxGeometry args={[2.24, 0.7, length - 0.2]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[2.44, 0.8, length - 0.6]} />
        <meshStandardMaterial color="#1c2732" metalness={0.5} roughness={0.2} emissive="#2a3b49" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 1.7, length / 2 + 0.05]}>
        <boxGeometry args={[1.9, 0.3, 0.1]} />
        <meshStandardMaterial color="#fff6d0" emissive="#fff2b0" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

interface TramProps extends TramConfig {
  index: number;
  count: number;
}

function Tram({ line, path, stops, index, count }: TramProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const speed = 12;
  const runtime = useRef<TramRuntime>({
    line,
    dir: (index % 2 === 0 ? 1 : -1) as 1 | -1,
    dwell: 0,
    dist: (index / count) * path.length,
    lastStopD: -999,
    stationName: '',
    doorsOpen: false,
    pos: { x: 0, z: 0 },
  }).current;

  useEffect(() => {
    registry.trams.push(runtime);
    return () => {
      const i = registry.trams.indexOf(runtime);
      if (i >= 0) registry.trams.splice(i, 1);
    };
  }, [runtime]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const rt = runtime;
    if (rt.dwell > 0) {
      rt.dwell -= dt;
      rt.doorsOpen = true;
    } else {
      rt.doorsOpen = false;
      rt.dist += rt.dir * speed * dt;
      if (rt.dist >= path.length) {
        rt.dist = path.length;
        rt.dir = -1;
      }
      if (rt.dist <= 0) {
        rt.dist = 0;
        rt.dir = 1;
      }
      for (const s of stops) {
        if (Math.abs(rt.dist - s.d) < 2 && Math.abs(s.d - rt.lastStopD) > 6) {
          rt.dwell = 2.4;
          rt.lastStopD = s.d;
          rt.stationName = s.name;
          break;
        }
      }
    }
    const { pos, tangent } = samplePath(path, rt.dist);
    rt.pos.x = pos.x;
    rt.pos.z = pos.z;
    if (groupRef.current) {
      groupRef.current.position.set(pos.x, 0, pos.z);
      groupRef.current.rotation.y = Math.atan2(tangent.x, tangent.z);
    }
    if (player.onTram === rt) {
      player.x = pos.x;
      player.z = pos.z;
    }
  });

  return (
    <group ref={groupRef}>
      <TramMesh color={line.color} length={20} />
    </group>
  );
}

function Ferry({ path, index }: { path: Path; index: number }): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const dir = useRef<1 | -1>(index % 2 === 0 ? 1 : -1);
  const dist = useRef((index / 3) * path.length);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    dist.current += dir.current * 6 * dt;
    if (dist.current >= path.length) dir.current = -1;
    if (dist.current <= 0) dir.current = 1;
    const { pos, tangent } = samplePath(path, THREE.MathUtils.clamp(dist.current, 0, path.length));
    if (groupRef.current) {
      groupRef.current.position.set(pos.x, 0.4, pos.z);
      groupRef.current.rotation.y = Math.atan2(tangent.x, tangent.z);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[6, 1.2, 18]} />
        <meshStandardMaterial color="#f2f4f6" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.8, -2]} castShadow>
        <boxGeometry args={[5, 1.6, 8]} />
        <meshStandardMaterial color="#2f5a7a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.9, 9.4]}>
        <boxGeometry args={[5.6, 1.4, 1]} />
        <meshStandardMaterial color="#c94f4f" />
      </mesh>
    </group>
  );
}

const TRAMS_PER_LINE = 2;

export function TramSystem(): React.JSX.Element {
  const trams = useMemo<TramConfig[]>(() => {
    const w = geo();
    const out: TramConfig[] = [];
    for (const route of w.tramRoutes) {
      const clipped = longestInBounds(route.path, w.halfX, w.halfZ);
      if (clipped.length < 2) continue;
      const path = buildPathXZ(clipped, 0.6);
      const stops: StopDist[] = [];
      for (let d = 300; d < path.length - 60; d += 340) {
        const { pos } = samplePath(path, d);
        stops.push({ name: w.nearestHood(pos.x, pos.z), d });
      }
      out.push({ line: { id: route.ref, name: route.name, color: route.color }, path, stops });
    }
    return out;
  }, []);

  const ferries = useMemo<Path[]>(() => {
    const w = geo();
    return w.ferryRoutes
      .map((r) => longestInBounds(r, w.halfX, w.halfZ))
      .filter((r) => r.length >= 2)
      .map((r) => buildPathXZ(r, 0.4, 20));
  }, []);

  return (
    <group>
      {trams.map(({ line, path, stops }) =>
        Array.from({ length: TRAMS_PER_LINE }, (_, i) => (
          <Tram key={`t${line.id}-${i}`} line={line} path={path} stops={stops} index={i} count={TRAMS_PER_LINE} />
        )),
      )}
      {ferries.map((path, i) => (
        <Ferry key={`f${i}`} path={path} index={i} />
      ))}
    </group>
  );
}
