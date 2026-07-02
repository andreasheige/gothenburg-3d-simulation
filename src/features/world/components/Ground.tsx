import { useMemo } from 'react';
import { TILE, WORLD_W, WORLD_D, COLORS } from '@/core/config/world';
import { DISTRICTS } from '@/domain/districts';

interface Patch {
  id: string;
  x: number;
  z: number;
  w: number;
  h: number;
  color: string;
  park: boolean;
}

// Base terrain: a big grass plane, tinted per-district patches, plus park greens.
export function Ground(): React.JSX.Element {
  const patches = useMemo<Patch[]>(
    () =>
      DISTRICTS.map((d) => {
        const [x0, y0, x1, y1] = d.rect;
        const w = (x1 - x0) * TILE;
        const h = (y1 - y0) * TILE;
        return {
          id: d.id,
          x: x0 * TILE + w / 2,
          z: y0 * TILE + h / 2,
          w,
          h,
          color: d.color,
          park: d.kind === 'park',
        };
      }),
    [],
  );

  return (
    <group>
      {/* base grass */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[WORLD_W / 2, 0, WORLD_D / 2]}
        receiveShadow
      >
        <planeGeometry args={[WORLD_W + 200, WORLD_D + 200]} />
        <meshStandardMaterial color={COLORS.grassDark} roughness={1} />
      </mesh>

      {/* district-tinted ground patches */}
      {patches.map((p) => (
        <mesh key={p.id} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.02, p.z]} receiveShadow>
          <planeGeometry args={[p.w, p.h]} />
          <meshStandardMaterial color={p.color} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
