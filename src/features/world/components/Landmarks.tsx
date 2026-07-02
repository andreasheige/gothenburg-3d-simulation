import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tx, tz } from '@/core/config/world';
import { LANDMARKS } from '@/domain/landmarks';
import { BillboardLabel } from '@/shared/three/BillboardLabel';
import type { LandmarkType } from '@/core/types';

const CABIN_COLORS = ['#4f8fd0', '#e2762f', '#2f8f6d', '#d0407f'];

function FerrisWheel(): React.JSX.Element {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.15;
  });
  const cabins = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);
  return (
    <group position={[0, 9, 0]}>
      {/* support legs */}
      <mesh position={[-3, -4.5, 0]} rotation={[0, 0, 0.28]}>
        <boxGeometry args={[0.6, 12, 0.6]} />
        <meshStandardMaterial color="#c94f4f" />
      </mesh>
      <mesh position={[3, -4.5, 0]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[0.6, 12, 0.6]} />
        <meshStandardMaterial color="#c94f4f" />
      </mesh>
      <group ref={ref}>
        <mesh>
          <torusGeometry args={[8, 0.25, 10, 40]} />
          <meshStandardMaterial color="#e8e8ec" metalness={0.4} roughness={0.4} />
        </mesh>
        {cabins.map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 8, Math.sin(a) * 8, 0]}>
            <boxGeometry args={[1.1, 1.1, 1.1]} />
            <meshStandardMaterial color={CABIN_COLORS[i % 4]!} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Church(): React.JSX.Element {
  return (
    <group>
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[7, 6, 12]} />
        <meshStandardMaterial color="#9c5b3f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 7.2, 0]} castShadow>
        <boxGeometry args={[7.4, 3, 12.4]} />
        <meshStandardMaterial color="#7a4636" />
      </mesh>
      <mesh position={[0, 9.4, 5]}>
        <coneGeometry args={[1.2, 2.4, 4]} />
        <meshStandardMaterial color="#6a3c2e" />
      </mesh>
    </group>
  );
}

function Statue(): React.JSX.Element {
  return (
    <group>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.6, 2, 3, 16]} />
        <meshStandardMaterial color="#7c7466" />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <cylinderGeometry args={[0.5, 0.7, 3, 10]} />
        <meshStandardMaterial color="#3f5f57" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 6.2, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color="#3f5f57" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Fountain(): React.JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[3.2, 3.4, 0.8, 24]} />
        <meshStandardMaterial color="#6b7580" />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[2.8, 2.8, 0.4, 24]} />
        <meshStandardMaterial color="#2a6b8f" metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.25, 0.4, 2, 12]} />
        <meshStandardMaterial color="#8a94a0" />
      </mesh>
    </group>
  );
}

function Fort(): React.JSX.Element {
  return (
    <group>
      <mesh position={[0, 2, 0]}>
        <coneGeometry args={[9, 4, 24]} />
        <meshStandardMaterial color="#4f7a3d" roughness={1} />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <cylinderGeometry args={[3, 3.4, 3.5, 12]} />
        <meshStandardMaterial color="#c9a24f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 7.6, 0]}>
        <coneGeometry args={[3.2, 1.6, 12]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
    </group>
  );
}

function Tower(): React.JSX.Element {
  return (
    <group>
      <mesh position={[0, 17, 0]} castShadow>
        <boxGeometry args={[5, 34, 5]} />
        <meshStandardMaterial color="#8fa2b5" metalness={0.35} roughness={0.35} emissive="#26333f" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 34.4, 0]}>
        <boxGeometry args={[2, 1.2, 2]} />
        <meshStandardMaterial color="#c94f4f" />
      </mesh>
    </group>
  );
}

function Crane(): React.JSX.Element {
  return (
    <group>
      <mesh position={[-4, 9, 0]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[0.8, 18, 0.8]} />
        <meshStandardMaterial color="#c1272d" />
      </mesh>
      <mesh position={[4, 9, 0]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[0.8, 18, 0.8]} />
        <meshStandardMaterial color="#c1272d" />
      </mesh>
      <mesh position={[0, 17.5, 0]}>
        <boxGeometry args={[16, 1.2, 1.2]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      <mesh position={[6, 16, 0]}>
        <boxGeometry args={[1.5, 2, 1.5]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
    </group>
  );
}

function Forest(): React.JSX.Element {
  const trees = useMemo(
    () =>
      Array.from({ length: 26 }, () => ({
        x: (Math.random() - 0.5) * 30,
        z: (Math.random() - 0.5) * 30,
        s: 0.7 + Math.random() * 0.9,
      })),
    [],
  );
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.3, 0.4, 2.4, 6]} />
            <meshStandardMaterial color="#5a3f2a" />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow>
            <coneGeometry args={[1.8, 4, 8]} />
            <meshStandardMaterial color="#2f5a30" />
          </mesh>
          <mesh position={[0, 4.6, 0]}>
            <coneGeometry args={[1.3, 2.8, 8]} />
            <meshStandardMaterial color="#356e38" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Opera(): React.JSX.Element {
  return (
    <group>
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[14, 6, 8]} />
        <meshStandardMaterial color="#dfe6ec" roughness={0.6} />
      </mesh>
      <mesh position={[0, 7.5, -1]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[14, 0.5, 7]} />
        <meshStandardMaterial color="#9aa7b2" metalness={0.4} />
      </mesh>
      <mesh position={[0, 6.5, 3]}>
        <boxGeometry args={[3, 7, 3]} />
        <meshStandardMaterial color="#c94f4f" />
      </mesh>
    </group>
  );
}

function Stadium(): React.JSX.Element {
  return (
    <group>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[12, 12, 6, 32, 1, true]} />
        <meshStandardMaterial color="#cfd6dc" side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      <mesh position={[0, 6.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[12, 0.8, 8, 40]} />
        <meshStandardMaterial color="#8f9aa3" metalness={0.5} />
      </mesh>
    </group>
  );
}

const BUILDERS: Record<LandmarkType, () => React.JSX.Element> = {
  ferris: FerrisWheel,
  church: Church,
  statue: Statue,
  fountain: Fountain,
  fort: Fort,
  tower: Tower,
  crane: Crane,
  forest: Forest,
  opera: Opera,
  stadium: Stadium,
};

export function Landmarks(): React.JSX.Element {
  return (
    <group>
      {LANDMARKS.map((lm) => {
        const B = BUILDERS[lm.type];
        const labelY = lm.type === 'tower' ? 38 : lm.type === 'ferris' ? 20 : 11;
        return (
          <group key={lm.id} position={[tx(lm.cx), 0, tz(lm.cy)]}>
            <B />
            <BillboardLabel position={[0, labelY, 0]} fontSize={1.3} outlineWidth={0.08}>
              {lm.name}
            </BillboardLabel>
          </group>
        );
      })}
    </group>
  );
}
