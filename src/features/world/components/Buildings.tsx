import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { geo } from '@/core/systems/geoWorld';
import { useGame } from '@/state/store';
import { buildBuildingsGeometry } from '../geometry';

// All ~11k OSM building footprints extruded and merged into a single mesh with
// baked vertex colours. Windows glow warmer after dusk via emissive intensity.
export function Buildings(): React.JSX.Element {
  const geometry = useMemo(() => buildBuildingsGeometry(geo().snapshot.buildings), []);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const h = useGame.getState().dayT * 24;
    const night = h >= 18 || h < 6 ? 1 : 0;
    const target = night ? 0.22 : 0.02;
    if (matRef.current) {
      matRef.current.emissiveIntensity += (target - matRef.current.emissiveIntensity) * 0.05;
    }
  });

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        ref={matRef}
        vertexColors
        roughness={0.86}
        metalness={0.04}
        emissive="#ffcf7a"
        emissiveIntensity={0.02}
        flatShading
      />
    </mesh>
  );
}
