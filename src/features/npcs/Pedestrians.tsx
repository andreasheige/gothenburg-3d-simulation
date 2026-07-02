import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { project } from '@/domain/geo/meta';
import { geo } from '@/core/systems/geoWorld';
import { registry } from '@/core/systems/registry';

const N = 150;
// Spawn crowds around several real central hubs so districts feel alive instead
// of a handful of pedestrians scattered thinly across the whole map.
const HUBS = [
  project(11.967, 57.7072), // Brunnsparken
  project(11.9646, 57.705), // Nordstan / Domkyrkan
  project(11.9793, 57.6975), // Götaplatsen / Avenyn
  project(11.9673, 57.6997), // Kungsportsplatsen
  project(11.9558, 57.6997), // Järntorget / Haga
  project(11.9557, 57.6996), // Feskekörka
] as const;
const SPREAD = 130; // per-hub radius
const tmpBody = new THREE.Object3D();
const tmpHead = new THREE.Object3D();
const col = new THREE.Color();

const COAT_COLORS = ['#2f3b52', '#4a3b2f', '#3a3a44', '#5a4152', '#2f4a3b', '#603a3a', '#3a4a5a'];
const SKIN = ['#e0b48f', '#c98f6a', '#b57a52', '#e8c4a0'];

interface Ped {
  x: number;
  z: number;
  angle: number;
  speed: number;
  tx: number;
  tz: number;
  wait: number;
  hx: number;
  hz: number;
  coat: number;
  skin: number;
  tourist: boolean;
  harassed: number;
}

// Wandering pedestrians (commuters + tourists). Tourists are registered for pickpocketing.
export function Pedestrians(): React.JSX.Element {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);

  const peds = useMemo<Ped[]>(() => {
    const w = geo();
    const arr: Ped[] = [];
    for (let i = 0; i < N; i++) {
      const hub = HUBS[i % HUBS.length]!;
      // spawn on a walkable spot near a central hub
      let x: number;
      let z: number;
      let tries = 0;
      do {
        x = hub.x + (Math.random() - 0.5) * 2 * SPREAD;
        z = hub.z + (Math.random() - 0.5) * 2 * SPREAD;
        tries++;
      } while (w.blocked(x, z, 0.6) && tries < 60);
      const tourist = i % 3 === 0;
      const p: Ped = {
        x,
        z,
        angle: Math.random() * Math.PI * 2,
        speed: 1.4 + Math.random() * 1.2,
        tx: x,
        tz: z,
        wait: 0,
        hx: hub.x,
        hz: hub.z,
        coat: col.clone().set(COAT_COLORS[i % COAT_COLORS.length]!).getHex(),
        skin: col.clone().set(SKIN[i % SKIN.length]!).getHex(),
        tourist,
        harassed: 0,
      };
      arr.push(p);
      if (tourist) registry.tourists.push(p);
    }
    return arr;
  }, []);

  useLayoutEffect(
    () => () => {
      registry.tourists.length = 0;
    },
    [],
  );

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const head = headRef.current;
    if (!body || !head) return;
    peds.forEach((p, i) => {
      body.setColorAt(i, col.setHex(p.coat));
      head.setColorAt(i, col.setHex(p.skin));
    });
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    if (head.instanceColor) head.instanceColor.needsUpdate = true;
  }, [peds]);

  function pickTarget(p: Ped): void {
    p.tx = p.hx + (Math.random() - 0.5) * 2 * SPREAD;
    p.tz = p.hz + (Math.random() - 0.5) * 2 * SPREAD;
  }

  useFrame((state, dtRaw) => {
    const body = bodyRef.current;
    const head = headRef.current;
    if (!body || !head) return;
    const w = geo();
    const dt = Math.min(dtRaw, 0.05);
    for (let i = 0; i < peds.length; i++) {
      const p = peds[i]!;
      if (p.wait > 0) {
        p.wait -= dt;
      } else {
        const dx = p.tx - p.x;
        const dz = p.tz - p.z;
        const d = Math.hypot(dx, dz);
        if (d < 1.2) {
          p.wait = 0.5 + Math.random() * 2;
          pickTarget(p);
        } else {
          const nx = p.x + (dx / d) * p.speed * dt;
          const nz = p.z + (dz / d) * p.speed * dt;
          if (!w.blocked(nx, p.z, 0.5)) p.x = nx;
          else pickTarget(p);
          if (!w.blocked(p.x, nz, 0.5)) p.z = nz;
          else pickTarget(p);
          p.angle = Math.atan2(dx, dz);
        }
      }
      const bob = Math.sin(state.clock.elapsedTime * 6 + i) * 0.05;
      tmpBody.position.set(p.x, 0.9 + bob, p.z);
      tmpBody.rotation.set(0, p.angle, 0);
      tmpBody.scale.set(1, 1, 1);
      tmpBody.updateMatrix();
      body.setMatrixAt(i, tmpBody.matrix);

      tmpHead.position.set(p.x, 1.85 + bob, p.z);
      tmpHead.rotation.set(0, p.angle, 0);
      tmpHead.updateMatrix();
      head.setMatrixAt(i, tmpHead.matrix);
    }
    body.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, N]} frustumCulled={false} castShadow>
        <capsuleGeometry args={[0.32, 0.9, 4, 8]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, N]} frustumCulled={false} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
    </group>
  );
}
