import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { geo } from '@/core/systems/geoWorld';
import { buildPathXZ, samplePath } from '@/core/math/path';
import type { Path } from '@/core/math/path';
import { registry } from '@/core/systems/registry';
import { player, useGame } from '@/state/store';
import { realDayT } from '@/core/systems/time';
import { tramCountFor, isWeekendNow } from '@/domain/transit/schedule';
import { longestInBounds, buildStopDists } from '@/domain/transit/stops';
import type { StopDist } from '@/domain/transit/stops';
import { Character } from '@/shared/three/Character';
import type { TramRuntime } from '@/core/types';

interface LineRef {
  id: string;
  name: string;
  color: string;
}

interface TramConfig {
  line: LineRef;
  path: Path;
  stops: readonly StopDist[];
  count: number;
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

// Open cutaway cabin shown only while the player rides this tram: floor, low
// coloured side walls (roof removed so the orbit camera can peek in), two
// longitudinal benches, grab poles + ceiling rail and the seated player avatar.
function TramInterior({ color, length }: { color: string; length: number }): React.JSX.Element {
  const half = length / 2;
  const poleZs = [-half + 4.5, -half + 1.5, 0, half - 1.5, half - 4.5];
  return (
    <group>
      {/* floor */}
      <mesh position={[0, 0.85, 0]} receiveShadow>
        <boxGeometry args={[2.34, 0.1, length - 0.4]} />
        <meshStandardMaterial color="#39434d" roughness={0.85} />
      </mesh>
      {/* low side walls (cutaway: open roof) */}
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, 1.15, 0]}>
          <boxGeometry args={[0.08, 0.6, length - 0.4]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
      {/* end walls (low) */}
      {[-half + 0.1, half - 0.1].map((z) => (
        <mesh key={z} position={[0, 1.15, z]}>
          <boxGeometry args={[2.34, 0.6, 0.08]} />
          <meshStandardMaterial color="#dfe4e8" roughness={0.6} />
        </mesh>
      ))}
      {/* longitudinal benches along both sides */}
      {[-0.82, 0.82].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.16, 0]} castShadow>
            <boxGeometry args={[0.66, 0.12, length - 1.4]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
          <mesh position={[x, 1.0, 0]}>
            <boxGeometry args={[0.6, 0.3, length - 1.4]} />
            <meshStandardMaterial color="#5a636c" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* vertical grab poles */}
      {poleZs.map((z) => (
        <mesh key={z} position={[0, 1.65, z]}>
          <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
          <meshStandardMaterial color="#e6c33a" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* horizontal ceiling grab rail */}
      <mesh position={[0, 2.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, length - 1.5, 8]} />
        <meshStandardMaterial color="#e6c33a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* a few seated passengers for life */}
      <group position={[0.5, 1.05, -half + 6]} rotation={[0, -Math.PI / 2, 0]}>
        <Character colors={{ coat: '#3a6ea5', hat: '#b23b3b', skin: '#d9a877' }} />
      </group>
      <group position={[0.5, 1.05, half - 5]} rotation={[0, -Math.PI / 2, 0]}>
        <Character colors={{ coat: '#4c8c5a', hat: '#2b3550', skin: '#e6b98f' }} />
      </group>
      {/* the player, seated on the left bench near the rear (toward the camera) */}
      <group position={[-0.5, 1.05, -half + 3]} rotation={[0, Math.PI / 2, 0]}>
        <Character colors={{ coat: '#d8863a', hat: '#1f6f52' }} />
      </group>
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
  const ridingId = useGame((s) => s.riding);
  const runtime = useRef<TramRuntime>({
    line,
    dir: (index % 2 === 0 ? 1 : -1) as 1 | -1,
    dwell: 0,
    dist: (index / count) * path.length,
    lastStopD: -999,
    stationName: '',
    doorsOpen: false,
    pos: { x: 0, z: 0 },
    angle: 0,
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
    rt.angle = Math.atan2(tangent.x, tangent.z);
    if (groupRef.current) {
      groupRef.current.position.set(pos.x, 0, pos.z);
      groupRef.current.rotation.y = rt.angle;
    }
    if (player.onTram === rt) {
      player.x = pos.x;
      player.z = pos.z;
    }
  });

  const mine = ridingId !== null && player.onTram === runtime;

  return (
    <group ref={groupRef}>
      {mine ? (
        <TramInterior color={line.color} length={20} />
      ) : (
        <TramMesh color={line.color} length={20} />
      )}
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

export function TramSystem(): React.JSX.Element {
  const trams = useMemo<TramConfig[]>(() => {
    const w = geo();
    const dt = realDayT();
    const hour = dt * 24;
    const weekend = isWeekendNow();
    const out: TramConfig[] = [];
    for (const route of w.tramRoutes) {
      const clipped = longestInBounds(route.path, w.halfX, w.halfZ);
      if (clipped.length < 2) continue;
      const path = buildPathXZ(clipped, 0.6);
      const stops = buildStopDists(path, (x, z) => w.nearestHood(x, z));
      // Fleet size follows the synthetic timetable for the current hour.
      const count = tramCountFor(route.ref, hour, weekend);
      out.push({ line: { id: route.ref, name: route.name, color: route.color }, path, stops, count });
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
      {trams.map(({ line, path, stops, count }) =>
        Array.from({ length: count }, (_, i) => (
          <Tram key={`t${line.id}-${i}`} line={line} path={path} stops={stops} index={i} count={count} />
        )),
      )}
      {ferries.map((path, i) => (
        <Ferry key={`f${i}`} path={path} index={i} />
      ))}
    </group>
  );
}
