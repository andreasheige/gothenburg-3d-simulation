import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PORTALS } from '@/domain/portals';

// A single fast-travel pad: a glowing ground ring and a soft rotating light
// beam so destinations are visible from a distance across the city.
function Portal({ x, z, color }: { x: number; z: number; color: string }): React.JSX.Element {
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const seed = useRef(Math.random() * Math.PI * 2);

  useFrame((state) => {
    const t = state.clock.elapsedTime + seed.current;
    if (ring.current) {
      const s = 1 + Math.sin(t * 2) * 0.06;
      ring.current.scale.set(s, s, 1);
    }
    if (beam.current) {
      beam.current.rotation.y = t * 0.6;
      const m = beam.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.18 + 0.08 * (0.5 + 0.5 * Math.sin(t * 2.5));
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* ground ring */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <ringGeometry args={[2.1, 2.7, 40]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.6}
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* inner disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <circleGeometry args={[2.1, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* light beam */}
      <mesh ref={beam} position={[0, 8, 0]}>
        <cylinderGeometry args={[1.6, 2.4, 16, 6, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** All fast-travel portal pads placed around the city. */
export function Portals(): React.JSX.Element {
  return (
    <group>
      {PORTALS.map((p) => (
        <Portal key={p.id} x={p.x} z={p.z} color={p.color} />
      ))}
    </group>
  );
}
