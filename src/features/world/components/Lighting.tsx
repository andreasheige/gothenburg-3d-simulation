import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame, player } from '@/state/store';

// Sky / fog end-points for the day-night cycle so daylight actually looks like
// day instead of the scene reading as perpetual night.
const DAY_SKY = new THREE.Color('#9cc0dc');
const NIGHT_SKY = new THREE.Color('#0b1622');
const DAY_FOG = new THREE.Color('#c1d6e4');
const NIGHT_FOG = new THREE.Color('#0b1622');

// Animated sun/moon + ambient driven by the in-game clock. The key light follows
// the player so a modest shadow map covers the visible area crisply.
export function Lighting(): React.JSX.Element {
  const sun = useRef<THREE.DirectionalLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const dir = useRef(new THREE.Vector3()).current;
  const { scene } = useThree();
  const skyCol = useRef(new THREE.Color()).current;
  const fogCol = useRef(new THREE.Color()).current;

  useFrame(() => {
    const dayT = useGame.getState().dayT;
    const ang = dayT * Math.PI * 2 - Math.PI / 2; // 0.25 -> sunrise-ish
    const elev = Math.sin(ang);
    const day = THREE.MathUtils.clamp(elev, 0, 1);
    // brighter through dawn/dusk so twilight is still clearly lit
    const sky = THREE.MathUtils.clamp(elev * 1.7 + 0.55, 0, 1);

    dir.set(Math.cos(ang) * 0.6, Math.max(0.15, elev), Math.sin(ang) * 0.35 + 0.4).normalize();

    if (sun.current) {
      sun.current.position.set(player.x + dir.x * 90, 40 + dir.y * 70, player.z + dir.z * 90);
      sun.current.target.position.set(player.x, 0, player.z);
      sun.current.target.updateMatrixWorld();
      // warm at day, cool but still readable at night
      sun.current.intensity = 0.55 + day * 1.25;
      sun.current.color.setHSL(0.09 + (1 - day) * 0.02, 0.5, 0.6 + day * 0.25);
    }
    if (amb.current) amb.current.intensity = 0.6 + day * 0.35;
    if (hemi.current) hemi.current.intensity = 0.55 + day * 0.5;

    // Drive sky + fog colour from the clock so the city is visible day and night.
    skyCol.copy(NIGHT_SKY).lerp(DAY_SKY, sky);
    fogCol.copy(NIGHT_FOG).lerp(DAY_FOG, sky);
    scene.background = skyCol;
    if (scene.fog) scene.fog.color.copy(fogCol);
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0.7} />
      <hemisphereLight ref={hemi} args={['#bcd3ff', '#3a4038', 0.7]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={1.4}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-70, 70, 70, -70, 1, 260]} />
      </directionalLight>
    </>
  );
}
