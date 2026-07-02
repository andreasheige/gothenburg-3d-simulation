import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '@/state/store';
import { useWeather } from '@/state/weather';

const MAX = 900;
const R = 60; // horizontal spread around the player
const TOP = 48; // spawn height
const tmp = new THREE.Object3D();

interface Drop {
  x: number;
  y: number;
  z: number;
}

// Instanced precipitation around the player. Streaks for rain, drifting flakes
// for snow. Count + fall speed scale with the live Open-Meteo reading.
export function Rain(): React.JSX.Element {
  const ref = useRef<THREE.InstancedMesh>(null);

  const drops = useMemo<Drop[]>(() => {
    const arr: Drop[] = [];
    for (let i = 0; i < MAX; i++) {
      arr.push({ x: (Math.random() - 0.5) * 2 * R, y: Math.random() * TOP, z: (Math.random() - 0.5) * 2 * R });
    }
    return arr;
  }, []);

  useFrame((_, dtRaw) => {
    const mesh = ref.current;
    if (!mesh) return;
    const wx = useWeather.getState();
    const active = wx.rain || wx.snow;
    mesh.visible = active;
    if (!active) return;
    const dt = Math.min(dtRaw, 0.05);
    const snow = wx.snow;
    const fall = snow ? 4 : 26 + Math.min(wx.precip, 4) * 6;
    const windX = (snow ? 0.6 : 1.2) * wx.windMs;
    // number of drops shown scales with precipitation intensity
    const count = Math.max(120, Math.min(MAX, Math.round(160 + wx.precip * 260 + (snow ? 300 : 0))));
    const slant = Math.atan2(windX, fall);
    const len = snow ? 0.14 : 1.1 + Math.min(wx.precip, 3) * 0.5;

    for (let i = 0; i < count; i++) {
      const d = drops[i]!;
      d.y -= fall * dt;
      d.x += windX * dt;
      if (d.y < 0) {
        d.y = TOP;
        d.x = (Math.random() - 0.5) * 2 * R;
        d.z = (Math.random() - 0.5) * 2 * R;
      }
      // wrap horizontally so the field stays centred on the player
      let rx = d.x;
      if (rx > R) rx -= 2 * R;
      if (rx < -R) rx += 2 * R;
      tmp.position.set(player.x + rx, d.y, player.z + d.z);
      tmp.rotation.set(0, 0, snow ? 0 : slant);
      tmp.scale.set(snow ? 0.9 : 1, len, snow ? 0.9 : 1);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    // hide the unused tail of the instance buffer
    tmp.scale.set(0, 0, 0);
    tmp.updateMatrix();
    for (let i = count; i < MAX; i++) mesh.setMatrixAt(i, tmp.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX]} frustumCulled={false}>
      <boxGeometry args={[0.05, 1, 0.05]} />
      <meshBasicMaterial color="#cdd9e6" transparent opacity={0.55} />
    </instancedMesh>
  );
}
