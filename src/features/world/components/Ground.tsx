import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '@/core/config/world';
import { WORLD_HALF_X, WORLD_HALF_Z } from '@/domain/geo/meta';
import { geo } from '@/core/systems/geoWorld';
import { buildAreaGeometry } from '../geometry';

// Base terrain: a large ground plane plus flattened park + square polygons from OSM.
export function Ground(): React.JSX.Element {
  const parks = useMemo(() => buildAreaGeometry(geo().snapshot.parks, 0.04), []);
  const squares = useMemo(() => buildAreaGeometry(geo().snapshot.squares, 0.06), []);

  const w = WORLD_HALF_X * 2 + 400;
  const d = WORLD_HALF_Z * 2 + 400;

  return (
    <group>
      {/* base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={COLORS.ground} roughness={1} />
      </mesh>

      {/* parks / green space */}
      <mesh geometry={parks} receiveShadow>
        <meshStandardMaterial color={COLORS.park} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* paved squares / plazas */}
      <mesh geometry={squares} receiveShadow>
        <meshStandardMaterial color={COLORS.plaza} roughness={0.92} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
