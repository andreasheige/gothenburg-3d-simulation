import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { geo } from '@/core/systems/geoWorld';
import { useGame } from '@/state/store';

// Debug height for the collision volumes — tall enough to read clearly from the
// orbit camera without fully hiding the buildings underneath.
const BOX_H = 28;
// blocked() pads the player radius; show the effective wall a touch thicker.
const PAD = 0.7;

/**
 * Visualises every collision volume the world uses in {@link GeoWorld.blocked}:
 * building footprints (translucent red instanced boxes) plus the world-boundary
 * wall. Toggled with the backtick key (see the store `debug` flag). Renders
 * nothing when debug is off, so it is free in normal play.
 */
export function CollisionDebug(): React.JSX.Element | null {
  const debug = useGame((s) => s.debug);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const boxes = useMemo(() => geo().colliders, []);
  const halfX = geo().halfX;
  const halfZ = geo().halfZ;

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    boxes.forEach((b, i) => {
      const w = b.maxx - b.minx + PAD * 2;
      const d = b.maxz - b.minz + PAD * 2;
      pos.set((b.minx + b.maxx) / 2, BOX_H / 2, (b.minz + b.maxz) / 2);
      scl.set(w, BOX_H, d);
      m.compose(pos, quat, scl);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = boxes.length;
  }, [boxes, debug]);

  if (!debug) return null;

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, boxes.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#ff2d55"
          transparent
          opacity={0.22}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      {/* World-boundary wall: |x| <= halfX, |z| <= halfZ. */}
      <lineSegments position={[0, BOX_H / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(halfX * 2, BOX_H, halfZ * 2)]} />
        <lineBasicMaterial color="#ffd500" />
      </lineSegments>
    </group>
  );
}
