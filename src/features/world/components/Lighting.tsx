import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame, player } from '@/state/store';

// Animated sun/moon + ambient driven by the in-game clock. The key light follows
// the player so a modest shadow map covers the visible area crisply.
export function Lighting(): React.JSX.Element {
  const sun = useRef<THREE.DirectionalLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const dir = useRef(new THREE.Vector3()).current;

  useFrame(() => {
    const dayT = useGame.getState().dayT;
    const ang = dayT * Math.PI * 2 - Math.PI / 2; // 0.25 -> sunrise-ish
    const elev = Math.sin(ang);
    const day = THREE.MathUtils.clamp(elev, 0, 1);

    dir.set(Math.cos(ang) * 0.6, Math.max(0.15, elev), Math.sin(ang) * 0.35 + 0.4).normalize();

    if (sun.current) {
      sun.current.position.set(player.x + dir.x * 90, 40 + dir.y * 70, player.z + dir.z * 90);
      sun.current.target.position.set(player.x, 0, player.z);
      sun.current.target.updateMatrixWorld();
      // warm at day, cool dim at night
      sun.current.intensity = 0.25 + day * 1.35;
      sun.current.color.setHSL(0.09 + (1 - day) * 0.02, 0.5, 0.6 + day * 0.25);
    }
    if (amb.current) amb.current.intensity = 0.28 + day * 0.42;
    if (hemi.current) hemi.current.intensity = 0.3 + day * 0.5;
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0.4} />
      <hemisphereLight ref={hemi} args={['#bcd3ff', '#2a2620', 0.5]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={1.2}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-70, 70, 70, -70, 1, 260]} />
      </directionalLight>
    </>
  );
}
