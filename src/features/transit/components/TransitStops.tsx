import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';
import { geo } from '@/core/systems/geoWorld';
import { buildTransitStops, type TransitStop } from '@/domain/transit/stops';

const VASTTRAFIK = '#0e6f9e';

// A camera-facing Västtrafik-style stop sign: teal panel, white name plate,
// "HÅLLPLATS" caption and a coloured dot per tram line that calls here.
function StopSign({ stop }: { stop: TransitStop }): React.JSX.Element {
  const cols = stop.colors.slice(0, 5);
  const spread = (cols.length - 1) * 0.34;
  return (
    <Billboard position={[stop.x + 2.7, 3.5, stop.z + 0.9]}>
      <mesh>
        <planeGeometry args={[2.5, 1.2]} />
        <meshBasicMaterial color="#083a56" />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.32, 1.04]} />
        <meshBasicMaterial color={VASTTRAFIK} />
      </mesh>
      <mesh position={[0, 0.22, 0.02]}>
        <planeGeometry args={[2.14, 0.5]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <Text
        position={[0, 0.22, 0.03]}
        fontSize={0.3}
        color="#0a3550"
        maxWidth={2.05}
        anchorX="center"
        anchorY="middle"
      >
        {stop.name}
      </Text>
      <Text
        position={[0, -0.36, 0.03]}
        fontSize={0.2}
        color="#e6f4fc"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.14}
      >
        HÅLLPLATS
      </Text>
      {cols.map((c, i) => (
        <mesh key={i} position={[-spread / 2 + i * 0.34, -0.08, 0.03]}>
          <circleGeometry args={[0.12, 18]} />
          <meshBasicMaterial color={c} />
        </mesh>
      ))}
    </Billboard>
  );
}

function applyMatrices(
  mesh: THREE.InstancedMesh | null,
  positions: readonly [number, number, number][],
): void {
  if (!mesh) return;
  const o = new THREE.Object3D();
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i]!;
    o.position.set(p[0], p[1], p[2]);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * Clear tram/bus stops: a raised platform, a small glass shelter and a
 * Västtrafik sign on a pole at every stop, so hållplatser are obvious from a
 * distance. Bulk geometry is instanced; each sign is a camera-facing billboard.
 */
export function TransitStops(): React.JSX.Element {
  const stops = useMemo(() => buildTransitStops(geo()), []);

  const padRef = useRef<THREE.InstancedMesh>(null);
  const roofRef = useRef<THREE.InstancedMesh>(null);
  const postRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    applyMatrices(
      padRef.current,
      stops.map((s) => [s.x, 0.08, s.z]),
    );
    applyMatrices(
      roofRef.current,
      stops.map((s) => [s.x, 2.5, s.z - 0.7]),
    );
    applyMatrices(
      poleRef.current,
      stops.map((s) => [s.x + 2.7, 1.75, s.z + 0.9]),
    );
    // two shelter posts per stop
    const posts: [number, number, number][] = [];
    for (const s of stops) {
      posts.push([s.x - 1.5, 1.25, s.z - 0.7]);
      posts.push([s.x + 1.5, 1.25, s.z - 0.7]);
    }
    applyMatrices(postRef.current, posts);
  }, [stops]);

  const n = stops.length;
  if (n === 0) return <group />;

  return (
    <group>
      <instancedMesh ref={padRef} args={[undefined, undefined, n]} frustumCulled={false} receiveShadow>
        <boxGeometry args={[5, 0.16, 2.2]} />
        <meshStandardMaterial color="#9aa1a9" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, n]} frustumCulled={false} castShadow>
        <boxGeometry args={[3.6, 0.12, 1.8]} />
        <meshStandardMaterial color="#2f363d" roughness={0.5} metalness={0.3} />
      </instancedMesh>
      <instancedMesh ref={postRef} args={[undefined, undefined, n * 2]} frustumCulled={false} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 2.5, 8]} />
        <meshStandardMaterial color="#3a4149" roughness={0.5} metalness={0.5} />
      </instancedMesh>
      <instancedMesh ref={poleRef} args={[undefined, undefined, n]} frustumCulled={false} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 3.5, 8]} />
        <meshStandardMaterial color="#c2c8d0" roughness={0.3} metalness={0.6} />
      </instancedMesh>
      {stops.map((s, i) => (
        <StopSign key={i} stop={s} />
      ))}
    </group>
  );
}
