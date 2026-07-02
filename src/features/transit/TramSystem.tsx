import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRAM_LINES, BUS_LINES, STATIONS } from '@/domain/transit';
import { tx, tz } from '@/core/config/world';
import { buildPath, samplePath, nearestOnPath } from '@/core/math/path';
import type { Path } from '@/core/math/path';
import { registry } from '@/core/systems/registry';
import { player } from '@/state/store';
import type { BusLine, TramLine, TramRuntime } from '@/core/types';

interface StopDist {
  name: string;
  d: number;
}

interface VehicleConfig {
  line: TramLine | BusLine;
  path: Path;
  stops: readonly StopDist[];
}

function VehicleMesh({ color, length, tram }: { color: string; length: number; tram: boolean }): React.JSX.Element {
  return (
    <group>
      {/* lower body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[2.3, 1.6, length]} />
        <meshStandardMaterial color={tram ? '#eef2f5' : color} metalness={0.2} roughness={0.5} />
      </mesh>
      {/* upper / roof in line colour */}
      <mesh position={[0, 2.05, 0]} castShadow>
        <boxGeometry args={[2.15, 0.7, length - 0.2]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      {/* window band */}
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[2.34, 0.7, length - 0.6]} />
        <meshStandardMaterial color="#1c2732" metalness={0.5} roughness={0.2} emissive="#2a3b49" emissiveIntensity={0.4} />
      </mesh>
      {/* front/back light */}
      <mesh position={[0, 1.2, length / 2 + 0.05]}>
        <boxGeometry args={[1.8, 0.3, 0.1]} />
        <meshStandardMaterial color="#fff6d0" emissive="#fff2b0" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

interface VehicleProps extends VehicleConfig {
  index: number;
  count: number;
  tram: boolean;
}

function Vehicle({ line, path, stops, index, count, tram }: VehicleProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const speed = tram ? 9 : 7;
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
    if (!tram) return;
    registry.trams.push(runtime);
    return () => {
      const i = registry.trams.indexOf(runtime);
      if (i >= 0) registry.trams.splice(i, 1);
    };
  }, [tram, runtime]);

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
      // stop detection
      for (const s of stops) {
        if (Math.abs(rt.dist - s.d) < 0.9 && Math.abs(s.d - rt.lastStopD) > 3) {
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
    // carry the player if riding this vehicle
    if (tram && player.onTram === rt) {
      player.x = pos.x;
      player.z = pos.z;
    }
  });

  return (
    <group ref={groupRef}>
      <VehicleMesh color={line.color} length={tram ? 6.5 : 5} tram={tram} />
    </group>
  );
}

const TRAMS_PER_LINE = 2;
const BUSES_PER_LINE = 1;

export function TramSystem(): React.JSX.Element {
  const trams = useMemo<VehicleConfig[]>(
    () =>
      TRAM_LINES.map((line) => {
        const path = buildPath(line.waypoints, 0.5);
        const stops: StopDist[] = line.stops.map((sid) => {
          const st = STATIONS[sid];
          return { name: st.name, d: nearestOnPath(path, tx(st.cx), tz(st.cy)) };
        });
        return { line, path, stops };
      }),
    [],
  );

  const buses = useMemo<VehicleConfig[]>(
    () => BUS_LINES.map((line) => ({ line, path: buildPath(line.waypoints, 0.5), stops: [] })),
    [],
  );

  return (
    <group>
      {trams.map(({ line, path, stops }) =>
        Array.from({ length: TRAMS_PER_LINE }, (_, i) => (
          <Vehicle key={`t${line.id}-${i}`} line={line} path={path} stops={stops} index={i} count={TRAMS_PER_LINE} tram />
        )),
      )}
      {buses.map(({ line, path, stops }) =>
        Array.from({ length: BUSES_PER_LINE }, (_, i) => (
          <Vehicle key={`b${line.id}-${i}`} line={line} path={path} stops={stops} index={i} count={BUSES_PER_LINE} tram={false} />
        )),
      )}
    </group>
  );
}
