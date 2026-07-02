import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDINGS } from '@/core/systems/worldgen';
import { useGame } from '@/state/store';

const tmp = new THREE.Object3D();
const col = new THREE.Color();

// All buildings as a single instanced mesh (bodies) + a second for darker roofs.
export function Buildings(): React.JSX.Element {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const roofRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const roof = roofRef.current;
    if (!body || !roof) return;
    BUILDINGS.forEach((b, i) => {
      tmp.position.set(b.x, b.h / 2, b.z);
      tmp.scale.set(b.w, b.h, b.d);
      tmp.rotation.set(0, 0, 0);
      tmp.updateMatrix();
      body.setMatrixAt(i, tmp.matrix);
      body.setColorAt(i, col.set(b.color));

      // roof slab
      tmp.position.set(b.x, b.h + 0.15, b.z);
      tmp.scale.set(b.w * 1.04, 0.4, b.d * 1.04);
      tmp.updateMatrix();
      roof.setMatrixAt(i, tmp.matrix);
      roof.setColorAt(i, col.set(b.color).multiplyScalar(0.6));
    });
    body.instanceMatrix.needsUpdate = true;
    roof.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    if (roof.instanceColor) roof.instanceColor.needsUpdate = true;
  }, []);

  // Warm window glow ramps up after dusk.
  useFrame(() => {
    const dayT = useGame.getState().dayT;
    const h = dayT * 24;
    const night = h >= 18 || h < 6 ? 1 : 0;
    const target = night ? 0.35 : 0.02;
    if (matRef.current) {
      matRef.current.emissiveIntensity += (target - matRef.current.emissiveIntensity) * 0.05;
    }
  });

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, BUILDINGS.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          ref={matRef}
          roughness={0.82}
          metalness={0.04}
          emissive="#ffcf7a"
          emissiveIntensity={0.02}
          flatShading
        />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, BUILDINGS.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.9} metalness={0.02} />
      </instancedMesh>
    </group>
  );
}
