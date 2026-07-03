import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/state/store';
import { useKeyPress } from '@/shared/hooks/useKeyPress';
import { Character } from '@/shared/three/Character';
import { BillboardLabel } from '@/shared/three/BillboardLabel';
import { useWalker } from './useWalker';
import type { ItemId } from '@/core/types';

const camDesired = new THREE.Vector3();
const camTarget = new THREE.Vector3();

// Hall dimensions (metres). Feskekörka is a tall, church-like fish hall.
const HALL = { W: 30, D: 22, H: 9 } as const;
const DOOR_Z = HALL.D / 2 - 0.6;

interface Zone {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  readonly reach: number;
  readonly item?: ItemId;
  readonly bonus?: number;
  readonly label: string;
}

const BACK = -HALL.D / 2 + 3;

const ZONES: readonly Zone[] = [
  { id: 'fisk', x: -9, z: BACK, reach: 3.2, item: 'fish', bonus: 5, label: 'Köp färsk fisk — Fiskdisken' },
  { id: 'rak', x: 9, z: BACK, reach: 3.2, item: 'rakmacka', bonus: 5, label: 'Köp räksmörgås — Skaldjursdisken' },
  { id: 'chips', x: 0, z: -2, reach: 3.2, item: 'fishchips', bonus: 6, label: 'Köp fish & chips — Kajutan' },
  { id: 'exit', x: 0, z: DOOR_Z - 1, reach: 2.6, label: 'Gå ut på gatan' },
];

/** A vendor standing behind a counter. */
function Vendor({ x, z, color }: { x: number; z: number; color: string }): React.JSX.Element {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.85, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.26, 12, 12]} />
        <meshStandardMaterial color="#e6b98f" roughness={0.8} />
      </mesh>
      {/* white apron */}
      <mesh position={[0, 0.85, 0.28]}>
        <boxGeometry args={[0.55, 0.9, 0.06]} />
        <meshStandardMaterial color="#eef2f4" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** A fish counter: display case on crushed ice with a few catches. */
function FishCounter({ x, z, sign, color }: { x: number; z: number; sign: string; color: string }): React.JSX.Element {
  const fish = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        fx: (i - 3) * 0.7,
        c: ['#b7c2c8', '#d8a0a0', '#c9a24f', '#9fb0b8', '#e0b0b0'][i % 5]!,
      })),
    [],
  );
  return (
    <group position={[x, 0, z]}>
      {/* counter body */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 1.1, 1.6]} />
        <meshStandardMaterial color="#3a4a52" roughness={0.6} />
      </mesh>
      {/* ice bed */}
      <mesh position={[0, 1.16, 0.1]}>
        <boxGeometry args={[5.2, 0.14, 1.3]} />
        <meshStandardMaterial color="#dfeef5" roughness={0.4} metalness={0.1} emissive="#9fc4d6" emissiveIntensity={0.15} />
      </mesh>
      {/* catches */}
      {fish.map((f, i) => (
        <mesh key={i} position={[f.fx, 1.28, 0.1]} rotation={[0, i * 0.5, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.12, 0.42, 4, 6]} />
          <meshStandardMaterial color={f.c} roughness={0.5} metalness={0.15} />
        </mesh>
      ))}
      {/* glass sneeze-guard */}
      <mesh position={[0, 1.7, 0.1]}>
        <boxGeometry args={[5.3, 0.9, 1.35]} />
        <meshStandardMaterial color="#bfe0ea" transparent opacity={0.14} roughness={0.05} metalness={0.3} />
      </mesh>
      <BillboardLabel position={[0, 2.6, 0]} fontSize={0.5} color={color} outlineWidth={0.05}>
        {sign}
      </BillboardLabel>
    </group>
  );
}

/** The Kajutan fish & chips kiosk in the middle of the hall. */
function ChipsKiosk({ z }: { z: number }): React.JSX.Element {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.2, 2]} />
        <meshStandardMaterial color="#b23b2e" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[4.3, 0.12, 2.3]} />
        <meshStandardMaterial color="#efe6d2" />
      </mesh>
      {/* fryer heat glow */}
      <mesh position={[1.2, 1.35, 0]}>
        <boxGeometry args={[1.2, 0.2, 1.2]} />
        <meshStandardMaterial color="#e8c060" emissive="#e8a020" emissiveIntensity={0.5} />
      </mesh>
      {/* awning */}
      <mesh position={[0, 2.2, 0.9]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[4.2, 0.1, 1.2]} />
        <meshStandardMaterial color="#e8c060" />
      </mesh>
      <BillboardLabel position={[0, 2.9, 0]} fontSize={0.55} color="#ffe0a0" outlineWidth={0.05}>
        Kajutan · Fish & Chips
      </BillboardLabel>
    </group>
  );
}

export function FishMarketInterior(): React.JSX.Element {
  const { camera } = useThree();
  const walker = useWalker({ x: 0, z: DOOR_Z - 3, angle: Math.PI });
  const zone = useRef<Zone | null>(null);
  const lastKey = useRef('');

  useKeyPress('e', () => {
    const s = useGame.getState();
    const z = zone.current;
    if (!z) return;
    if (z.id === 'exit') s.exitInterior();
    else if (z.item) s.buyItem(z.item, z.bonus ?? 4);
  });

  useEffect(() => {
    useGame.getState().setNearby(null);
  }, []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    walker.update(dt, HALL.W / 2 - 1, HALL.D / 2 - 1);
    const p = walker.pos;

    const camZ = Math.min(HALL.D / 2 - 1.5, p.z + 8);
    camDesired.set(p.x * 0.5, 6, camZ);
    camera.position.lerp(camDesired, 1 - Math.pow(0.002, dt));
    camTarget.set(p.x * 0.4, 1.6, p.z - 4);
    camera.lookAt(camTarget);

    let best: Zone | null = null;
    let bestD = Infinity;
    for (const z of ZONES) {
      const d = Math.hypot(p.x - z.x, p.z - z.z);
      if (d < z.reach && d < bestD) {
        best = z;
        bestD = d;
      }
    }
    zone.current = best;
    const key = best ? best.id : '';
    if (key !== lastKey.current) {
      lastKey.current = key;
      useGame.getState().setNearby(best ? { kind: best.id === 'exit' ? 'exit' : 'buy', label: best.label } : null);
    }
  });

  return (
    <group>
      {/* daylight */}
      <ambientLight intensity={0.65} color="#eef2f0" />
      <hemisphereLight args={['#dff0ff', '#5a5040', 0.6]} />
      <directionalLight position={[12, 18, 8]} intensity={1.1} color="#fff4e0" castShadow />

      {/* floor — worn stone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HALL.W, HALL.D]} />
        <meshStandardMaterial color="#8f8a80" roughness={0.95} />
      </mesh>

      {/* walls — pale plaster */}
      {([[-1, 0], [1, 0]] as const).map(([sx], i) => (
        <mesh key={`wx${i}`} position={[(sx * HALL.W) / 2, HALL.H / 2, 0]} receiveShadow>
          <boxGeometry args={[0.4, HALL.H, HALL.D]} />
          <meshStandardMaterial color="#c9b79c" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, HALL.H / 2, -HALL.D / 2]} receiveShadow>
        <boxGeometry args={[HALL.W, HALL.H, 0.4]} />
        <meshStandardMaterial color="#c9b79c" roughness={0.95} />
      </mesh>
      <mesh position={[0, HALL.H / 2, HALL.D / 2]} receiveShadow>
        <boxGeometry args={[HALL.W, HALL.H, 0.4]} />
        <meshStandardMaterial color="#c4b295" roughness={0.95} />
      </mesh>

      {/* pitched wooden roof (two slanted planes + ridge) — the church silhouette */}
      <mesh position={[-HALL.W / 4, HALL.H + 1.6, 0]} rotation={[0, 0, -0.62]}>
        <boxGeometry args={[HALL.W / 2 + 1.2, 0.3, HALL.D + 0.6]} />
        <meshStandardMaterial color="#6e4a30" roughness={0.9} />
      </mesh>
      <mesh position={[HALL.W / 4, HALL.H + 1.6, 0]} rotation={[0, 0, 0.62]}>
        <boxGeometry args={[HALL.W / 2 + 1.2, 0.3, HALL.D + 0.6]} />
        <meshStandardMaterial color="#6e4a30" roughness={0.9} />
      </mesh>
      {/* exposed trusses */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`tr${i}`} position={[0, HALL.H + 0.2, -HALL.D / 2 + 3 + i * 4]} rotation={[0, 0, 0]}>
          <boxGeometry args={[HALL.W - 1, 0.25, 0.25]} />
          <meshStandardMaterial color="#5a3f2a" />
        </mesh>
      ))}

      {/* tall arched windows glowing with daylight on both long walls */}
      {Array.from({ length: 4 }).map((_, i) => {
        const zz = -HALL.D / 2 + 4 + i * 4.5;
        return (
          <group key={`win${i}`}>
            <mesh position={[-HALL.W / 2 + 0.25, 4.2, zz]}>
              <planeGeometry args={[0.1, 3.4]} />
              <meshBasicMaterial color="#fff6e0" />
            </mesh>
            <mesh position={[HALL.W / 2 - 0.25, 4.2, zz]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.1, 3.4]} />
              <meshBasicMaterial color="#fff6e0" />
            </mesh>
            <pointLight position={[-HALL.W / 2 + 1.5, 4.5, zz]} intensity={0.5} distance={10} color="#fff2d8" />
            <pointLight position={[HALL.W / 2 - 1.5, 4.5, zz]} intensity={0.5} distance={10} color="#fff2d8" />
          </group>
        );
      })}

      {/* hanging lamps */}
      {[-6, 0, 6].map((x) => (
        <group key={`lamp${x}`} position={[x, HALL.H - 1.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshStandardMaterial color="#fff" emissive="#ffe4a0" emissiveIntensity={0.9} />
          </mesh>
          <pointLight intensity={1.2} distance={12} color="#ffe9c0" />
        </group>
      ))}

      {/* the two fish counters + vendors */}
      <FishCounter x={-9} z={BACK} sign="Fiskdisken" color="#2a6b8f" />
      <Vendor x={-9} z={BACK - 1} color="#2b4a7a" />
      <FishCounter x={9} z={BACK} sign="Skaldjur · Räkor" color="#b23b2e" />
      <Vendor x={9} z={BACK - 1} color="#8a3a3a" />

      {/* fish & chips kiosk + vendor */}
      <ChipsKiosk z={-2} />
      <Vendor x={0} z={-3.1} color="#7a2f2f" />

      {/* big Feskekörka sign over the back wall */}
      <BillboardLabel position={[0, HALL.H - 1.2, -HALL.D / 2 + 0.6]} fontSize={0.9} color="#3a6b8f" outlineWidth={0.06}>
        Feskekörka
      </BillboardLabel>

      {/* exit */}
      <group position={[0, 0, DOOR_Z]}>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[2.6, 3, 0.14]} />
          <meshStandardMaterial color="#3a2a1c" emissive="#39ff88" emissiveIntensity={0.25} />
        </mesh>
      </group>

      <Character
        groupRef={walker.avatarRef}
        legLRef={walker.legLRef}
        legRRef={walker.legRRef}
        colors={{ coat: '#2e6e8c' }}
      />
    </group>
  );
}
