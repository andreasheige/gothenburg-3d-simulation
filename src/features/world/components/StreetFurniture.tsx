import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { geo } from '@/core/systems/geoWorld';
import { useGame } from '@/state/store';
import { buildFurniture, type Placement } from '../furniture';

// Smooth 0 (day) -> 1 (night) so lamp glow fades in around dusk.
function nightFactor(h: number): number {
  if (h >= 20 || h < 5) return 1;
  if (h >= 18) return (h - 18) / 2;
  if (h < 7) return (7 - h) / 2;
  return 0;
}

function fhash(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// Write instance matrices from placements, offsetting/scaling per part.
function applyMatrices(
  mesh: THREE.InstancedMesh | null,
  items: readonly Placement[],
  build: (p: Placement, o: THREE.Object3D) => void,
): void {
  if (!mesh) return;
  const o = new THREE.Object3D();
  for (let i = 0; i < items.length; i++) {
    build(items[i]!, o);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

/** Procedural street furniture: trees, streetlights, benches and waste bins. */
export function StreetFurniture(): React.JSX.Element {
  const f = useMemo(() => {
    const w = geo();
    return buildFurniture(w.snapshot, w.blocked);
  }, []);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const lampRef = useRef<THREE.InstancedMesh>(null);
  const lampMat = useRef<THREE.MeshStandardMaterial>(null);
  const seatRef = useRef<THREE.InstancedMesh>(null);
  const backRef = useRef<THREE.InstancedMesh>(null);
  const binRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    // trees: trunk + foliage (with per-instance green variation)
    applyMatrices(trunkRef.current, f.trees, (p, o) => {
      o.position.set(p.x, 1.5 * p.s, p.z);
      o.rotation.set(0, p.r, 0);
      o.scale.set(p.s, p.s, p.s);
    });
    applyMatrices(foliageRef.current, f.trees, (p, o) => {
      o.position.set(p.x, (3 + 1.6) * p.s, p.z);
      o.rotation.set(0, p.r, 0);
      o.scale.set(p.s * 1.1, p.s * 0.95, p.s * 1.1);
    });
    const fol = foliageRef.current;
    if (fol) {
      const col = new THREE.Color();
      for (let i = 0; i < f.trees.length; i++) {
        const p = f.trees[i]!;
        const t = fhash(p.x, p.z);
        col.setHSL(0.26 + t * 0.05, 0.42, 0.26 + fhash(p.z, p.x) * 0.12);
        fol.setColorAt(i, col);
      }
      if (fol.instanceColor) fol.instanceColor.needsUpdate = true;
    }

    // streetlights: pole + lamp head
    applyMatrices(poleRef.current, f.streetlights, (p, o) => {
      o.position.set(p.x, 2.6, p.z);
      o.rotation.set(0, p.r, 0);
      o.scale.set(1, 1, 1);
    });
    applyMatrices(lampRef.current, f.streetlights, (p, o) => {
      o.position.set(p.x, 5.2, p.z);
      o.rotation.set(0, p.r, 0);
      o.scale.set(1, 1, 1);
    });

    // benches: seat + backrest
    applyMatrices(seatRef.current, f.benches, (p, o) => {
      o.position.set(p.x, 0.46, p.z);
      o.rotation.set(0, p.r, 0);
      o.scale.set(1, 1, 1);
    });
    applyMatrices(backRef.current, f.benches, (p, o) => {
      const bx = p.x - Math.cos(p.r) * 0.22;
      const bz = p.z + Math.sin(p.r) * 0.22;
      o.position.set(bx, 0.78, bz);
      o.rotation.set(0, p.r, 0);
      o.scale.set(1, 1, 1);
    });

    // bins
    applyMatrices(binRef.current, f.bins, (p, o) => {
      o.position.set(p.x, 0.48, p.z);
      o.rotation.set(0, p.r, 0);
      o.scale.set(1, 1, 1);
    });
  }, [f]);

  useFrame(() => {
    const h = useGame.getState().dayT * 24;
    const target = nightFactor(h);
    if (lampMat.current) {
      lampMat.current.emissiveIntensity += (target * 2.6 - lampMat.current.emissiveIntensity) * 0.06;
    }
  });

  const nTrees = f.trees.length;
  const nLights = f.streetlights.length;
  const nBenches = f.benches.length;
  const nBins = f.bins.length;

  return (
    <group>
      {nTrees > 0 && (
        <>
          <instancedMesh
            ref={trunkRef}
            args={[undefined, undefined, nTrees]}
            frustumCulled={false}
            castShadow
          >
            <cylinderGeometry args={[0.18, 0.3, 3, 6]} />
            <meshStandardMaterial color="#5d4230" roughness={1} />
          </instancedMesh>
          <instancedMesh
            ref={foliageRef}
            args={[undefined, undefined, nTrees]}
            frustumCulled={false}
            castShadow
          >
            <icosahedronGeometry args={[2, 0]} />
            <meshStandardMaterial vertexColors roughness={0.95} flatShading />
          </instancedMesh>
        </>
      )}

      {nLights > 0 && (
        <>
          <instancedMesh
            ref={poleRef}
            args={[undefined, undefined, nLights]}
            frustumCulled={false}
            castShadow
          >
            <cylinderGeometry args={[0.11, 0.14, 5.2, 6]} />
            <meshStandardMaterial color="#2b2f36" roughness={0.6} metalness={0.5} />
          </instancedMesh>
          <instancedMesh
            ref={lampRef}
            args={[undefined, undefined, nLights]}
            frustumCulled={false}
          >
            <sphereGeometry args={[0.42, 8, 8]} />
            <meshStandardMaterial
              ref={lampMat}
              color="#fff0c0"
              emissive="#ffd07a"
              emissiveIntensity={0}
              roughness={0.35}
            />
          </instancedMesh>
        </>
      )}

      {nBenches > 0 && (
        <>
          <instancedMesh
            ref={seatRef}
            args={[undefined, undefined, nBenches]}
            frustumCulled={false}
            castShadow
          >
            <boxGeometry args={[1.7, 0.12, 0.5]} />
            <meshStandardMaterial color="#7c5a38" roughness={0.9} />
          </instancedMesh>
          <instancedMesh
            ref={backRef}
            args={[undefined, undefined, nBenches]}
            frustumCulled={false}
            castShadow
          >
            <boxGeometry args={[1.7, 0.5, 0.1]} />
            <meshStandardMaterial color="#6f5031" roughness={0.9} />
          </instancedMesh>
        </>
      )}

      {nBins > 0 && (
        <instancedMesh
          ref={binRef}
          args={[undefined, undefined, nBins]}
          frustumCulled={false}
          castShadow
        >
          <cylinderGeometry args={[0.32, 0.28, 0.95, 8]} />
          <meshStandardMaterial color="#38463b" roughness={0.85} metalness={0.15} />
        </instancedMesh>
      )}
    </group>
  );
}
