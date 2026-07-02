import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { geo } from '@/core/systems/geoWorld';
import { useGame } from '@/state/store';
import { buildBuildingsGeometry } from '../geometry';
import { buildFacadeTextures } from '../facadeTexture';

// Smooth 0 (day) -> 1 (deep night) factor so window lights fade in around dusk.
function nightFactor(h: number): number {
  if (h >= 20 || h < 5) return 1;
  if (h >= 18) return (h - 18) / 2;
  if (h < 7) return (7 - h) / 2;
  return 0;
}

// All OSM building footprints extruded and merged into two meshes: walls carry
// a tiling procedural window texture (with an emissive mask so only some panes
// glow after dusk), roofs are plain vertex-coloured caps.
export function Buildings(): React.JSX.Element {
  const { walls, roofs } = useMemo(() => buildBuildingsGeometry(geo().snapshot.buildings), []);
  const tex = useMemo(() => buildFacadeTextures(), []);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const h = useGame.getState().dayT * 24;
    const target = nightFactor(h);
    if (matRef.current) {
      matRef.current.emissiveIntensity += (target - matRef.current.emissiveIntensity) * 0.05;
    }
  });

  return (
    <group>
      <mesh geometry={walls} castShadow receiveShadow>
        <meshStandardMaterial
          ref={matRef}
          vertexColors
          map={tex.map}
          emissive="#ffcf7a"
          emissiveMap={tex.emissive}
          emissiveIntensity={0}
          roughness={0.82}
          metalness={0.05}
        />
      </mesh>
      <mesh geometry={roofs} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.9} metalness={0.04} flatShading />
      </mesh>
    </group>
  );
}
