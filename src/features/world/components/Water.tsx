import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { TILE, RIVER_ROW0, RIVER_ROW1, WORLD_W } from '@/core/config/world';

// Göta Älv — a reflective water strip across the map with gentle animated ripples.
export function Water(): React.JSX.Element {
  const z0 = RIVER_ROW0 * TILE;
  const z1 = RIVER_ROW1 * TILE;
  const depth = z1 - z0;
  const width = WORLD_W;

  // subtle vertical bob to fake swell
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = 0.08 + Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[width / 2, 0.1, z0 + depth / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 60, depth, 1, 1]} />
        <MeshReflectorMaterial
          resolution={512}
          mixBlur={1}
          mixStrength={6}
          blur={[300, 80]}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.2}
          color="#1d4f6e"
          metalness={0.55}
        />
      </mesh>
      {/* darker riverbed underneath so edges read as water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[width + 60, depth]} />
        <meshStandardMaterial color="#123a52" roughness={1} />
      </mesh>
    </group>
  );
}
