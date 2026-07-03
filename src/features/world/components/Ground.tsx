import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from '@/core/config/world';
import { WORLD_HALF_X, WORLD_HALF_Z } from '@/domain/geo/meta';
import { geo } from '@/core/systems/geoWorld';
import { buildAreaGeometry } from '../geometry';
import { buildPavingTexture, buildGrassTexture, buildCobbleTexture } from '../groundTexture';

// Base terrain: a textured ground plane plus flattened, textured park + square
// polygons from OSM so the streetscape reads as paving, grass and cobblestone
// instead of a flat grey field.
export function Ground(): React.JSX.Element {
  const parks = useMemo(() => buildAreaGeometry(geo().snapshot.parks, 0.04, 1 / 14), []);
  const squares = useMemo(() => buildAreaGeometry(geo().snapshot.squares, 0.06, 1 / 7), []);

  const w = WORLD_HALF_X * 2 + 400;
  const d = WORLD_HALF_Z * 2 + 400;

  const paving = useMemo(() => {
    const t = buildPavingTexture();
    t.repeat.set(w / 42, d / 42);
    return t;
  }, [w, d]);
  const grass = useMemo(() => buildGrassTexture(), []);
  const cobble = useMemo(() => buildCobbleTexture(), []);

  return (
    <group>
      {/* base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={paving} color={COLORS.ground} roughness={1} />
      </mesh>

      {/* parks / green space */}
      <mesh geometry={parks} receiveShadow>
        <meshStandardMaterial
          map={grass}
          color={COLORS.park}
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* paved squares / plazas */}
      <mesh geometry={squares} receiveShadow>
        <meshStandardMaterial
          map={cobble}
          color={COLORS.plaza}
          roughness={0.92}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
