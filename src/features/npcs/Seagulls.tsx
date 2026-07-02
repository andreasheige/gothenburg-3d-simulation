import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tx, tz } from '@/core/config/world';

const N = 34;
const tmp = new THREE.Object3D();

// Roosts near the river and central plazas.
const ROOSTS: readonly [number, number][] = [
  [tx(30), tz(10)], [tx(20), tz(10)], [tx(46), tz(10)], [tx(62), tz(10)],
  [tx(18), tz(13)], [tx(30), tz(18)],
];

interface Bird {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  home: readonly [number, number];
}

export function Seagulls(): React.JSX.Element {
  const ref = useRef<THREE.InstancedMesh>(null);
  const birds = useMemo<Bird[]>(
    () =>
      Array.from({ length: N }, () => {
        const r = ROOSTS[(Math.random() * ROOSTS.length) | 0]!;
        return {
          x: r[0] + (Math.random() - 0.5) * 30,
          y: 8 + Math.random() * 10,
          z: r[1] + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 4,
          vy: 0,
          vz: (Math.random() - 0.5) * 4,
          home: r,
        };
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    birds.forEach((b, i) => {
      tmp.position.set(b.x, b.y, b.z);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [birds]);

  useFrame((_, dtRaw) => {
    const mesh = ref.current;
    if (!mesh) return;
    const dt = Math.min(dtRaw, 0.05);
    for (let i = 0; i < birds.length; i++) {
      const b = birds[i]!;
      let ax = 0;
      let az = 0;
      let ay = 0;
      let cx = 0;
      let cz = 0;
      let n = 0;
      for (let j = 0; j < birds.length; j++) {
        if (i === j) continue;
        const o = birds[j]!;
        const dx = b.x - o.x;
        const dz = b.z - o.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < 25 && d2 > 0.001) {
          ax += dx / d2;
          az += dz / d2;
        } // separation
        if (d2 < 400) {
          cx += o.x;
          cz += o.z;
          n++;
        } // cohesion sample
      }
      if (n > 0) {
        ax += (cx / n - b.x) * 0.002;
        az += (cz / n - b.z) * 0.002;
      }
      // return toward home roost + hover altitude
      ax += (b.home[0] - b.x) * 0.01;
      az += (b.home[1] - b.z) * 0.01;
      ay += (10 - b.y) * 0.4;
      b.vx += ax * dt * 6;
      b.vz += az * dt * 6;
      b.vy += ay * dt;
      // clamp speed
      const sp = Math.hypot(b.vx, b.vz) || 1;
      const max = 7;
      if (sp > max) {
        b.vx = (b.vx / sp) * max;
        b.vz = (b.vz / sp) * max;
      }
      b.vy = THREE.MathUtils.clamp(b.vy, -3, 3);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;

      tmp.position.set(b.x, b.y, b.z);
      tmp.rotation.set(0, Math.atan2(b.vx, b.vz), Math.sin(performance.now() * 0.02 + i) * 0.4);
      tmp.scale.setScalar(1);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      {/* simple gull: a flattened diamond */}
      <coneGeometry args={[0.5, 1.4, 4]} />
      <meshStandardMaterial color="#e8ecef" />
    </instancedMesh>
  );
}
