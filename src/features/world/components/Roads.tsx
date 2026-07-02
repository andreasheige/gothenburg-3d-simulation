import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { TILE, tx, tz, COLORS, RIVER_ROW0, RIVER_ROW1 } from '@/core/config/world';
import { ROADS } from '@/domain/streets';
import { TRAM_LINES, STATIONS } from '@/domain/transit';
import { BillboardLabel } from '@/shared/three/BillboardLabel';
import type { TilePoint } from '@/core/types';

interface RoadSeg {
  x: number;
  z: number;
  len: number;
  ang: number;
  width: number;
}

interface Rail {
  id: string;
  color: string;
  points: [number, number, number][];
}

function segmentsFrom(pts: readonly TilePoint[], width: number): RoadSeg[] {
  const segs: RoadSeg[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i]!;
    const p1 = pts[i + 1]!;
    const a = new THREE.Vector2(tx(p0[0]), tz(p0[1]));
    const b = new THREE.Vector2(tx(p1[0]), tz(p1[1]));
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const len = a.distanceTo(b) + width; // overlap a touch at corners
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    segs.push({ x: mid.x, z: mid.y, len, ang, width });
  }
  return segs;
}

export function Roads(): React.JSX.Element {
  const roadSegs = useMemo<RoadSeg[]>(() => {
    const all: RoadSeg[] = [];
    for (const r of ROADS) all.push(...segmentsFrom(r.pts, r.w * 1.7));
    return all;
  }, []);

  const rails = useMemo<Rail[]>(
    () =>
      TRAM_LINES.map((l) => ({
        id: l.id,
        color: l.color,
        points: l.waypoints.map(([cx, cy]): [number, number, number] => [tx(cx), 0.36, tz(cy)]),
      })),
    [],
  );

  const stations = useMemo(() => Object.values(STATIONS), []);
  const bridgeZ = ((RIVER_ROW0 + RIVER_ROW1) / 2) * TILE;
  const bridgeLen = (RIVER_ROW1 - RIVER_ROW0) * TILE + 3;

  return (
    <group>
      {/* asphalt ribbons */}
      {roadSegs.map((s, i) => (
        <mesh key={i} position={[s.x, 0.07, s.z]} rotation={[0, -s.ang, 0]} receiveShadow>
          <boxGeometry args={[s.len, 0.08, s.width]} />
          <meshStandardMaterial color={COLORS.road} roughness={0.95} />
        </mesh>
      ))}

      {/* bridge deck over Göta Älv */}
      <mesh position={[tx(31), 0.5, bridgeZ]} receiveShadow castShadow>
        <boxGeometry args={[6.5, 0.5, bridgeLen]} />
        <meshStandardMaterial color={COLORS.bridge} roughness={0.9} />
      </mesh>
      {[-3.2, 3.2].map((o, i) => (
        <mesh key={i} position={[tx(31) + o, 1.2, bridgeZ]}>
          <boxGeometry args={[0.3, 1.4, bridgeLen]} />
          <meshStandardMaterial color="#6a6055" />
        </mesh>
      ))}

      {/* tram rails, coloured per line */}
      {rails.map((r) => (
        <Line key={r.id} points={r.points} color={r.color} lineWidth={2.4} transparent opacity={0.9} />
      ))}

      {/* stations: platform + floating name */}
      {stations.map((st, i) => (
        <group key={i} position={[tx(st.cx), 0, tz(st.cy)]}>
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.4, 0.4, 1.6]} />
            <meshStandardMaterial color="#c7b48a" roughness={0.9} />
          </mesh>
          <mesh position={[1.5, 1.4, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 2.4, 8]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <BillboardLabel position={[0, 3.0, 0]} fontSize={0.85} color="#0d151d" outlineWidth={0.06} outlineColor="#ffd479">
            {st.name}
          </BillboardLabel>
        </group>
      ))}
    </group>
  );
}
